//! Gerenciador de Dependências Locais.
//! Windows: download do driver USB-UART (CP210x/CH340) + verificação SHA256 + instalação.
//! Linux: kernel já tem os módulos ch341/cp210x — instala regra udev e grupo dialout via pkexec.

use serde::Serialize;
use sha2::{Digest, Sha256};
use std::io::Write;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize)]
pub struct DepItem {
    pub id: String,
    pub os: String,
    pub label: String,
    pub url: Option<String>,
    /// SHA256 esperado em hex; vazio = pular verificação (pinar no piloto!)
    pub sha256: String,
    /// Página oficial do fabricante — fallback se o download direto falhar.
    pub vendor_page: String,
}

/// Manifesto embutido. URLs apontam para os fornecedores oficiais.
/// Checksums devem ser pinados antes do piloto (campo vazio = não verificado).
pub fn manifest() -> Vec<DepItem> {
    vec![
        DepItem {
            id: "cp210x".into(),
            os: "windows".into(),
            label: "Driver CP210x (Silicon Labs) — placas DevKit".into(),
            url: Some(
                "https://www.silabs.com/documents/public/software/CP210x_Universal_Windows_Driver.zip"
                    .into(),
            ),
            sha256: String::new(),
            vendor_page: "https://www.silabs.com/developer-tools/usb-to-uart-bridge-vcp-drivers".into(),
        },
        DepItem {
            id: "ch340".into(),
            os: "windows".into(),
            label: "Driver CH340/CH341 (WCH) — Wemos D1, clones".into(),
            url: None, // WCH não publica URL direta estável — abrir página oficial
            sha256: String::new(),
            vendor_page: "https://www.wch-ic.com/downloads/CH341SER_EXE.html".into(),
        },
        DepItem {
            id: "udev-rules".into(),
            os: "linux".into(),
            label: "Permissões seriais (regra udev + grupo dialout)".into(),
            url: None,
            sha256: String::new(),
            vendor_page: String::new(),
        },
    ]
}

#[derive(Debug, Clone, Serialize)]
pub struct DepProgress {
    pub id: String,
    pub stage: String, // downloading | verifying | installing | done | error | manual
    pub detail: String,
    pub percent: Option<u8>,
}

const UDEV_RULE: &str = r#"# PlantiumAI — acesso à ESP32 sem root
SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", MODE="0666"
SUBSYSTEM=="tty", ATTRS{idVendor}=="10c4", MODE="0666"
SUBSYSTEM=="tty", ATTRS{idVendor}=="303a", MODE="0666"
"#;

fn download(url: &str, dest: &PathBuf, mut progress: impl FnMut(u8)) -> Result<(), String> {
    let mut resp = reqwest::blocking::get(url).map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }
    let total = resp.content_length().unwrap_or(0);
    let mut file = std::fs::File::create(dest).map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut buf = [0u8; 65536];
    use std::io::Read;
    loop {
        let n = resp.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        file.write_all(&buf[..n]).map_err(|e| e.to_string())?;
        downloaded += n as u64;
        if total > 0 {
            progress(((downloaded * 100) / total) as u8);
        }
    }
    Ok(())
}

fn verify_sha256(path: &PathBuf, expected_hex: &str) -> Result<bool, String> {
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    let digest = hex::encode(Sha256::digest(&bytes));
    Ok(digest.eq_ignore_ascii_case(expected_hex))
}

/// Instala uma dependência. `emit` publica progresso para a UI.
pub fn install(item: &DepItem, data_dir: PathBuf, emit: impl Fn(DepProgress)) -> Result<(), String> {
    match (item.os.as_str(), item.id.as_str()) {
        ("windows", _) => {
            let Some(url) = &item.url else {
                // Sem URL direta estável: abrir a página oficial do fabricante
                emit(DepProgress {
                    id: item.id.clone(),
                    stage: "manual".into(),
                    detail: format!("Abrindo página oficial: {}", item.vendor_page),
                    percent: None,
                });
                open_url(&item.vendor_page)?;
                return Ok(());
            };
            let downloads = data_dir.join("downloads");
            std::fs::create_dir_all(&downloads).map_err(|e| e.to_string())?;
            let fname = url.rsplit('/').next().unwrap_or("driver.bin");
            let dest = downloads.join(fname);

            emit(DepProgress {
                id: item.id.clone(),
                stage: "downloading".into(),
                detail: url.clone(),
                percent: Some(0),
            });
            download(url, &dest, |p| {
                emit(DepProgress {
                    id: item.id.clone(),
                    stage: "downloading".into(),
                    detail: String::new(),
                    percent: Some(p),
                })
            })?;

            if !item.sha256.is_empty() {
                emit(DepProgress {
                    id: item.id.clone(),
                    stage: "verifying".into(),
                    detail: "SHA256".into(),
                    percent: None,
                });
                if !verify_sha256(&dest, &item.sha256)? {
                    let _ = std::fs::remove_file(&dest);
                    return Err("Checksum SHA256 não confere — download descartado".into());
                }
            }

            emit(DepProgress {
                id: item.id.clone(),
                stage: "installing".into(),
                detail: dest.display().to_string(),
                percent: None,
            });
            // Abre o instalador/zip baixado (UAC do Windows assume a elevação)
            open_path(&dest)?;
            emit(DepProgress {
                id: item.id.clone(),
                stage: "done".into(),
                detail: "Instalador iniciado".into(),
                percent: Some(100),
            });
            Ok(())
        }
        ("linux", "udev-rules") => {
            emit(DepProgress {
                id: item.id.clone(),
                stage: "installing".into(),
                detail: "Gravando /etc/udev/rules.d/99-plantium.rules (pkexec)".into(),
                percent: None,
            });
            let script = format!(
                "printf '%s' '{rule}' > /etc/udev/rules.d/99-plantium.rules && \
                 udevadm control --reload-rules && udevadm trigger && \
                 usermod -aG dialout \"$PKEXEC_UID_USER\" 2>/dev/null; \
                 gpasswd -a \"$(logname)\" dialout 2>/dev/null; true",
                rule = UDEV_RULE.replace('\'', "'\\''")
            );
            let status = std::process::Command::new("pkexec")
                .arg("sh")
                .arg("-c")
                .arg(script)
                .status()
                .map_err(|e| format!("pkexec indisponível: {e}"))?;
            if !status.success() {
                return Err("Instalação cancelada ou falhou (pkexec)".into());
            }
            emit(DepProgress {
                id: item.id.clone(),
                stage: "done".into(),
                detail: "Reconecte a ESP32. Pode ser necessário relogar para o grupo dialout.".into(),
                percent: Some(100),
            });
            Ok(())
        }
        _ => Err(format!("Dependência desconhecida: {}/{}", item.os, item.id)),
    }
}

fn open_url(url: &str) -> Result<(), String> {
    open_path(&PathBuf::from(url))
}

#[cfg(target_os = "windows")]
fn open_path(path: &PathBuf) -> Result<(), String> {
    std::process::Command::new("cmd")
        .args(["/C", "start", "", &path.display().to_string()])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn open_path(path: &PathBuf) -> Result<(), String> {
    std::process::Command::new("xdg-open")
        .arg(path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

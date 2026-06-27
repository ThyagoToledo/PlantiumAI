//! Comunicação serial com a ESP32.
//! Leitura de frames NDJSON em thread dedicada com reconexão por backoff.
//! Detecção do chip USB-UART por VID/PID (CH340 = 1A86:7523, CP210x = 10C4:EA60).

use serde::Serialize;
use serialport::{SerialPortType, UsbPortInfo};
use std::io::{BufRead, BufReader, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

pub const BAUD_RATE: u32 = 115_200;

#[derive(Debug, Clone, Serialize)]
pub struct PortInfo {
    pub name: String,
    pub chip: String,
    pub vid: Option<u16>,
    pub pid: Option<u16>,
    pub description: String,
}

fn identify_chip(usb: &UsbPortInfo) -> &'static str {
    match (usb.vid, usb.pid) {
        (0x1A86, 0x7523) | (0x1A86, 0x55D4) => "CH340 (WCH)",
        (0x10C4, 0xEA60) => "CP210x (Silicon Labs)",
        (0x303A, _) => "ESP32 USB nativo (Espressif)",
        (0x0403, _) => "FTDI",
        _ => "Desconhecido",
    }
}

/// Lista portas seriais disponíveis com identificação do chip.
pub fn list_ports() -> Vec<PortInfo> {
    serialport::available_ports()
        .unwrap_or_default()
        .into_iter()
        .map(|p| match &p.port_type {
            SerialPortType::UsbPort(usb) => PortInfo {
                name: p.port_name.clone(),
                chip: identify_chip(usb).to_string(),
                vid: Some(usb.vid),
                pid: Some(usb.pid),
                description: usb.product.clone().unwrap_or_default(),
            },
            _ => PortInfo {
                name: p.port_name.clone(),
                chip: "Não-USB".into(),
                vid: None,
                pid: None,
                description: String::new(),
            },
        })
        .collect()
}

#[derive(Debug, Clone, Serialize)]
pub struct ConnStatus {
    pub state: String, // connected | reconnecting | disconnected
    pub port: String,
    pub detail: String,
}

/// Inicia a thread leitora. `on_line` recebe cada linha NDJSON; `on_status`
/// recebe mudanças de estado da conexão. `stop` encerra a thread.
pub fn spawn_reader(
    port_name: String,
    stop: Arc<AtomicBool>,
    write_rx: std::sync::mpsc::Receiver<Vec<u8>>,
    on_line: impl Fn(String) + Send + 'static,
    on_status: impl Fn(ConnStatus) + Send + 'static,
) {
    std::thread::spawn(move || {
        let mut backoff_ms: u64 = 500;
        while !stop.load(Ordering::Relaxed) {
            match serialport::new(&port_name, BAUD_RATE)
                .timeout(Duration::from_millis(100))
                .open()
            {
                Ok(port) => {
                    backoff_ms = 500;
                    on_status(ConnStatus {
                        state: "connected".into(),
                        port: port_name.clone(),
                        detail: format!("{BAUD_RATE} baud"),
                    });
                    let mut reader = BufReader::new(port);
                    let mut line = String::new();
                    loop {
                        if stop.load(Ordering::Relaxed) {
                            on_status(ConnStatus {
                                state: "disconnected".into(),
                                port: port_name.clone(),
                                detail: "encerrado pelo usuário".into(),
                            });
                            return;
                        }

                        // Verifica se ha comandos a serem escritos
                        while let Ok(data) = write_rx.try_recv() {
                            let inner_port = reader.get_mut();
                            if let Err(e) = inner_port.write_all(&data) {
                                eprintln!("[serial] erro ao escrever: {e}");
                            } else {
                                let _ = inner_port.flush();
                            }
                        }

                        line.clear();
                        match reader.read_line(&mut line) {
                            Ok(0) => break, // EOF — porta caiu
                            Ok(_) => {
                                let trimmed = line.trim();
                                if !trimmed.is_empty() {
                                    on_line(trimmed.to_string());
                                }
                            }
                            Err(e) if e.kind() == std::io::ErrorKind::TimedOut => continue,
                            Err(_) => break, // erro de I/O — cabo removido etc.
                        }
                    }
                }
                Err(e) => {
                    on_status(ConnStatus {
                        state: "reconnecting".into(),
                        port: port_name.clone(),
                        detail: e.to_string(),
                    });
                }
            }
            // Reconexão com backoff exponencial (máx 8s)
            std::thread::sleep(Duration::from_millis(backoff_ms));
            backoff_ms = (backoff_ms * 2).min(8_000);
        }
        on_status(ConnStatus {
            state: "disconnected".into(),
            port: port_name.clone(),
            detail: "encerrado".into(),
        });
    });
}

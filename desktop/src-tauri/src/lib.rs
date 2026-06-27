//! PlantiumAI Desktop — núcleo Tauri.
//! Fontes de dados (simulador | serial) emitem eventos para a UI e persistem em SQLite.

mod db;
mod deps;
mod domain;
mod irrigation;
mod serial;
mod sim;

use db::DbHandle;
use domain::{process_reading, ReadingEvent, SensorReading};
use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_dialog::DialogExt;

/// Perfil da planta monitorada (defaults do legado).
#[derive(Debug, Clone, Serialize)]
pub struct PlantProfile {
    pub name: String,
    pub ideal_moisture_min: f64,
    pub ideal_moisture_max: f64,
}

impl Default for PlantProfile {
    fn default() -> Self {
        Self {
            name: "Planta".into(),
            ideal_moisture_min: 35.0,
            ideal_moisture_max: 65.0,
        }
    }
}

struct AppState {
    db: DbHandle,
    profile: Mutex<PlantProfile>,
    /// Flag de parada da fonte de dados ativa (simulador ou serial).
    active_stop: Mutex<Option<Arc<AtomicBool>>>,
    last_reading: Mutex<Option<SensorReading>>,
    serial_tx: Mutex<Option<std::sync::mpsc::Sender<Vec<u8>>>>,
}

impl AppState {
    /// Para a fonte atual e registra a nova flag de parada.
    fn swap_source(&self, new_stop: Arc<AtomicBool>) {
        let mut guard = self.active_stop.lock().unwrap();
        if let Some(old) = guard.take() {
            old.store(true, Ordering::Relaxed);
        }
        *guard = Some(new_stop);
        let mut tx_guard = self.serial_tx.lock().unwrap();
        *tx_guard = None;
    }

    fn stop_source(&self) {
        let mut guard = self.active_stop.lock().unwrap();
        if let Some(old) = guard.take() {
            old.store(true, Ordering::Relaxed);
        }
        let mut tx_guard = self.serial_tx.lock().unwrap();
        *tx_guard = None;
    }
}

/// Processa uma leitura (validação + alerta), persiste e emite para a UI.
fn ingest(app: &AppHandle, reading: SensorReading) {
    let state: State<AppState> = app.state();
    let profile = state.profile.lock().unwrap().clone();
    let event: ReadingEvent = process_reading(
        reading,
        &profile.name,
        profile.ideal_moisture_min,
        profile.ideal_moisture_max,
    );
    state.db.insert(event.reading.clone());
    if let Some(alert) = &event.alert {
        state.db.insert_alert(alert.clone());
        let _ = app.emit("sensor:alert", alert);

        // --- Logica de Notificacao Nativa ---
        if alert.severity == "critical" {
            let notify_enabled = state
                .db
                .load_setting("notifications_enabled")
                .unwrap_or(None)
                .map(|v| v == "true")
                .unwrap_or(true);

            if notify_enabled {
                let _ = app.notification()
                    .builder()
                    .title("Alerta Critico - PlantiumAI")
                    .body(&alert.message)
                    .show();
            }

            // --- Logica de Irrigacao Automatica ---
            let auto_irrigate = state
                .db
                .load_setting("auto_irrigate")
                .unwrap_or(None)
                .map(|v| v == "true")
                .unwrap_or(false);

            if auto_irrigate {
                let cooldown_mins: i64 = state
                    .db
                    .load_setting("auto_cooldown_mins")
                    .unwrap_or(None)
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(30);

                let mut can_irrigate = true;
                if let Ok(Some(last_ts_str)) = state.db.load_setting("last_auto_irrigation_ts") {
                    if let Ok(last_ts) = last_ts_str.parse::<i64>() {
                        let now = chrono::Utc::now().timestamp_millis();
                        let diff_mins = (now - last_ts) / 1000 / 60;
                        if diff_mins < cooldown_mins {
                            can_irrigate = false;
                        }
                    }
                }

                if can_irrigate {
                    let duration_s = 30; // duracao padrao
                    let now = chrono::Utc::now().timestamp_millis();
                    let _ = state.db.save_setting("last_auto_irrigation_ts", &now.to_string());
                    let _ = state.db.insert_irrigation_log(now, duration_s, "auto");

                    // Envia comando serial se conectado
                    let tx_guard = state.serial_tx.lock().unwrap();
                    if let Some(tx) = tx_guard.as_ref() {
                        let cmd_json = serde_json::json!({
                            "cmd": "irrigate",
                            "duration_s": duration_s
                        });
                        let payload = format!("{}\n", cmd_json.to_string());
                        let _ = tx.send(payload.into_bytes());
                    }

                    // Envia alerta de acionamento automatico para UI
                    let _ = app.emit("sensor:auto_irrigate_triggered", duration_s);
                }
            }
        }
    }
    *state.last_reading.lock().unwrap() = Some(event.reading.clone());
    let _ = app.emit("sensor:reading", &event);
}

// ====================== Comandos ======================

#[tauri::command]
fn start_simulator(app: AppHandle, state: State<AppState>, interval_ms: Option<u64>) {
    let stop = Arc::new(AtomicBool::new(false));
    state.swap_source(stop.clone());
    let interval = interval_ms.unwrap_or(2000).max(200);
    let app2 = app.clone();
    std::thread::spawn(move || {
        let mut last: Option<SensorReading> = None;
        while !stop.load(Ordering::Relaxed) {
            let reading = sim::next_reading(last.as_ref());
            last = Some(reading.clone());
            ingest(&app2, reading);
            std::thread::sleep(std::time::Duration::from_millis(interval));
        }
    });
    let _ = app.emit(
        "conn:status",
        serial::ConnStatus {
            state: "connected".into(),
            port: "simulador".into(),
            detail: format!("modo demo, {interval}ms"),
        },
    );
}

#[tauri::command]
fn stop_source(app: AppHandle, state: State<AppState>) {
    state.stop_source();
    let _ = app.emit(
        "conn:status",
        serial::ConnStatus {
            state: "disconnected".into(),
            port: String::new(),
            detail: "fonte parada".into(),
        },
    );
}

#[tauri::command]
fn list_serial_ports() -> Vec<serial::PortInfo> {
    serial::list_ports()
}

#[tauri::command]
fn connect_serial(app: AppHandle, state: State<AppState>, port: String) {
    let stop = Arc::new(AtomicBool::new(false));
    state.swap_source(stop.clone());

    let (tx, rx) = std::sync::mpsc::channel::<Vec<u8>>();
    *state.serial_tx.lock().unwrap() = Some(tx);

    let app_line = app.clone();
    let app_status = app.clone();
    serial::spawn_reader(
        port,
        stop,
        rx,
        move |line| match serde_json::from_str::<SensorReading>(&line) {
            Ok(mut r) => {
                if r.source.is_empty() {
                    r.source = "esp32".into();
                }
                ingest(&app_line, r);
            }
            Err(e) => {
                let _ = app_line.emit("sensor:parse_error", format!("{e}: {line}"));
            }
        },
        move |status| {
            let _ = app_status.emit("conn:status", &status);
        },
    );
}

#[tauri::command]
fn get_history(
    state: State<AppState>,
    limit: Option<u32>,
    since_ts: Option<i64>,
) -> Result<Vec<db::HistoryRow>, String> {
    state.db.history(limit.unwrap_or(500).min(10_000), since_ts)
}

#[tauri::command]
fn irrigation_decision(state: State<AppState>) -> Result<irrigation::IrrigationDecision, String> {
    let profile = state.profile.lock().unwrap().clone();
    let last = state.last_reading.lock().unwrap().clone();
    let moisture = last
        .and_then(|r| r.soil_moisture)
        .ok_or("Sem leitura de umidade do solo disponivel")?;
    Ok(irrigation::rule_based_decision(
        moisture,
        profile.ideal_moisture_min,
        profile.ideal_moisture_max,
    ))
}

#[tauri::command]
fn get_profile(state: State<AppState>) -> PlantProfile {
    state.profile.lock().unwrap().clone()
}

#[tauri::command]
fn set_profile(state: State<AppState>, name: String, ideal_min: f64, ideal_max: f64) -> Result<(), String> {
    // Atualiza o perfil ativo na memoria
    *state.profile.lock().unwrap() = PlantProfile {
        name: name.clone(),
        ideal_moisture_min: ideal_min,
        ideal_moisture_max: ideal_max,
    };

    // Atualiza o perfil ativo no banco de dados SQLite
    if let Some(active) = state.db.get_active_profile()? {
        state.db.update_profile(active.id, &name, ideal_min, ideal_max)?;
    }
    Ok(())
}

#[tauri::command]
fn list_profiles(state: State<AppState>) -> Result<Vec<db::PlantProfileRow>, String> {
    state.db.list_profiles()
}

#[tauri::command]
fn add_profile(state: State<AppState>, name: String, ideal_min: f64, ideal_max: f64) -> Result<i64, String> {
    state.db.add_profile(&name, ideal_min, ideal_max)
}

#[tauri::command]
fn delete_profile(state: State<AppState>, id: i64) -> Result<(), String> {
    state.db.delete_profile(id)
}

#[tauri::command]
fn activate_profile(state: State<AppState>, id: i64) -> Result<(), String> {
    state.db.activate_profile(id)?;
    if let Some(p) = state.db.get_active_profile()? {
        *state.profile.lock().unwrap() = PlantProfile {
            name: p.name,
            ideal_moisture_min: p.ideal_moisture_min,
            ideal_moisture_max: p.ideal_moisture_max,
        };
    }
    Ok(())
}

#[tauri::command]
fn trigger_irrigation(state: State<AppState>, duration_s: u32) -> Result<(), String> {
    let ts = chrono::Utc::now().timestamp_millis();
    let guard = state.serial_tx.lock().unwrap();
    if let Some(tx) = guard.as_ref() {
        let cmd_json = serde_json::json!({
            "cmd": "irrigate",
            "duration_s": duration_s
        });
        let payload = format!("{}\n", cmd_json.to_string());
        let _ = tx.send(payload.into_bytes());
        state.db.insert_irrigation_log(ts, duration_s, "manual")?;
        Ok(())
    } else {
        // Se estiver simulando
        let active_stop_guard = state.active_stop.lock().unwrap();
        if active_stop_guard.is_some() {
            state.db.insert_irrigation_log(ts, duration_s, "manual")?;
            Ok(())
        } else {
            Err("Nenhuma conexao ativa para irrigacao".into())
        }
    }
}

#[tauri::command]
async fn export_history_csv(
    app: AppHandle,
    state: State<'_, AppState>,
    since_ts: Option<i64>,
) -> Result<String, String> {
    let history = state.db.history(10_000, since_ts)?;

    let mut wtr = csv::Writer::from_writer(Vec::new());
    for row in history {
        wtr.serialize(row).map_err(|e| e.to_string())?;
    }
    let csv_bytes = wtr.into_inner().map_err(|e| e.to_string())?;

    let file_path = app
        .dialog()
        .file()
        .add_filter("CSV", &["csv"])
        .set_file_name("historico_plantium.csv")
        .blocking_save_file();

    if let Some(path) = file_path {
        let path_buf = path.to_path_buf().map_err(|e| e.to_string())?;
        std::fs::write(&path_buf, csv_bytes).map_err(|e| e.to_string())?;
        Ok(path_buf.to_string_lossy().into_owned())
    } else {
        Err("Exportacao cancelada".into())
    }
}

#[derive(Debug, Serialize)]
pub struct SystemHealth {
    pub db_size_mb: f64,
    pub reading_count: i64,
    pub last_ts: Option<i64>,
    pub drivers_ok: bool,
}

#[tauri::command]
fn get_system_health(state: State<AppState>) -> Result<SystemHealth, String> {
    let metadata = std::fs::metadata(&state.db.path).map_err(|e| e.to_string())?;
    let db_size_mb = (metadata.len() as f64) / 1024.0 / 1024.0;

    let conn = rusqlite::Connection::open(&state.db.path).map_err(|e| e.to_string())?;
    let reading_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM readings", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let last_ts: Option<i64> = conn
        .query_row("SELECT MAX(ts) FROM readings", [], |row| row.get(0))
        .ok();

    // Se houver qualquer porta detectável na serial, assume drivers ok, ou apenas retorna true
    let ports = serial::list_ports();
    let drivers_ok = !ports.is_empty();

    Ok(SystemHealth {
        db_size_mb,
        reading_count,
        last_ts,
        drivers_ok,
    })
}

#[tauri::command]
fn save_setting(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    state.db.save_setting(&key, &value)
}

#[tauri::command]
fn load_setting(state: State<AppState>, key: String) -> Result<Option<String>, String> {
    state.db.load_setting(&key)
}

#[tauri::command]
fn get_irrigation_logs(
    state: State<AppState>,
    limit: Option<u32>,
) -> Result<Vec<db::IrrigationLogRow>, String> {
    state.db.list_irrigation_logs(limit.unwrap_or(50).min(500))
}

#[tauri::command]
fn deps_manifest(os: String) -> Vec<deps::DepItem> {
    deps::manifest().into_iter().filter(|d| d.os == os).collect()
}

#[tauri::command]
async fn install_dependency(app: AppHandle, id: String, os: String) -> Result<(), String> {
    let item = deps::manifest()
        .into_iter()
        .find(|d| d.id == id && d.os == os)
        .ok_or("Dependencia nao encontrada no manifesto")?;
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let app2 = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        deps::install(&item, data_dir, |p| {
            let _ = app2.emit("deps:progress", &p);
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

// ====================== Bootstrap ======================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            let db = DbHandle::open(data_dir).map_err(std::io::Error::other)?;

            // Recupera perfil ativo do banco SQLite
            let active_profile = db
                .get_active_profile()
                .map_err(std::io::Error::other)?
                .map(|p| PlantProfile {
                    name: p.name,
                    ideal_moisture_min: p.ideal_moisture_min,
                    ideal_moisture_max: p.ideal_moisture_max,
                })
                .unwrap_or_default();

            app.manage(AppState {
                db,
                profile: Mutex::new(active_profile),
                active_stop: Mutex::new(None),
                last_reading: Mutex::new(None),
                serial_tx: Mutex::new(None),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_simulator,
            stop_source,
            list_serial_ports,
            connect_serial,
            get_history,
            irrigation_decision,
            get_profile,
            set_profile,
            deps_manifest,
            install_dependency,
            list_profiles,
            add_profile,
            delete_profile,
            activate_profile,
            trigger_irrigation,
            export_history_csv,
            get_system_health,
            save_setting,
            load_setting,
            get_irrigation_logs
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar a aplicacao PlantiumAI");
}


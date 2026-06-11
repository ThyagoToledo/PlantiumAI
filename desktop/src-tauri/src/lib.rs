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
}

impl AppState {
    /// Para a fonte atual e registra a nova flag de parada.
    fn swap_source(&self, new_stop: Arc<AtomicBool>) {
        let mut guard = self.active_stop.lock().unwrap();
        if let Some(old) = guard.take() {
            old.store(true, Ordering::Relaxed);
        }
        *guard = Some(new_stop);
    }

    fn stop_source(&self) {
        let mut guard = self.active_stop.lock().unwrap();
        if let Some(old) = guard.take() {
            old.store(true, Ordering::Relaxed);
        }
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
    let app_line = app.clone();
    let app_status = app.clone();
    serial::spawn_reader(
        port,
        stop,
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
        .ok_or("Sem leitura de umidade do solo disponível")?;
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
fn set_profile(state: State<AppState>, name: String, ideal_min: f64, ideal_max: f64) {
    *state.profile.lock().unwrap() = PlantProfile {
        name,
        ideal_moisture_min: ideal_min,
        ideal_moisture_max: ideal_max,
    };
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
        .ok_or("Dependência não encontrada no manifesto")?;
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    // Download/instalação em thread bloqueante — UI permanece fluida
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
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            let db = DbHandle::open(data_dir).map_err(std::io::Error::other)?;
            app.manage(AppState {
                db,
                profile: Mutex::new(PlantProfile::default()),
                active_stop: Mutex::new(None),
                last_reading: Mutex::new(None),
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
            install_dependency
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar a aplicação PlantiumAI");
}

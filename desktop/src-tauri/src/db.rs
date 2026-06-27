//! Persistência SQLite em thread dedicada (rusqlite não é Send entre awaits).
//! Escrita via canal mpsc; leituras de histórico via comando síncrono curto.

use crate::domain::{Alert, SensorReading};
use rusqlite::{params, Connection};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::mpsc::{self, Sender};
use std::thread;

pub enum DbMsg {
    Insert(SensorReading),
    InsertAlert(Alert),
}

#[derive(Clone)]
pub struct DbHandle {
    tx: Sender<DbMsg>,
    pub path: PathBuf,
}

#[derive(Debug, Serialize)]
pub struct HistoryRow {
    pub ts: i64,
    pub soil_moisture: Option<f64>,
    pub air_temperature: Option<f64>,
    pub air_humidity: Option<f64>,
    pub light_level: Option<f64>,
    pub soil_temperature: Option<f64>,
    pub co2_level: Option<f64>,
    pub ph_level: Option<f64>,
    pub source: String,
}

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    soil_moisture REAL, air_temperature REAL, air_humidity REAL,
    light_level REAL, soil_temperature REAL, co2_level REAL, ph_level REAL,
    source TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_readings_ts ON readings(ts);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    severity TEXT NOT NULL, category TEXT NOT NULL,
    title TEXT NOT NULL, message TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ideal_moisture_min REAL NOT NULL,
    ideal_moisture_max REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS irrigation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    duration_s INTEGER NOT NULL,
    trigger_type TEXT NOT NULL
);
";

#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct PlantProfileRow {
    pub id: i64,
    pub name: String,
    pub ideal_moisture_min: f64,
    pub ideal_moisture_max: f64,
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
pub struct IrrigationLogRow {
    pub id: i64,
    pub ts: i64,
    pub duration_s: u32,
    pub trigger_type: String,
}

impl DbHandle {
    /// Abre o banco em `dir/plantium.db` e inicia a thread de escrita.
    pub fn open(dir: PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        let path = dir.join("plantium.db");
        let conn = Connection::open(&path).map_err(|e| e.to_string())?;
        conn.execute_batch(SCHEMA).map_err(|e| e.to_string())?;

        // Seed default profile if empty
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM profiles", [], |row| row.get(0))
            .map_err(|e| e.to_string())?;
        if count == 0 {
            conn.execute(
                "INSERT INTO profiles (name, ideal_moisture_min, ideal_moisture_max, is_active)
                 VALUES (?1, ?2, ?3, ?4)",
                params!["Planta", 35.0, 65.0, 1],
            )
            .map_err(|e| e.to_string())?;
        }

        let (tx, rx) = mpsc::channel::<DbMsg>();
        thread::spawn(move || {
            for msg in rx {
                let res = match msg {
                    DbMsg::Insert(r) => conn.execute(
                        "INSERT INTO readings (ts, soil_moisture, air_temperature, air_humidity,
                         light_level, soil_temperature, co2_level, ph_level, source)
                         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
                        params![
                            r.ts, r.soil_moisture, r.air_temperature, r.air_humidity,
                            r.light_level, r.soil_temperature, r.co2_level, r.ph_level, r.source
                        ],
                    ),
                    DbMsg::InsertAlert(a) => conn.execute(
                        "INSERT INTO alerts (ts, severity, category, title, message)
                         VALUES (?1,?2,?3,?4,?5)",
                        params![a.ts, a.severity, a.category, a.title, a.message],
                    ),
                };
                if let Err(e) = res {
                    eprintln!("[db] erro de escrita: {e}");
                }
            }
        });

        Ok(Self { tx, path })
    }

    pub fn insert(&self, r: SensorReading) {
        let _ = self.tx.send(DbMsg::Insert(r));
    }

    pub fn insert_alert(&self, a: Alert) {
        let _ = self.tx.send(DbMsg::InsertAlert(a));
    }

    /// Histórico (conexão própria de leitura; SQLite suporta múltiplas conexões).
    pub fn history(&self, limit: u32, since_ts: Option<i64>) -> Result<Vec<HistoryRow>, String> {
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        let since = since_ts.unwrap_or(0);
        let mut stmt = conn
            .prepare(
                "SELECT ts, soil_moisture, air_temperature, air_humidity, light_level,
                        soil_temperature, co2_level, ph_level, source
                 FROM readings WHERE ts >= ?1 ORDER BY ts DESC LIMIT ?2",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![since, limit], |row| {
                Ok(HistoryRow {
                    ts: row.get(0)?,
                    soil_moisture: row.get(1)?,
                    air_temperature: row.get(2)?,
                    air_humidity: row.get(3)?,
                    light_level: row.get(4)?,
                    soil_temperature: row.get(5)?,
                    co2_level: row.get(6)?,
                    ph_level: row.get(7)?,
                    source: row.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        Ok(rows)
    }

    // --- Metodos de Configurações Gerais ---
    pub fn save_setting(&self, key: &str, value: &str) -> Result<(), String> {
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO app_settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value=?2",
            params![key, value],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn load_setting(&self, key: &str) -> Result<Option<String>, String> {
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT value FROM app_settings WHERE key = ?1")
            .map_err(|e| e.to_string())?;
        let mut rows = stmt.query(params![key]).map_err(|e| e.to_string())?;
        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            let val: String = row.get(0).map_err(|e| e.to_string())?;
            Ok(Some(val))
        } else {
            Ok(None)
        }
    }

    // --- Metodos de Perfis de Plantas ---
    pub fn list_profiles(&self) -> Result<Vec<PlantProfileRow>, String> {
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id, name, ideal_moisture_min, ideal_moisture_max, is_active FROM profiles ORDER BY id ASC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                let is_active_int: i32 = row.get(4)?;
                Ok(PlantProfileRow {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    ideal_moisture_min: row.get(2)?,
                    ideal_moisture_max: row.get(3)?,
                    is_active: is_active_int != 0,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        Ok(rows)
    }

    pub fn add_profile(&self, name: &str, ideal_min: f64, ideal_max: f64) -> Result<i64, String> {
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO profiles (name, ideal_moisture_min, ideal_moisture_max, is_active)
             VALUES (?1, ?2, ?3, 0)",
            params![name, ideal_min, ideal_max],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    pub fn delete_profile(&self, id: i64) -> Result<(), String> {
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        // Nao permitir deletar o ativo
        let is_active: i32 = conn
            .query_row(
                "SELECT is_active FROM profiles WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if is_active != 0 {
            return Err("Nao e possivel deletar o perfil ativo atualmente".into());
        }
        conn.execute("DELETE FROM profiles WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn activate_profile(&self, id: i64) -> Result<(), String> {
        let mut conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        let tx = conn.transaction().map_err(|e| e.to_string())?;
        tx.execute("UPDATE profiles SET is_active = 0", [])
            .map_err(|e| e.to_string())?;
        tx.execute("UPDATE profiles SET is_active = 1 WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_active_profile(&self) -> Result<Option<PlantProfileRow>, String> {
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id, name, ideal_moisture_min, ideal_moisture_max, is_active FROM profiles WHERE is_active = 1 LIMIT 1")
            .map_err(|e| e.to_string())?;
        let mut rows = stmt
            .query_map([], |row| {
                let is_active_int: i32 = row.get(4)?;
                Ok(PlantProfileRow {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    ideal_moisture_min: row.get(2)?,
                    ideal_moisture_max: row.get(3)?,
                    is_active: is_active_int != 0,
                })
            })
            .map_err(|e| e.to_string())?;

        if let Some(r) = rows.next() {
            Ok(Some(r.map_err(|e| e.to_string())?))
        } else {
            Ok(None)
        }
    }

    pub fn update_profile(&self, id: i64, name: &str, ideal_min: f64, ideal_max: f64) -> Result<(), String> {
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE profiles SET name = ?1, ideal_moisture_min = ?2, ideal_moisture_max = ?3 WHERE id = ?4",
            params![name, ideal_min, ideal_max, id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }


    // --- Metodos de Log de Irrigação ---
    pub fn insert_irrigation_log(&self, ts: i64, duration_s: u32, trigger_type: &str) -> Result<(), String> {
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO irrigation_log (ts, duration_s, trigger_type) VALUES (?1, ?2, ?3)",
            params![ts, duration_s, trigger_type],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_irrigation_logs(&self, limit: u32) -> Result<Vec<IrrigationLogRow>, String> {
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id, ts, duration_s, trigger_type FROM irrigation_log ORDER BY ts DESC LIMIT ?1")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![limit], |row| {
                Ok(IrrigationLogRow {
                    id: row.get(0)?,
                    ts: row.get(1)?,
                    duration_s: row.get(2)?,
                    trigger_type: row.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        Ok(rows)
    }
}

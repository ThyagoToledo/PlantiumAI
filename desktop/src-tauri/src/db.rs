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
";

impl DbHandle {
    /// Abre o banco em `dir/plantium.db` e inicia a thread de escrita.
    pub fn open(dir: PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        let path = dir.join("plantium.db");
        let conn = Connection::open(&path).map_err(|e| e.to_string())?;
        conn.execute_batch(SCHEMA).map_err(|e| e.to_string())?;

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
}

//! Domínio de sensores — portado de SistemaLegado/backend/services/sensor_service.py
//! Faixas de validação, classificação de umidade e geração de alertas.

use serde::{Deserialize, Serialize};

/// Leitura de sensores vinda da ESP32 (frame NDJSON) ou do simulador.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SensorReading {
    pub soil_moisture: Option<f64>,
    pub air_temperature: Option<f64>,
    pub air_humidity: Option<f64>,
    pub light_level: Option<f64>,
    pub soil_temperature: Option<f64>,
    pub co2_level: Option<f64>,
    pub ph_level: Option<f64>,
    #[serde(default)]
    pub source: String,
    /// Epoch ms — preenchido na ingestão se ausente.
    #[serde(default)]
    pub ts: i64,
}

/// Faixas físicas válidas por sensor (mesmos valores do legado).
pub const VALID_RANGES: &[(&str, f64, f64)] = &[
    ("soil_moisture", 0.0, 100.0),
    ("air_temperature", -10.0, 60.0),
    ("air_humidity", 0.0, 100.0),
    ("light_level", 0.0, 150_000.0),
    ("soil_temperature", -5.0, 50.0),
    ("co2_level", 200.0, 2000.0),
    ("ph_level", 0.0, 14.0),
];

impl SensorReading {
    fn field(&self, name: &str) -> Option<f64> {
        match name {
            "soil_moisture" => self.soil_moisture,
            "air_temperature" => self.air_temperature,
            "air_humidity" => self.air_humidity,
            "light_level" => self.light_level,
            "soil_temperature" => self.soil_temperature,
            "co2_level" => self.co2_level,
            "ph_level" => self.ph_level,
            _ => None,
        }
    }

    /// Valida a leitura. Retorna (válida, avisos).
    pub fn validate(&self) -> (bool, Vec<String>) {
        let mut warnings = Vec::new();
        for (name, min, max) in VALID_RANGES {
            if let Some(v) = self.field(name) {
                if !v.is_finite() {
                    warnings.push(format!("{name}: valor não numérico"));
                } else if v < *min || v > *max {
                    warnings.push(format!(
                        "{name}: valor fora da faixa ({v:.1} — esperado {min}-{max})"
                    ));
                }
            }
        }
        (warnings.is_empty(), warnings)
    }
}

/// Classificação de umidade do solo (5 níveis, igual ao legado).
pub fn classify_moisture(moisture: f64) -> &'static str {
    if moisture < 20.0 {
        "dry"
    } else if moisture < 35.0 {
        "low"
    } else if moisture <= 65.0 {
        "optimal"
    } else if moisture <= 80.0 {
        "high"
    } else {
        "saturated"
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Alert {
    pub severity: String,
    pub category: String,
    pub title: String,
    pub message: String,
    pub ts: i64,
}

/// Alerta de umidade fora do ideal (thresholds do legado:
/// crítico < ideal_min*0.5, seco < ideal_min, encharcado > ideal_max*1.2).
pub fn moisture_alert(
    moisture: f64,
    plant_name: &str,
    ideal_min: f64,
    ideal_max: f64,
    ts: i64,
) -> Option<Alert> {
    if moisture < ideal_min * 0.5 {
        Some(Alert {
            severity: "critical".into(),
            category: "irrigation".into(),
            title: format!("Solo criticamente seco — {plant_name}"),
            message: format!(
                "Umidade do solo em {moisture:.0}% (mínimo ideal: {ideal_min:.0}%). Irrigação urgente necessária!"
            ),
            ts,
        })
    } else if moisture < ideal_min {
        Some(Alert {
            severity: "warning".into(),
            category: "irrigation".into(),
            title: format!("Solo seco — {plant_name}"),
            message: format!(
                "Umidade do solo em {moisture:.0}% (abaixo do mínimo de {ideal_min:.0}%). Considere irrigar."
            ),
            ts,
        })
    } else if moisture > ideal_max * 1.2 {
        Some(Alert {
            severity: "warning".into(),
            category: "irrigation".into(),
            title: format!("Solo encharcado — {plant_name}"),
            message: format!(
                "Umidade do solo em {moisture:.0}% (acima do máximo de {ideal_max:.0}%). Verifique a drenagem."
            ),
            ts,
        })
    } else {
        None
    }
}

/// Payload emitido para a UI a cada leitura processada.
#[derive(Debug, Clone, Serialize)]
pub struct ReadingEvent {
    pub reading: SensorReading,
    pub valid: bool,
    pub warnings: Vec<String>,
    pub moisture_class: Option<String>,
    pub alert: Option<Alert>,
}

/// Pipeline de ingestão: valida, classifica e gera alerta.
pub fn process_reading(
    mut reading: SensorReading,
    plant_name: &str,
    ideal_min: f64,
    ideal_max: f64,
) -> ReadingEvent {
    if reading.ts == 0 {
        reading.ts = chrono::Utc::now().timestamp_millis();
    }
    let (valid, warnings) = reading.validate();
    let moisture_class = reading.soil_moisture.map(|m| classify_moisture(m).to_string());
    let alert = reading
        .soil_moisture
        .and_then(|m| moisture_alert(m, plant_name, ideal_min, ideal_max, reading.ts));
    ReadingEvent {
        reading,
        valid,
        warnings,
        moisture_class,
        alert,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classify_levels() {
        assert_eq!(classify_moisture(10.0), "dry");
        assert_eq!(classify_moisture(30.0), "low");
        assert_eq!(classify_moisture(50.0), "optimal");
        assert_eq!(classify_moisture(70.0), "high");
        assert_eq!(classify_moisture(90.0), "saturated");
    }

    #[test]
    fn out_of_range_warns() {
        let r = SensorReading {
            soil_moisture: Some(120.0),
            ..Default::default()
        };
        let (valid, warnings) = r.validate();
        assert!(!valid);
        assert_eq!(warnings.len(), 1);
    }

    #[test]
    fn critical_alert_below_half_min() {
        let a = moisture_alert(15.0, "Alface", 35.0, 65.0, 0).unwrap();
        assert_eq!(a.severity, "critical");
    }
}

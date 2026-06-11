//! Simulador de sensores — portado de sensor_service.generate_simulated_reading.
//! Variação gradual entre leituras + efeito da hora do dia. Modo demo sem hardware.

use crate::domain::SensorReading;
use chrono::{Local, Timelike};
use rand::Rng;

pub fn next_reading(last: Option<&SensorReading>) -> SensorReading {
    let mut rng = rand::thread_rng();
    let hour = Local::now().hour();

    let (base_moisture, base_temp, base_humidity) = match last {
        Some(prev) => (
            prev.soil_moisture.unwrap_or(50.0) - rng.gen_range(0.5..2.0),
            prev.air_temperature.unwrap_or(25.0) + rng.gen_range(-0.5..0.5),
            prev.air_humidity.unwrap_or(60.0) + rng.gen_range(-2.0..2.0),
        ),
        None => (
            rng.gen_range(40.0..70.0),
            rng.gen_range(20.0..32.0),
            rng.gen_range(45.0..75.0),
        ),
    };

    // Hora do dia afeta temperatura
    let temp_modifier = if (10..=16).contains(&hour) {
        rng.gen_range(2.0..6.0)
    } else if hour >= 20 || hour <= 5 {
        rng.gen_range(-3.0..-1.0)
    } else {
        0.0
    };

    // Luminosidade depende da hora
    let light = if (6..=18).contains(&hour) {
        rng.gen_range(5_000.0..80_000.0)
    } else {
        rng.gen_range(0.0..10.0)
    };

    SensorReading {
        soil_moisture: Some((base_moisture as f64).clamp(5.0, 95.0)),
        air_temperature: Some((base_temp + temp_modifier).clamp(10.0, 45.0)),
        air_humidity: Some((base_humidity as f64).clamp(20.0, 95.0)),
        light_level: Some(light),
        soil_temperature: Some((base_temp + temp_modifier - 3.0).clamp(10.0, 40.0)),
        co2_level: Some(rng.gen_range(350.0..600.0)),
        ph_level: Some(rng.gen_range(5.5..7.5)),
        source: "simulated".into(),
        ts: chrono::Utc::now().timestamp_millis(),
    }
}

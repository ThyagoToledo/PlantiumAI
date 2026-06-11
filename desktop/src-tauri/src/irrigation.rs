//! Decisão de irrigação por regras — portado de
//! SistemaLegado/backend/services/irrigation_service.py (rule_based_decision).
//! Funciona 100% offline; serve de fallback quando a IA estiver indisponível.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct IrrigationDecision {
    pub should_irrigate: bool,
    pub urgency: String,
    pub duration_minutes: u32,
    pub reasoning: String,
    pub warnings: Vec<String>,
    pub provider: String,
}

pub fn rule_based_decision(soil_moisture: f64, ideal_min: f64, ideal_max: f64) -> IrrigationDecision {
    if soil_moisture < ideal_min * 0.6 {
        IrrigationDecision {
            should_irrigate: true,
            urgency: "critical".into(),
            duration_minutes: 25,
            reasoning: format!("Solo criticamente seco ({soil_moisture:.0}%)"),
            warnings: vec![],
            provider: "regra_local".into(),
        }
    } else if soil_moisture < ideal_min {
        IrrigationDecision {
            should_irrigate: true,
            urgency: "medium".into(),
            duration_minutes: 15,
            reasoning: format!("Solo abaixo do ideal ({soil_moisture:.0}% < {ideal_min:.0}%)"),
            warnings: vec![],
            provider: "regra_local".into(),
        }
    } else if soil_moisture > ideal_max {
        IrrigationDecision {
            should_irrigate: false,
            urgency: "none".into(),
            duration_minutes: 0,
            reasoning: format!("Solo úmido o suficiente ({soil_moisture:.0}%)"),
            warnings: vec!["Solo acima do ideal, monitorar drenagem".into()],
            provider: "regra_local".into(),
        }
    } else {
        IrrigationDecision {
            should_irrigate: false,
            urgency: "none".into(),
            duration_minutes: 0,
            reasoning: format!("Solo em nível ideal ({soil_moisture:.0}%)"),
            warnings: vec![],
            provider: "regra_local".into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn critical_below_60pct_of_min() {
        let d = rule_based_decision(20.0, 35.0, 65.0);
        assert!(d.should_irrigate);
        assert_eq!(d.urgency, "critical");
        assert_eq!(d.duration_minutes, 25);
    }

    #[test]
    fn optimal_no_irrigation() {
        let d = rule_based_decision(50.0, 35.0, 65.0);
        assert!(!d.should_irrigate);
    }
}

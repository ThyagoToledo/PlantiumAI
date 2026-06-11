/*
 * PlantiumAI — Firmware ESP32 (exemplo mínimo)
 * Emite leituras em NDJSON pela serial USB a 115200 baud,
 * no formato esperado pelo app desktop (desktop/src-tauri/src/serial.rs).
 *
 * Sensores do protótipo (especificação do projeto):
 *  - DHT22: temperatura/umidade do ar (pino 4)
 *  - Capacitivo de solo: umidade do solo (ADC pino 34)
 *  - LDR/BH1750: luminosidade (ADC pino 35 neste exemplo)
 *
 * Sem sensor conectado, descomente SIMULATE para gerar valores de teste.
 */

#include <DHT.h>

// #define SIMULATE  // descomente para testar sem sensores

#define DHT_PIN 4
#define DHT_TYPE DHT22
#define SOIL_PIN 34
#define LIGHT_PIN 35

DHT dht(DHT_PIN, DHT_TYPE);

const unsigned long INTERVAL_MS = 2000;
unsigned long lastSend = 0;

// Calibração do sensor capacitivo (ajustar com solo seco/úmido reais)
const int SOIL_DRY_RAW = 3200;   // leitura no ar (0%)
const int SOIL_WET_RAW = 1200;   // leitura na água (100%)

float readSoilMoisture() {
#ifdef SIMULATE
  return 40.0 + random(-50, 50) / 10.0;
#else
  int raw = analogRead(SOIL_PIN);
  float pct = 100.0 * (SOIL_DRY_RAW - raw) / (float)(SOIL_DRY_RAW - SOIL_WET_RAW);
  return constrain(pct, 0.0, 100.0);
#endif
}

float readLight() {
#ifdef SIMULATE
  return 20000 + random(-5000, 5000);
#else
  // LDR simples: mapeia ADC 0-4095 para 0-100000 lx (aproximação;
  // para precisão usar BH1750 via I2C)
  return analogRead(LIGHT_PIN) / 4095.0 * 100000.0;
#endif
}

void setup() {
  Serial.begin(115200);
  dht.begin();
#ifdef SIMULATE
  randomSeed(esp_random());
#endif
}

void loop() {
  unsigned long now = millis();
  if (now - lastSend < INTERVAL_MS) return;
  lastSend = now;

#ifdef SIMULATE
  float airTemp = 25.0 + random(-30, 30) / 10.0;
  float airHum = 60.0 + random(-100, 100) / 10.0;
#else
  float airTemp = dht.readTemperature();
  float airHum = dht.readHumidity();
#endif

  // Uma linha JSON por leitura (NDJSON). Campos com falha de leitura são omitidos.
  Serial.print('{');
  bool first = true;

  if (!isnan(airTemp)) {
    Serial.printf("\"air_temperature\":%.1f", airTemp);
    first = false;
  }
  if (!isnan(airHum)) {
    if (!first) Serial.print(',');
    Serial.printf("\"air_humidity\":%.1f", airHum);
    first = false;
  }
  if (!first) Serial.print(',');
  Serial.printf("\"soil_moisture\":%.1f", readSoilMoisture());
  Serial.printf(",\"light_level\":%.0f", readLight());
  Serial.print(",\"source\":\"esp32\"");
  Serial.println('}');
}

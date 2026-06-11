import urllib.request
import json
import base64
import time

BASE_URL = "http://localhost:8000/api"

def print_result(name, res):
    print(f"\n{'='*50}\nTESTANDO: {name}\n{'='*50}")
    print(f"Status: {res.status}")
    body = res.read().decode('utf-8')
    try:
        parsed = json.loads(body)
        print(json.dumps(parsed, indent=2, ensure_ascii=False))
    except:
        print(body)

def test_consult():
    data = json.dumps({
        "question": "Como cuidar de um tomateiro?",
        "crops": ["tomate"],
        "location": "Brasil",
        "season": "verão"
    }).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/dashboard/consult", data=data, headers={'Content-Type': 'application/json'})
    try:
        res = urllib.request.urlopen(req)
        print_result("Consulta (Consult)", res)
    except Exception as e:
        print(f"Erro em Consult: {e}")

def test_irrigation():
    data = json.dumps({
        "plant_id": 1,
        "soil_moisture": 30.5,
        "air_temperature": 28.0,
        "air_humidity": 45.0,
        "plant_name": "Tomateiro Teste",
        "plant_stage": "crescimento"
    }).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/irrigation/decision", data=data, headers={'Content-Type': 'application/json'})
    try:
        res = urllib.request.urlopen(req)
        print_result("Irrigação (Decision)", res)
    except Exception as e:
        print(f"Erro em Irrigation: {e}")

if __name__ == "__main__":
    print("Iniciando testes...")
    test_consult()
    time.sleep(1)
    test_irrigation()

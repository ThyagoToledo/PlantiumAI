import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { invoke, isTauri } from "./lib/bridge";

// No modo demo (navegador) o simulador inicia sozinho para a UI ganhar vida.
// No app desktop o usuário escolhe a fonte (ESP32 ou simulador) na aba Conexão.
if (!isTauri) {
  invoke("start_simulator", { intervalMs: 1500 }).catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

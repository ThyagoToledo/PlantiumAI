# PlantiumAI Desktop — Plano de Implementação

> Levantamento feito em: 2026-06-27  
> Base: análise do vault, código atual em `desktop/` e alinhamento com a estrutura do projeto.

---

## Estado Atual (o que já existe)

### Stack confirmada
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Tauri 2 (Rust) + Tokio
- **Persistência**: SQLite via `rusqlite` (thread dedicada de escrita)
- **Gráficos**: ECharts 5 (séries em tempo real)
- **Hardware**: Serial 115200 baud, protocolo NDJSON (ESP32)

### Páginas implementadas
| Página | Status | Arquivo |
|--------|--------|---------|
| Dashboard (KPIs + gráficos + alertas + irrigação) | ✅ Funcional | `src/pages/Dashboard.tsx` |
| Conexão (serial / demo) | ✅ Funcional | `src/pages/ConnectionPage.tsx` |
| Dependências (drivers CH340/CP210x) | ✅ Funcional | `src/pages/DependenciesPage.tsx` |
| Configurações (perfil da planta) | ✅ Funcional | `src/pages/SettingsPage.tsx` |

### Comandos Tauri disponíveis (Rust → UI)
`start_simulator`, `stop_source`, `list_serial_ports`, `connect_serial`,
`get_history`, `irrigation_decision`, `get_profile`, `set_profile`,
`deps_manifest`, `install_dependency`

---

## O Que Falta — Funcionalidades a Implementar

### 1. Histórico & Relatórios  
**Por que?** O SQLite já salva todas as leituras (`db.rs` com `history()` aceita `limit` e `since_ts`), mas a UI não tem nenhuma tela para explorar esses dados. O agricultor precisa ver tendências ao longo do dia/semana.

**O que fazer:**
- Nova página `HistoryPage.tsx` na navegação (ícone `History` do lucide-react)
- Filtro de período: Hoje / Últimos 7 dias / Últimos 30 dias / Intervalo customizado
- Tabela paginada com colunas: timestamp, umidade solo, temp ar, temp solo, umidade ar, luz, CO₂, pH
- Gráfico de série temporal dos últimos N dias reutilizando `LiveChart.tsx` (já suporta dados históricos)
- Export CSV: Rust serializa o `Vec<HistoryRow>` e salva em disco via diálogo de arquivo (`tauri-plugin-dialog`)

**Onde se apoia:**
- Comando `get_history` já existe em `lib.rs:153`
- `db::HistoryRow` já retorna todos os campos
- `LiveChart.tsx` aceita `Series[]` com qualquer array de `[timestamp, valor]`

---

### 2. Múltiplos Perfis de Planta  
**Por que?** O `AppState` atual tem apenas um `Mutex<PlantProfile>`. Produtores cultivam alface, tomate, ervas — cada um com faixa de umidade diferente. Mudar de planta hoje exige reconfigurar manualmente.

**O que fazer:**
- Extensão da `SettingsPage.tsx`: lista de perfis salvos + seleção do ativo
- Adicionar tabela `profiles` no SQLite (`db.rs`) com `id, name, ideal_min, ideal_max, is_active`
- Novos comandos Tauri: `list_profiles`, `add_profile`, `delete_profile`, `activate_profile`
- `AppState` passa a ter `active_profile_id: Mutex<i64>` em vez de perfil inline
- Quick-switch na sidebar: dropdown compacto abaixo do logo

**Onde se apoia:**
- `db.rs` já tem padrão de schema + migrations (copiar estrutura)
- `set_profile` e `get_profile` existem — serão substituídos pelos novos comandos
- `SettingsPage.tsx` já lê o perfil atual via `invoke("get_profile")`

---

### 3. Acionamento Real de Irrigação (Controle de Relé)  
**Por que?** Hoje o app apenas *recomenda* irrigar. Para o plano Estufa+ (R$ 349/mês) o diferencial é automação real — o ESP32 pode receber comandos de volta via serial para acionar um relé.

**O que fazer:**
- Protocolo bidirecional: ESP32 aceita JSON `{"cmd":"irrigate","duration_s":30}` na mesma porta serial
- Novo comando Tauri `send_serial_command(port, json)` em `serial.rs`
- Dashboard: botão "Irrigar agora" (com duração configurável) ao lado de "Avaliar irrigação"
- Confirmação visual: animação/badge "Irrigando..." que some após `duration_s` segundos
- Log de acionamentos: nova tabela SQLite `irrigation_log (ts, duration_s, trigger)` — trigger pode ser "manual" ou futuro "auto"

**Onde se apoia:**
- `serial.rs` já tem a função de escrita de porta serial (adicionar variante de escrita)
- `irrigation_decision` em `lib.rs:162` já retorna `duration_minutes` — usar como default
- `Dashboard.tsx` já tem `decideIrrigation()` — adicionar `triggerIrrigation()` ao lado

---

### 4. Modo Automático de Irrigação  
**Por que?** Com acionamento real (item 3), o próximo passo é irrigar sem intervenção manual quando o solo atinge limiar crítico. Define o produto como "micro estufa *inteligente*".

**O que fazer:**
- Toggle "Modo Automático" na `SettingsPage.tsx`
- Estado salvo em SQLite + `AppState.auto_irrigate: AtomicBool`
- Em `ingest()` (`lib.rs:63`): após `process_reading`, se `auto_irrigate` ativo e alerta for `critical`, chamar `send_serial_command` automaticamente
- Cooldown configurável (ex: mínimo 30 min entre acionamentos) para evitar encharcamento
- Notificação via `tauri::notification` ao acionar automaticamente

**Onde se apoia:**
- `ingest()` em `lib.rs:63` é o ponto central — toda leitura passa por aqui
- `domain.rs` já classifica o alerta como `critical` quando umidade < ideal_min × 0.5
- Item 3 precisa estar implementado primeiro (dependência)

---

### 5. Persistência do Perfil (Fix Urgente)  
**Por que?** Hoje o perfil da planta (`name`, `ideal_min`, `ideal_max`) é salvo apenas em memória (`Mutex<PlantProfile>` em `AppState`). Ao fechar o app, o perfil é perdido — volta ao default "Planta / 35-65%".

**O que fazer:**
- Adicionar tabela `app_settings (key TEXT PRIMARY KEY, value TEXT)` em `db.rs`
- Ao `set_profile`: persistir as 3 chaves no SQLite
- No `setup` (`lib.rs:218`): ler as chaves e popular o `PlantProfile` inicial

**Onde se apoia:**
- `db.rs` já tem conexão aberta e padrão de schema — adicionar `CREATE TABLE IF NOT EXISTS app_settings`
- É a menor mudança com maior impacto imediato na experiência do usuário

---

### 6. Notificações Nativas (Alertas Críticos)  
**Por que?** Se o agricultor minimiza o app e vai para o campo, ele não vê os alertas do feed. Uma notificação nativa do SO garante reação a tempo.

**O que fazer:**
- Adicionar `tauri-plugin-notification` ao `Cargo.toml`
- Em `ingest()`: quando `alert.severity == "critical"`, emitir notificação nativa além do evento IPC
- Configuração na `SettingsPage.tsx`: toggle "Notificações ativadas" + threshold de severidade

**Onde se apoia:**
- `ingest()` em `lib.rs:73` já detecta alertas — apenas adicionar a chamada de notificação
- `tauri-plugin-notification` é oficial do ecossistema Tauri 2

---

### 7. Export de Dados (CSV)  
**Por que?** Produtores e técnicos agrícolas querem levar os dados para Excel / análise externa.

**O que fazer:**
- Botão "Exportar CSV" na futura `HistoryPage.tsx` (item 1)
- Novo comando Tauri `export_history_csv(since_ts, until_ts) -> String (caminho do arquivo)`
- Rust: serializa `Vec<HistoryRow>` para CSV com `csv` crate, abre diálogo de salvamento via `tauri-plugin-dialog`
- Colunas: data/hora (ISO 8601 local), todos os 7 sensores, fonte

**Onde se apoia:**
- `get_history` já retorna todos os dados necessários
- `tauri-plugin-dialog` já pode ser adicionado (plugin oficial)

---

### 8. Suporte a Múltiplos Sensores / Estufa  
**Por que?** No plano Estufa+ o produtor pode ter mais de um módulo ESP32 em estufas diferentes.

**O que fazer:**
- `SensorReading` em `domain.rs` adicionar campo `source_id: Option<String>` (hoje tem `source: String` genérico)
- Novo seletor "Estufa ativa" na sidebar (similar ao perfil)
- Filtrar gráficos e alertas pelo `source_id` selecionado
- UI: badge colorido por estufa nos cards do dashboard

**Onde se apoia:**
- `domain.rs:ReadingEvent` já tem campo `source` — estender para `source_id` e `source_label`
- `db.rs` já indexa por `ts` — adicionar índice por `source_id`

---

### 9. Tela de Status / Saúde do Sistema  
**Por que?** Antes de ligar o app, o produtor quer saber se o ESP32 está mandando dados, se o banco de dados está saudável, se tem drivers instalados.

**O que fazer:**
- Nova página `StatusPage.tsx` ou painel lateral expansível
- Cards de saúde: ESP32 conectado (último timestamp), SQLite (tamanho, nº leituras), Drivers instalados
- Novo comando `system_health() -> SystemHealth { db_size_mb, reading_count, last_ts, drivers_ok }`

**Onde se apoia:**
- `db.rs` pode expor `row_count()` e tamanho do arquivo
- `deps.rs` pode verificar se drivers estão instalados via registry (Windows) ou udev (Linux)
- `conn.state` já vem do `useLiveData` hook — reusar

---

## Prioridade de Implementação

| # | Feature | Impacto | Esforço | Depende de |
|---|---------|---------|---------|------------|
| 1 | **Persistência do perfil** (fix) | Alto | Baixo | — |
| 2 | **Histórico & Relatórios** | Alto | Médio | — |
| 3 | **Múltiplos perfis de planta** | Médio | Médio | Item 1 |
| 4 | **Acionamento de irrigação** | Alto | Médio | — |
| 5 | **Notificações nativas** | Médio | Baixo | — |
| 6 | **Export CSV** | Médio | Baixo | Item 2 |
| 7 | **Modo automático** | Alto | Médio | Item 4 |
| 8 | **Múltiplos sensores/estufas** | Médio | Alto | — |
| 9 | **Tela de saúde do sistema** | Baixo | Baixo | — |

---

## Arquivos a Criar / Modificar por Feature

### Feature 1 — Persistência do Perfil
- `desktop/src-tauri/src/db.rs` — adicionar tabela `app_settings` + `save_setting` / `load_setting`
- `desktop/src-tauri/src/lib.rs` — ler perfil do DB no `setup`; persistir no `set_profile`

### Feature 2 — Histórico & Relatórios
- `desktop/src/pages/HistoryPage.tsx` ← **novo arquivo**
- `desktop/src/App.tsx` — adicionar rota "history" ao `NAV`
- `desktop/src-tauri/src/lib.rs` — parâmetros opcionais já existem no `get_history`

### Feature 3 — Múltiplos Perfis
- `desktop/src-tauri/src/db.rs` — tabela `profiles`
- `desktop/src-tauri/src/lib.rs` — comandos `list_profiles`, `add_profile`, `delete_profile`, `activate_profile`
- `desktop/src/pages/SettingsPage.tsx` — UI de lista de perfis
- `desktop/src/App.tsx` — dropdown de quick-switch na sidebar

### Feature 4 — Acionamento de Irrigação
- `desktop/src-tauri/src/serial.rs` — função `write_port(port, json)` 
- `desktop/src-tauri/src/lib.rs` — comando `trigger_irrigation(duration_s)`
- `desktop/src-tauri/src/db.rs` — tabela `irrigation_log`
- `desktop/src/pages/Dashboard.tsx` — botão "Irrigar agora" com modal de duração

### Feature 5 — Notificações
- `desktop/src-tauri/Cargo.toml` — dep `tauri-plugin-notification`
- `desktop/src-tauri/src/lib.rs` — chamada na função `ingest()`
- `desktop/src/pages/SettingsPage.tsx` — toggle de notificações

### Feature 6 — Export CSV
- `desktop/src-tauri/Cargo.toml` — dep `csv`
- `desktop/src-tauri/src/lib.rs` — comando `export_history_csv`
- `desktop/src/pages/HistoryPage.tsx` — botão "Exportar" (depende de Feature 2)

### Feature 7 — Modo Automático
- `desktop/src-tauri/src/lib.rs` — flag `auto_irrigate` em `AppState`; lógica em `ingest()`
- `desktop/src/pages/SettingsPage.tsx` — toggle + configuração de cooldown

### Feature 8 — Múltiplos Sensores
- `desktop/src-tauri/src/domain.rs` — campo `source_id` em `SensorReading`
- `desktop/src-tauri/src/db.rs` — índice por `source_id`
- `desktop/src/App.tsx` — seletor de estufa na sidebar
- `desktop/src/lib/types.ts` — atualizar tipos

### Feature 9 — Tela de Saúde
- `desktop/src-tauri/src/lib.rs` — comando `system_health`
- `desktop/src/pages/StatusPage.tsx` ← **novo arquivo**
- `desktop/src/App.tsx` — rota "status"

---

## Convenções a Seguir (padrão atual do projeto)

1. **Rust:** cada módulo novo vai em `src-tauri/src/<modulo>.rs` e é declarado em `lib.rs`
2. **Comandos Tauri:** sempre registrar no `invoke_handler!` em `lib.rs:231`
3. **Tipos compartilhados:** espelhar structs Rust em `src/lib/types.ts` com mesmo nome
4. **Eventos IPC:** prefixo `sensor:`, `conn:`, `deps:` — seguir o padrão já estabelecido
5. **UI:** Tailwind com tokens `leaf-*`, `surface-*` definidos em `tailwind.config.js`
6. **Ícones:** Lucide React (já instalado)
7. **Gráficos:** reutilizar `LiveChart.tsx` para qualquer série temporal
8. **Cards de KPI:** reutilizar `StatCard.tsx`
9. **Sem comentários óbvios** — código é documentação suficiente; adicionar apenas invariantes não-óbvias

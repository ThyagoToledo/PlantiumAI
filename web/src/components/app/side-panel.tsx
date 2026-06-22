"use client";

import { useDemo } from "./demo-state";

export function SidePanel() {
  const { panel, closeAll, showToast, addLocal, signOut, fullName, email, role, initials, exportReport } = useDemo();
  const title = panel === "profile" ? "Meu perfil" : panel === "addLocal" ? "Adicionar local" : panel === "data" ? "Dados & relatórios" : "Guia rápido";

  const genApiKey = () => { const el = document.getElementById("al-apikey") as HTMLInputElement | null; if (el) el.value = "pl_live_" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 6); };
  const onProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    const el = document.getElementById("pf-avatar");
    if (el) { el.style.backgroundImage = "url(" + url + ")"; el.style.backgroundSize = "cover"; el.style.backgroundPosition = "center"; el.textContent = ""; }
    showToast("Foto de perfil atualizada");
  };

  return (
    <aside id="pl-panel" data-open={panel ? "true" : "false"} style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 430, maxWidth: "100%", zIndex: 60, background: "var(--pl-surface-solid)", borderLeft: "1px solid var(--pl-border-glass)", boxShadow: "var(--pl-shadow-float)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "18px 22px", borderBottom: "1px solid var(--pl-border-subtle)" }}>
        <span className="pl-font-display" style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
        <button className="pl-theme-toggle" onClick={closeAll} aria-label="Fechar" style={{ width: 34, height: 34 }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
        {panel === "help" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ margin: 0, fontSize: 14, color: "var(--pl-text-muted)", lineHeight: 1.5 }}>Bem-vindo ao PlantiumAI. Em poucos passos você acompanha sua estufa em tempo real — sem conhecimento técnico.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { n: "1", t: "Escolha sua visão", d: "“Visão geral” para o essencial; “Visão técnica” para gráficos detalhados, estatísticas e exportação." },
                { n: "2", t: "Leia as cores", d: "Verde = tudo bem · Amarelo = atenção · Vermelho = crítico · Azul = informação/histórico." },
                { n: "3", t: "Acompanhe o índice de saúde", d: "O número grande resume todas as condições. Acima de 85% está ótimo." },
                { n: "4", t: "Exporte e compartilhe", d: "Gere relatórios em Excel, CSV ou PDF, ou conecte ao Power BI na visão técnica." },
              ].map((item) => (
                <div key={item.n} style={{ display: "flex", gap: 13 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--pl-brand-green-tint)", color: "var(--pl-brand-green)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{item.n}</span>
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{item.t}</div><div style={{ fontSize: 13, color: "var(--pl-text-muted)" }}>{item.d}</div></div>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: "var(--pl-border-subtle)" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--pl-text-muted)", marginBottom: 10 }}>Sensores monitorados</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[["Umidade do solo", "ideal 35–65%"], ["Temperatura do ar", "ideal 19–27 °C"], ["Umidade do ar", "ideal 50–70%"], ["CO₂", "ideal ≤ 650 ppm"], ["pH do solo", "ideal 5,5–7,5"], ["Luminosidade", "ciclo diurno"]].map(([n, v], i, arr) => (
                  <div key={n} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--pl-border-subtle)" : "none" }}><span style={{ fontWeight: 500 }}>{n}</span><span style={{ color: "var(--pl-text-faint)" }}>{v}</span></div>
                ))}
              </div>
            </div>
            <button className="pl-btn pl-btn--primary pl-btn--block" onClick={closeAll}>Entendi, começar</button>
          </div>
        )}

        {panel === "data" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--pl-text-muted)", marginBottom: 10 }}>Importar dados</div>
              <div style={{ border: "2px dashed var(--pl-border-subtle)", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", cursor: "pointer" }}>
                <span className="pl-kpi__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M8 8l4-4 4 4" /><path d="M5 20h14" /></svg></span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Arraste planilhas aqui</span>
                <span style={{ fontSize: 12, color: "var(--pl-text-muted)" }}>Excel (.xlsx) · CSV · PDF com tabelas</span>
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "var(--pl-surface-raised)" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--pl-success)" }} /><span style={{ fontSize: 13, flex: 1 }}>leituras_estufa_mar.xlsx</span><span className="pl-chip pl-chip--ideal">240 linhas válidas</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "var(--pl-surface-raised)" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--pl-warning)" }} /><span style={{ fontSize: 13, flex: 1 }}>sensores_legado.csv</span><span className="pl-chip pl-chip--atencao">3 erros · revisar</span></div>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--pl-text-faint)" }}>Os dados são validados automaticamente, com pré-visualização e correção manual antes de importar.</p>
            </div>
            <div style={{ height: 1, background: "var(--pl-border-subtle)" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--pl-text-muted)", marginBottom: 10 }}>Exportar relatório</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button className="pl-btn pl-btn--secondary" onClick={() => exportReport("csv")} style={{ justifyContent: "flex-start", gap: 9, padding: "13px 16px" }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#16a34a" }} />Excel/CSV</button>
                <button className="pl-btn pl-btn--secondary" onClick={() => exportReport("csv")} style={{ justifyContent: "flex-start", gap: 9, padding: "13px 16px" }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--pl-info)" }} />CSV</button>
                <button className="pl-btn pl-btn--secondary" onClick={() => exportReport("pdf")} style={{ justifyContent: "flex-start", gap: 9, padding: "13px 16px" }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#ef4444" }} />PDF resumido</button>
                <button className="pl-btn pl-btn--secondary" onClick={() => exportReport("pdf")} style={{ justifyContent: "flex-start", gap: 9, padding: "13px 16px" }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#ef4444" }} />PDF técnico</button>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--pl-text-faint)" }}>PDF profissional com logo, propriedade, data/hora, gráficos, tabelas, indicadores coloridos e recomendações.</p>
            </div>
            <div style={{ height: 1, background: "var(--pl-border-subtle)" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--pl-text-muted)", marginBottom: 10 }}>Integração Power BI</div>
              <div className="pl-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, background: "var(--pl-surface-raised)", boxShadow: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span className="pl-kpi__icon" style={{ background: "rgba(245,158,11,.16)", color: "#f59e0b" }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></svg></span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Conexão automática</div><div style={{ fontSize: 12, color: "var(--pl-text-muted)" }}>Sincronize leituras para relatórios externos</div></div>
                  <span className="pl-chip pl-chip--ideal"><span className="pl-chip__dot" />conectado</span>
                </div>
                <button className="pl-btn pl-btn--primary pl-btn--block" onClick={() => showToast("Abrindo painel no Power BI…")}>Abrir no Power BI</button>
              </div>
            </div>
          </div>
        )}

        {panel === "addLocal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: "var(--pl-text-muted)", lineHeight: 1.5 }}>Cadastre uma nova estufa, container ou plantação para começar a monitorar seus sensores.</p>
            <div className="pl-field"><label className="pl-field__label">Nome do local</label><input id="al-nome" className="pl-input" placeholder="Ex.: Estufa Sul" /></div>
            <div className="pl-field"><label className="pl-field__label">Tipo</label><select id="al-tipo" className="pl-input"><option value="estufa">Estufa</option><option value="container">Container</option><option value="vertical">Plantação vertical</option><option value="campo">Campo aberto</option></select></div>
            <div className="pl-field"><label className="pl-field__label">Unidade</label><input id="al-unidade" className="pl-input" defaultValue="Unidade SP" /></div>
            <div className="pl-field"><label className="pl-field__label">Nº de sensores</label><input id="al-sensores" className="pl-input" type="number" defaultValue="6" min="1" /></div>
            <div className="pl-field"><label className="pl-field__label">Chave de API do local</label><input id="al-apikey" className="pl-input" placeholder="pl_live_…" /><span style={{ fontSize: 12, color: "var(--pl-text-faint)", lineHeight: 1.45 }}>Conecta o dispositivo (ESP32) deste local à plataforma para enviar leituras dos sensores em tempo real.</span></div>
            <button className="pl-btn pl-btn--secondary pl-btn--block pl-btn--sm" onClick={genApiKey} style={{ gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3M16 7l3 3M14 9l2 2" /></svg>Gerar chave automaticamente
            </button>
            <button className="pl-btn pl-btn--primary pl-btn--block" onClick={addLocal}>Adicionar local</button>
            <button className="pl-btn pl-btn--ghost pl-btn--block" onClick={closeAll}>Cancelar</button>
          </div>
        )}

        {panel === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div id="pf-avatar" style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--pl-brand-green-tint)", color: "var(--pl-brand-green)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 30, backgroundSize: "cover", backgroundPosition: "center" }}>{initials}</div>
              <label className="pl-btn pl-btn--secondary pl-btn--sm" style={{ cursor: "pointer", gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h4l2-2h6l2 2h4v12H3z" /><circle cx="12" cy="13" r="3.4" /></svg>Alterar foto
                <input type="file" accept="image/*" onChange={onProfilePhoto} style={{ display: "none" }} />
              </label>
            </div>
            <div className="pl-field"><label className="pl-field__label">Nome</label><input className="pl-input" defaultValue={fullName} key={"n" + fullName} /></div>
            <div className="pl-field"><label className="pl-field__label">Email</label><input className="pl-input" defaultValue={email} key={"e" + email} /></div>
            <div className="pl-field"><label className="pl-field__label">Função</label><input className="pl-input" defaultValue={role} disabled /></div>
            <div style={{ height: 1, background: "var(--pl-border-subtle)" }} />
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--pl-text-muted)" }}>Segurança</div>
            <div className="pl-field"><label className="pl-field__label">Senha atual</label><input className="pl-input" type="password" placeholder="Senha atual" autoComplete="current-password" /></div>
            <div className="pl-field"><label className="pl-field__label">Nova senha</label><input className="pl-input" type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" /></div>
            <button className="pl-btn pl-btn--primary pl-btn--block" onClick={() => showToast("Perfil atualizado")}>Salvar alterações</button>
            <div style={{ height: 1, background: "var(--pl-border-subtle)" }} />
            <form action={signOut}>
              <button type="submit" className="pl-btn pl-btn--block" style={{ background: "var(--pl-danger-tint)", color: "var(--pl-danger)", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5V3h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>Sair da conta
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}

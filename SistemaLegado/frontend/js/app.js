/**
 * PlantiuIA — App Principal
 * Controla navegação, estado e interações do dashboard.
 */

let currentPage = 'dashboard';
let selectedFile = null;
let plantsCache = [];
let currentEditingPlantId = null;

// ===== NAVIGATION =====
function navigateTo(page) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const section = document.getElementById(`page-${page}`);
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (section) section.classList.add('active');
    if (navItem) navItem.classList.add('active');

    const titles = {
        dashboard: 'Dashboard', analysis: 'Análise de Saúde', irrigation: 'Irrigação',
        plants: 'Minhas Plantas', consult: 'Consultar IA', settings: 'Configurações'
    };
    document.getElementById('page-title').textContent = titles[page] || page;
    currentPage = page;

    if (page === 'dashboard') loadDashboard();
    if (page === 'plants') loadPlants();
    if (page === 'settings') loadSettings();
    if (page === 'analysis' || page === 'irrigation') refreshPlantSelects();
}

// ===== TOAST =====
function showToast(message, type = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 4000);
}

// ===== MODAL =====
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function openAddPlantModal() { openModal('modal-add-plant'); }

// ===== PLANTS DATALIST / LOOKUP =====
async function refreshPlantSelects() {
    try {
        const plants = plantsCache.length ? plantsCache : await api.getPlants();
        plantsCache = plants;
        const dl = document.getElementById('plants-datalist');
        if (dl) dl.innerHTML = plants.map(p => `<option value="${p.name}">`).join('');
    } catch (e) { /* silent */ }
}

function getPlantByInput(inputId) {
    const val = (document.getElementById(inputId)?.value || '').trim().toLowerCase();
    if (!val) return null;
    return plantsCache.find(p => p.name.toLowerCase() === val) || null;
}

// ===== DASHBOARD =====
async function loadDashboard() {
    try {
        const data = await api.getDashboard();
        document.getElementById('stat-plants').textContent = data.total_plants;
        document.getElementById('stat-analyses').textContent = data.total_analyses;
        document.getElementById('stat-irrigations').textContent = data.total_irrigations;
        document.getElementById('stat-alerts').textContent = data.unread_alerts;

        const sub = data.healthy_plants > 0
            ? `${data.healthy_plants} saudáveis, ${data.plants_needing_attention} atenção`
            : 'Nenhuma planta cadastrada';
        document.getElementById('stat-plants-sub').textContent = sub;

        const ra = document.getElementById('recent-analyses');
        if (data.recent_analyses && data.recent_analyses.length > 0) {
            ra.innerHTML = data.recent_analyses.map(a => `
                <div class="alert-item">
                    <div class="alert-dot ${a.health === 'critical' ? 'critical' : a.health === 'poor' ? 'warning' : 'info'}"></div>
                    <div>
                        <div class="alert-title">${a.type === 'leaf' ? 'Folha' : 'Planta'} — Planta #${a.plant_id}</div>
                        <div class="alert-message"><span class="health-badge ${a.health}">${a.health}</span> (${a.confidence}%) via ${a.provider}</div>
                        <div class="alert-time">${new Date(a.created_at).toLocaleString('pt-BR')}</div>
                    </div>
                </div>
            `).join('');
        }

        renderAIStatus(data.ai_status);
    } catch (e) {
        showToast('Erro ao carregar dashboard: ' + e.message, 'error');
    }
}

function getActiveProvider(status) {
    if (!status) return null;
    const providers = status.providers || {};
    const mode = status.mode || '';
    const apiProviders = Object.keys(providers).filter(k => !['ollama', 'local_model'].includes(k));
    const localProviders = ['local_model', 'ollama'].filter(k => k in providers);
    let order = [];
    if (mode === 'local_only') order = localProviders;
    else if (mode === 'api_only') order = apiProviders;
    else if (mode === 'hybrid_prefer_api') order = [...apiProviders, ...localProviders];
    else if (mode === 'hybrid_prefer_local') order = [...localProviders, ...apiProviders];
    else order = ['local_model', ...apiProviders, 'ollama'].filter(k => k in providers);
    for (const name of order) {
        const cb = (providers[name] || {}).circuit_breaker || {};
        if (cb.is_available) return { name, info: providers[name] };
    }
    return null;
}

function renderAIStatus(status) {
    if (!status) return;
    const el = document.getElementById('ai-status-detail');
    const providers = status.providers || {};
    const metrics = status.metrics || {};
    const active = getActiveProvider(status);

    const bannerEl = document.getElementById('ai-fallback-banner');
    if (bannerEl) {
        const isLocal = active && ['local_model', 'ollama'].includes(active.name);
        const hasApiConfigured = Object.keys(providers).some(k => !['ollama', 'local_model'].includes(k));
        if (isLocal && hasApiConfigured) {
            bannerEl.innerHTML = `<div class="ai-fallback-notice local">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
                    <line x1="6" y1="6" x2="6.01" y2="6" stroke-width="3"/><line x1="6" y1="18" x2="6.01" y2="18" stroke-width="3"/>
                </svg>
                <span>Usando <strong>IA Local${active.name === 'local_model' ? ' (GGUF)' : ' (Ollama)'}</strong> &mdash; API indispon&iacute;vel ou n&atilde;o configurada</span>
            </div>`;
            bannerEl.style.display = 'block';
        } else if (active && !['local_model', 'ollama'].includes(active.name)) {
            bannerEl.innerHTML = `<div class="ai-fallback-notice api">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/>
                </svg>
                <span>Usando <strong>${active.name.toUpperCase()}</strong> &mdash; API em nuvem</span>
            </div>`;
            bannerEl.style.display = 'block';
        } else {
            bannerEl.style.display = 'none';
        }
    }

    let html = `<div class="diagnosis-item"><div class="diagnosis-label">Modo</div><div class="diagnosis-value">${status.mode}</div></div>`;
    if (active) {
        html += `<div class="diagnosis-item"><div class="diagnosis-label">Provedor Ativo</div><div class="diagnosis-value" style="color:var(--status-excellent)">${active.name} (${active.info.type})</div></div>`;
    } else {
        html += `<div class="diagnosis-item"><div class="diagnosis-label">Provedor Ativo</div><div class="diagnosis-value" style="color:var(--status-critical)">Nenhum dispon&iacute;vel</div></div>`;
    }
    html += `<div class="diagnosis-item"><div class="diagnosis-label">Requisi&ccedil;&otilde;es</div><div class="diagnosis-value">${metrics.total_requests || 0} total &mdash; ${metrics.success_rate || 0}% sucesso &mdash; ${metrics.failover_count || 0} failovers</div></div>`;

    for (const [name, info] of Object.entries(providers)) {
        const cb = info.circuit_breaker || {};
        const isActive = active && active.name === name;
        const stateColor = cb.state === 'closed' ? 'var(--status-excellent)' : cb.state === 'open' ? 'var(--status-critical)' : 'var(--status-moderate)';
        html += `<div class="diagnosis-item" ${isActive ? 'style="border-left:2px solid var(--accent);padding-left:10px"' : ''}>
            <div class="diagnosis-label" style="display:flex;align-items:center;gap:6px">
                <span style="width:7px;height:7px;border-radius:50%;background:${stateColor};flex-shrink:0;display:inline-block"></span>
                ${name}${isActive ? ' <span style="color:var(--accent);font-size:0.7rem;font-weight:700">(ATIVO)</span>' : ''}
            </div>
            <div class="diagnosis-value">${info.type} &mdash; ${cb.state || 'unknown'} (${cb.failure_count || 0}/${cb.failure_threshold || 3} falhas)</div>
        </div>`;
    }
    el.innerHTML = html;

    const dot = document.getElementById('ai-status-dot');
    const txt = document.getElementById('ai-status-text');
    const isLocalActive = active && ['local_model', 'ollama'].includes(active.name);
    dot.className = `ai-status-dot${!active ? ' offline' : isLocalActive ? ' local' : ''}`;
    txt.textContent = !active ? 'IA: Offline' : isLocalActive ? 'IA: Local' : `IA: ${active.name}`;
}

// ===== PLANTS =====
async function loadPlants() {
    try {
        const plants = await api.getPlants();
        plantsCache = plants;
        const el = document.getElementById('plants-list');
        if (plants.length === 0) {
            el.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                        </svg>
                    </div>
                    <div class="empty-text">Nenhuma planta cadastrada</div>
                    <button class="btn btn-primary" onclick="openAddPlantModal()">Cadastrar Primeira Planta</button>
                </div>`;
            return;
        }
        el.innerHTML = `<table class="data-table">
            <thead><tr><th>Nome</th><th>Espécie</th><th>Estágio</th><th>Local</th><th>Ações</th></tr></thead>
            <tbody>${plants.map(p => `
            <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.species || '—'}</td>
                <td>${p.stage}</td>
                <td>${p.location || '—'}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="openEditPlantModal(${p.id})" style="margin-right:6px">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deletePlant(${p.id})">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Remover
                    </button>
                </td>
            </tr>`).join('')}</tbody></table>`;
    } catch (e) { showToast('Erro ao carregar plantas: ' + e.message, 'error'); }
}

async function createPlant() {
    const name = document.getElementById('plant-name').value.trim();
    if (!name) { showToast('Nome é obrigatório', 'error'); return; }
    try {
        await api.createPlant({
            name,
            species: document.getElementById('plant-species').value,
            stage: document.getElementById('plant-stage').value,
            location: document.getElementById('plant-location').value,
        });
        showToast(`Planta "${name}" cadastrada!`, 'success');
        closeModal('modal-add-plant');
        document.getElementById('plant-name').value = '';
        document.getElementById('plant-species').value = '';
        document.getElementById('plant-location').value = '';
        loadPlants();
        refreshPlantSelects();
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

async function deletePlant(id) {
    if (!confirm('Remover esta planta e todos os dados associados?')) return;
    try {
        await api.deletePlant(id);
        showToast('Planta removida', 'success');
        loadPlants();
        refreshPlantSelects();
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

async function openEditPlantModal(id) {
    try {
        const plant = await api.getPlant(id);
        currentEditingPlantId = id;
        document.getElementById('edit-plant-name').value = plant.name;
        document.getElementById('edit-plant-species').value = plant.species || '';
        document.getElementById('edit-plant-stage').value = plant.stage || 'vegetative';
        document.getElementById('edit-plant-location').value = plant.location || '';
        openModal('modal-edit-plant');
    } catch (e) {
        showToast('Erro ao carregar planta: ' + e.message, 'error');
    }
}

async function saveEditPlant() {
    if (currentEditingPlantId === null) return;
    const name = document.getElementById('edit-plant-name').value.trim();
    if (!name) { showToast('Nome é obrigatório', 'error'); return; }
    try {
        await api.updatePlant(currentEditingPlantId, {
            name,
            species: document.getElementById('edit-plant-species').value,
            stage: document.getElementById('edit-plant-stage').value,
            location: document.getElementById('edit-plant-location').value,
        });
        showToast(`Planta "${name}" atualizada!`, 'success');
        closeModal('modal-edit-plant');
        currentEditingPlantId = null;
        loadPlants();
        refreshPlantSelects();
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

// ===== ANALYSIS =====
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = e => {
        const preview = document.getElementById('upload-preview');
        preview.src = e.target.result;
        preview.style.display = 'block';
        const zone = document.getElementById('upload-zone');
        zone.querySelector('.upload-icon').style.display = 'none';
        zone.querySelector('.upload-text').textContent = file.name;
        zone.querySelector('.upload-hint').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    };
    reader.readAsDataURL(file);
    document.getElementById('btn-analyze').disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
    // Upload zone drag & drop
    const zone = document.getElementById('upload-zone');
    if (zone) {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const input = document.getElementById('file-input');
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                handleFileSelect({ target: input });
            }
        });
    }

    // Irrigation: atualiza sensores ao selecionar planta no input
    const irrigInput = document.getElementById('irrigation-plant-input');
    if (irrigInput) {
        irrigInput.addEventListener('change', async function () {
            if (!plantsCache.length) {
                try { plantsCache = await api.getPlants(); } catch { /* ignore */ }
            }
            const plant = getPlantByInput('irrigation-plant-input');
            if (!plant) { renderSensorData(null); return; }
            try {
                const reading = await api.getLatestSensor(plant.id);
                renderSensorData(reading);
            } catch { renderSensorData(null); }
        });
    }

    loadDashboard();
    refreshPlantSelects();
});

async function submitAnalysis() {
    if (!plantsCache.length) {
        try { plantsCache = await api.getPlants(); } catch { /* ignore */ }
    }
    const plant = getPlantByInput('analysis-plant-input');
    if (!plant) { showToast('Planta não encontrada. Selecione um nome da lista', 'error'); return; }
    if (!selectedFile) { showToast('Selecione uma imagem', 'error'); return; }

    const btn = document.getElementById('btn-analyze');
    btn.disabled = true;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 0.8s linear infinite"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Analisando...`;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('plant_id', plant.id);
    formData.append('analysis_type', document.getElementById('analysis-type-select').value);
    formData.append('extra_info', document.getElementById('analysis-extra').value);

    try {
        const result = await api.analyzeImage(formData);
        renderAnalysisResult(result);
        showToast('Análise concluída!', 'success');
    } catch (e) {
        showToast('Erro na análise: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/></svg> Analisar com IA`;
    }
}

function renderAnalysisResult(r) {
    const el = document.getElementById('analysis-result');
    const d = r.diagnosis || {};
    const recs = r.recommendations || [];
    const obs = r.observations || [];

    el.innerHTML = `
        <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-lg)">
            <span class="health-badge ${r.health_status}" style="font-size:0.85rem;padding:6px 16px">${r.health_status.toUpperCase()}</span>
            <span style="color:var(--text-secondary);font-size:0.85rem">${r.confidence}% confiança — via ${r.ai_provider} (${r.latency_ms.toFixed(0)}ms)</span>
        </div>
        <div class="diagnosis-item">
            <div class="diagnosis-label">Diagnóstico Principal</div>
            <div class="diagnosis-value">${d.primary_issue || '—'}</div>
        </div>
        <div class="diagnosis-item">
            <div class="diagnosis-label">Categoria / Severidade</div>
            <div class="diagnosis-value">${d.category || '—'} / ${d.severity || '—'}</div>
        </div>
        ${d.details ? `<div class="diagnosis-item"><div class="diagnosis-label">Detalhes</div><div class="diagnosis-value">${d.details}</div></div>` : ''}
        ${obs.length > 0 ? `<div class="diagnosis-item"><div class="diagnosis-label">Observações</div><div class="diagnosis-value">${obs.map(o => `&bull; ${o}`).join('<br>')}</div></div>` : ''}
        ${recs.length > 0 ? `<div class="diagnosis-item"><div class="diagnosis-label">Recomendações</div><div class="diagnosis-value">${recs.map(r => `&bull; <strong>[${r.priority}]</strong> ${r.action}: ${r.details || ''}`).join('<br>')}</div></div>` : ''}
    `;
}

// ===== IRRIGATION =====
function renderSensorData(r) {
    const el = document.getElementById('irrigation-sensors');
    if (!r) {
        el.innerHTML = `<div class="empty-state"><div class="empty-text" style="font-size:0.85rem">Nenhum dado de sensor. Clique em "Simular Sensores".</div></div>`;
        return;
    }
    const moistureColor = r.soil_moisture < 30 ? 'var(--status-critical)' : r.soil_moisture < 50 ? 'var(--status-moderate)' : 'var(--status-excellent)';
    el.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-md)">
            <div class="gauge-container" style="--percent:${r.soil_moisture || 0}">
                <div class="gauge-ring" style="background:conic-gradient(${moistureColor} ${(r.soil_moisture || 0) * 3.6}deg, var(--border) 0)">
                    <span class="gauge-value">${(r.soil_moisture || 0).toFixed(0)}%</span>
                </div>
                <div class="gauge-label">Umidade Solo</div>
            </div>
            <div class="gauge-container">
                <div style="font-size:2rem;font-weight:700;color:var(--orange)">${(r.air_temperature || 0).toFixed(1)}&deg;</div>
                <div class="gauge-label">Temperatura</div>
            </div>
            <div class="gauge-container">
                <div style="font-size:2rem;font-weight:700;color:var(--blue)">${(r.air_humidity || 0).toFixed(0)}%</div>
                <div class="gauge-label">Umidade Ar</div>
            </div>
        </div>`;
}

async function askAIIrrigation() {
    if (!plantsCache.length) {
        try { plantsCache = await api.getPlants(); } catch { /* ignore */ }
    }
    const plant = getPlantByInput('irrigation-plant-input');
    if (!plant) { showToast('Planta não encontrada. Digite um nome válido', 'error'); return; }

    const el = document.getElementById('irrigation-decision');
    el.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const decision = await api.decideIrrigation(plant.id);
        const urgColor = { none: 'var(--text-dim)', low: 'var(--status-good)', medium: 'var(--status-moderate)', high: 'var(--status-poor)', critical: 'var(--status-critical)' };
        el.innerHTML = `
            <div class="diagnosis-item">
                <div class="diagnosis-label">Decisão</div>
                <div class="diagnosis-value decision-value ${decision.should_irrigate ? 'irrigate' : 'hold'}">
                    ${decision.should_irrigate ? 'IRRIGAR &mdash; ' + decision.duration_minutes + ' minutos' : 'N&Atilde;O IRRIGAR AGORA'}
                </div>
            </div>
            <div class="diagnosis-item">
                <div class="diagnosis-label">Confiança / Urgência</div>
                <div class="diagnosis-value">${decision.confidence}% &mdash; <span style="color:${urgColor[decision.urgency] || 'inherit'}">${decision.urgency}</span></div>
            </div>
            <div class="diagnosis-item">
                <div class="diagnosis-label">Raciocínio</div>
                <div class="diagnosis-value">${decision.reasoning}</div>
            </div>
            ${decision.warnings?.length ? `<div class="diagnosis-item"><div class="diagnosis-label">Avisos</div><div class="diagnosis-value">${decision.warnings.join('<br>')}</div></div>` : ''}
            <div style="margin-top:var(--space-md);font-size:0.8rem;color:var(--text-dim)">Próxima verificação em ${decision.next_check_minutes} min</div>
        `;
        if (decision.should_irrigate) showToast(`IA recomenda irrigar por ${decision.duration_minutes} min`, 'info');
    } catch (e) {
        el.innerHTML = `<div class="empty-state"><div class="empty-text" style="color:var(--status-critical)">${e.message}</div></div>`;
    }
}

async function triggerManualIrrigation() {
    if (!plantsCache.length) {
        try { plantsCache = await api.getPlants(); } catch { /* ignore */ }
    }
    const plant = getPlantByInput('irrigation-plant-input');
    if (!plant) { showToast('Planta não encontrada. Digite um nome válido', 'error'); return; }
    try {
        await api.triggerIrrigation({ plant_id: plant.id, duration_minutes: 15, triggered_by: 'manual' });
        showToast('Irrigação manual ativada (15 min)', 'success');
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

// ===== SENSORS =====
async function simulateSensors() {
    if (plantsCache.length === 0) {
        try { plantsCache = await api.getPlants(); } catch { showToast('Cadastre uma planta primeiro', 'error'); return; }
    }
    if (plantsCache.length === 0) { showToast('Cadastre uma planta primeiro', 'error'); return; }
    try {
        for (const p of plantsCache) await api.simulateSensor(p.id);
        showToast(`Sensores simulados para ${plantsCache.length} planta(s)`, 'success');
        if (currentPage === 'dashboard') loadDashboard();
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

// ===== SETTINGS =====
async function loadSettings() {
    try {
        const status = await api.getAIStatus();
        document.getElementById('settings-ai-mode').value = status.mode;
        renderProvidersStatus(status.providers);
    } catch (e) { showToast('Erro ao carregar configurações', 'error'); }
}

function renderProvidersStatus(providers) {
    const el = document.getElementById('providers-status');
    let html = '';
    for (const [name, info] of Object.entries(providers)) {
        const cb = info.circuit_breaker || {};
        const stateColor = cb.state === 'closed' ? 'var(--status-excellent)' : cb.state === 'open' ? 'var(--status-critical)' : 'var(--status-moderate)';
        html += `<div class="diagnosis-item">
            <div class="diagnosis-label" style="display:flex;align-items:center;gap:8px">
                <span style="width:8px;height:8px;border-radius:50%;background:${stateColor};display:inline-block;flex-shrink:0"></span>
                ${name} (${info.type})
            </div>
            <div class="diagnosis-value" style="font-size:0.85rem">
                Estado: ${cb.state} &nbsp;|&nbsp; Falhas: ${cb.failure_count}/${cb.failure_threshold} &nbsp;|&nbsp; Disponível: ${cb.is_available ? 'Sim' : 'Não'}
            </div>
        </div>`;
    }
    el.innerHTML = html || '<div class="empty-state"><div class="empty-text">Nenhum provedor configurado</div></div>';
}

async function changeAIMode(mode) {
    try {
        await api.setAIMode(mode);
        showToast(`Modo alterado: ${mode}`, 'success');
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

async function resetCircuitBreakers() {
    try {
        await api.resetCB();
        showToast('Circuit breakers resetados', 'success');
        loadSettings();
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

// ===== CONSULTATION =====
async function submitConsultation() {
    const question = document.getElementById('consult-question').value.trim();
    if (!question || question.length < 5) { showToast('Escreva uma pergunta', 'error'); return; }

    const el = document.getElementById('consult-result');
    el.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const result = await api.consult({ question });
        el.innerHTML = `
            <div class="card" style="margin-top:var(--space-md)">
                <div class="card-header">
                    <h3 class="card-title">Resposta</h3>
                    <div class="card-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                </div>
                <div style="white-space:pre-wrap;line-height:1.7;font-size:0.92rem">${result.answer}</div>
                <div style="margin-top:var(--space-md);font-size:0.75rem;color:var(--text-dim)">
                    via ${result.provider} (${result.model}) &mdash; ${result.latency_ms.toFixed(0)}ms
                </div>
            </div>`;
    } catch (e) {
        el.innerHTML = `<div class="diagnosis-item" style="color:var(--status-critical)">Erro: ${e.message}</div>`;
    }
}

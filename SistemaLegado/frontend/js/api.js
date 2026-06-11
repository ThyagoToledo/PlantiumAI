/**
 * PlantiuIA — API Client
 * Comunicação com o backend FastAPI
 */

const API_BASE = '/api';

const api = {
    // ===== HTTP Helpers =====
    async request(method, path, body = null, isFormData = false) {
        const opts = { method, headers: {} };
        if (body && !isFormData) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        } else if (body && isFormData) {
            opts.body = body;
        }
        try {
            const res = await fetch(`${API_BASE}${path}`, opts);
            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: res.statusText }));
                throw new Error(err.detail || `Erro ${res.status}`);
            }
            return await res.json();
        } catch (e) {
            if (e.message === 'Failed to fetch') throw new Error('Servidor indisponível');
            throw e;
        }
    },

    get(path) { return this.request('GET', path); },
    post(path, body, isFormData = false) { return this.request('POST', path, body, isFormData); },
    put(path, body) { return this.request('PUT', path, body); },
    del(path) { return this.request('DELETE', path); },

    // ===== Dashboard =====
    getDashboard() { return this.get('/dashboard/summary'); },

    // ===== Plants =====
    getPlants() { return this.get('/plants/'); },
    getPlant(id) { return this.get(`/plants/${id}`); },
    createPlant(data) { return this.post('/plants/', data); },
    updatePlant(id, data) { return this.put(`/plants/${id}`, data); },
    deletePlant(id) { return this.del(`/plants/${id}`); },

    // ===== Analysis =====
    analyzeImage(formData) { return this.post('/analysis/image', formData, true); },
    getAnalysisHistory(plantId, limit = 20) { return this.get(`/analysis/history/${plantId}?limit=${limit}`); },
    getLatestAnalysis(plantId) { return this.get(`/analysis/latest/${plantId}`); },

    // ===== Sensors =====
    simulateSensor(plantId) { return this.post(`/sensors/simulate/${plantId}`); },
    getLatestSensor(plantId) { return this.get(`/sensors/latest/${plantId}`); },
    getSensorHistory(plantId, limit = 50) { return this.get(`/sensors/history/${plantId}?limit=${limit}`); },

    // ===== Irrigation =====
    decideIrrigation(plantId) { return this.post(`/irrigation/decide/${plantId}`); },
    triggerIrrigation(data) { return this.post('/irrigation/trigger', data); },
    getIrrigationHistory(plantId) { return this.get(`/irrigation/history/${plantId}`); },

    // ===== AI Settings =====
    getAIStatus() { return this.get('/settings/ai/status'); },
    setAIMode(mode) { return this.put(`/settings/ai/mode?mode=${mode}`); },
    resetCB(provider = null) {
        const q = provider ? `?provider=${provider}` : '';
        return this.post(`/settings/ai/reset-circuit-breaker${q}`);
    },
    getAIModes() { return this.get('/settings/ai/modes'); },

    // ===== Consultation =====
    consult(data) { return this.post('/dashboard/consult', data); },

    // ===== Health =====
    health() { return this.get('/health'); },
};

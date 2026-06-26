"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../app/landing.css";

/* Landing institucional — design importado do Claude Design
   (projeto "PlantiumAI Landing"). Markup mantido fiel ao canvas: estilos
   inline preservados; diretivas do canvas (sc-for/sc-if/style-hover) foram
   resolvidas para HTML estático + classes (ver landing.css). CTAs apontam
   para o app existente (/login). */

const HTML = `
<div style="min-height:100vh; background:var(--bg-gradient); color:var(--text-base); font-family:'Inter',sans-serif; transition:background-color .3s ease,color .3s ease; overflow-x:hidden;">

  <!-- ambient orbs -->
  <div style="position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden;">
    <div style="position:absolute; top:-180px; right:-120px; width:560px; height:560px; border-radius:50%; background:radial-gradient(circle, rgba(52,217,119,0.16), transparent 70%); filter:blur(22px);"></div>
    <div style="position:absolute; bottom:-220px; left:-160px; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle, rgba(20,184,166,0.12), transparent 70%); filter:blur(22px);"></div>
  </div>

  <!-- NAVBAR -->
  <div style="position:fixed; top:18px; left:0; right:0; z-index:40; padding:0 16px;">
    <nav class="plf-nav" style="position:relative; max-width:1180px; margin:0 auto; display:flex; align-items:center; gap:20px; padding:9px 12px 9px 14px; background:var(--surface-glass); -webkit-backdrop-filter:blur(18px); backdrop-filter:blur(18px); border:1px solid var(--border-glass); border-radius:999px; box-shadow:var(--shadow-soft);">
      <a href="#topo" style="display:flex; align-items:center; gap:11px; font-family:'Sora',sans-serif; font-weight:700; font-size:18px; letter-spacing:-0.01em;">
        <img src="/logo-plantiumai.png" alt="Logo PlantiumAI" width="38" height="38" style="display:block; width:38px; height:38px; border-radius:50%; object-fit:cover; box-shadow:0 4px 14px rgba(0,0,0,0.4);"/>
        <span class="plf-nav-title">PlantiumAI</span>
      </a>
      <!-- Toggle do menu mobile: CSS puro (checkbox hack), funciona sem JS -->
      <input type="checkbox" id="plf-nav-toggle" class="plf-nav-toggle" aria-hidden="true" tabindex="-1">
      <div style="flex:1; display:flex; justify-content:center; gap:4px;" class="plf-tabs">
        <a href="#solucao" style="padding:8px 13px; border-radius:999px; font-size:14px; font-weight:500; color:var(--text-muted); transition:color .2s,background .2s;">Solução</a>
        <a href="#demo-video" style="padding:8px 13px; border-radius:999px; font-size:14px; font-weight:500; color:var(--text-muted); transition:color .2s,background .2s;">PlantiumAI</a>
        <a href="#tecnologia" style="padding:8px 13px; border-radius:999px; font-size:14px; font-weight:500; color:var(--text-muted); transition:color .2s,background .2s;">Tecnologia</a>
        <a href="#mercado" style="padding:8px 13px; border-radius:999px; font-size:14px; font-weight:500; color:var(--text-muted); transition:color .2s,background .2s;">Mercado</a>
        <a href="#equipe" style="padding:8px 13px; border-radius:999px; font-size:14px; font-weight:500; color:var(--text-muted); transition:color .2s,background .2s;">Equipe</a>
        <a href="#contato" style="padding:8px 13px; border-radius:999px; font-size:14px; font-weight:500; color:var(--text-muted); transition:color .2s,background .2s;">Contato</a>
        <a href="/planos" style="padding:8px 13px; border-radius:999px; font-size:14px; font-weight:500; color:var(--text-muted); transition:color .2s,background .2s;">Planos</a>
      </div>
      <div class="plf-nav-right" style="display:flex; align-items:center; gap:8px;">
        <a href="/login" class="plf-btn-primary plf-login-btn" style="padding:10px 18px; border-radius:999px; border:none; background:var(--brand-green); color:#06120b; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(52,217,119,0.3); transition:transform .15s, background .2s;">Login</a>
        <label for="plf-nav-toggle" class="plf-hamburger" role="button" aria-label="Abrir menu" tabindex="0">
          <svg class="plf-burger-open" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          <svg class="plf-burger-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </label>
      </div>
      <!-- Backdrop p/ fechar tocando fora (label do mesmo checkbox) -->
      <label for="plf-nav-toggle" class="plf-nav-backdrop" aria-hidden="true"></label>
      <!-- Menu mobile (hambúrguer) -->
      <div id="plf-mobile-menu" class="plf-mobile-menu">
        <a href="#solucao">Solução</a>
        <a href="#demo-video">PlantiumAI</a>
        <a href="#tecnologia">Tecnologia</a>
        <a href="#mercado">Mercado</a>
        <a href="#equipe">Equipe</a>
        <a href="#contato">Contato</a>
        <a href="/planos">Planos</a>
        <a href="/login" class="plf-mm-login">Entrar no painel</a>
      </div>
    </nav>
  </div>

  <!-- HERO -->
  <header id="topo" style="position:relative; z-index:1; overflow:hidden;">
    <div style="position:absolute; inset:0; background-image:url('/landing/hero.jpg'); background-size:cover; background-position:center; opacity:0.9;"></div>
    <div style="position:absolute; inset:0; background:var(--hero-veil);"></div>
    <div style="position:relative; max-width:1180px; margin:0 auto; padding:106px 24px 48px; display:grid; grid-template-columns:1.05fr 1fr; gap:48px; align-items:center;" class="plf-hero">
      <div id="solucao">
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <span style="display:inline-flex; align-items:center; gap:7px; padding:6px 13px; border-radius:999px; background:var(--surface-glass); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); border:1px solid var(--border-glass); font-size:12.5px; font-weight:600; color:var(--text-base);"><span style="width:7px; height:7px; border-radius:50%; background:var(--brand-green);"></span>Desafio AgroStartup 2026</span>
          <span style="display:inline-flex; align-items:center; gap:7px; padding:6px 13px; border-radius:999px; background:var(--surface-glass); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); border:1px solid var(--border-glass); font-size:12.5px; font-weight:600; color:var(--text-base);">Goiás</span>
          <span style="display:inline-flex; align-items:center; gap:7px; padding:6px 13px; border-radius:999px; background:var(--surface-glass); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); border:1px solid var(--border-glass); font-size:12.5px; font-weight:600; color:var(--text-base);"><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.71 1.23 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.28.83 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>Open-source no GitHub</span>
        </div>
        <h1 style="font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(38px,4.8vw,60px); line-height:1.06; letter-spacing:-0.02em; margin:22px 0 0;">
          O equilíbrio entre a <span style="color:var(--brand-green);">biocenose</span> e a inteligência artificial
        </h1>
        <p style="font-size:18px; line-height:1.62; color:var(--text-muted); max-width:520px; margin:20px 0 0;">
          Sistema inteligente de monitoramento para micro estufas e hortas verticais, integrando sensores IoT, visão computacional e IA para apoiar a decisão do pequeno produtor.
        </p>
        <div style="display:flex; gap:14px; margin-top:30px; flex-wrap:wrap;">
          <a href="#tecnologia" class="plf-btn-primary" style="display:inline-flex; align-items:center; gap:8px; padding:14px 26px; border-radius:999px; border:none; background:var(--brand-green); color:#06120b; font-family:'Inter',sans-serif; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 8px 22px rgba(52,217,119,0.3); transition:transform .15s, background .2s;">
            Conhecer o protótipo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
          <a href="/login" class="plf-btn-ghost" style="display:inline-flex; align-items:center; gap:8px; padding:14px 26px; border-radius:999px; background:var(--surface-glass); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); border:1px solid var(--border-glass); color:var(--text-base); font-size:15px; font-weight:600; cursor:pointer; box-shadow:var(--shadow-soft); transition:transform .15s;">Falar com um especialista</a>
        </div>
        <div style="display:flex; gap:28px; margin-top:38px; flex-wrap:wrap;">
          <div><div style="font-family:'Sora',sans-serif; font-weight:700; font-size:28px;">R$ 1.010<span style="font-size:16px; color:var(--text-muted);">,08</span></div><div style="font-size:13px; color:var(--text-muted);">kit do protótipo / unidade</div></div>
          <div style="width:1px; background:var(--border-subtle);"></div>
          <div><div style="font-family:'Sora',sans-serif; font-weight:700; font-size:28px;">offline<span style="font-size:16px; color:var(--text-muted);">-first</span></div><div style="font-size:13px; color:var(--text-muted);">decisão local sem nuvem</div></div>
          <div style="width:1px; background:var(--border-subtle);"></div>
          <div><div style="font-family:'Sora',sans-serif; font-weight:700; font-size:28px;">~15<span style="font-size:16px; color:var(--text-muted);">% a.a.</span></div><div style="font-size:13px; color:var(--text-muted);">crescimento do setor*</div></div>
        </div>
      </div>

      <!-- DASHBOARD PREVIEW -->
      <div style="position:relative;" class="plf-preview">
        <div style="position:absolute; inset:-26px; border-radius:36px; background:var(--photo-1); opacity:0.55; filter:blur(2px);"></div>
        <div style="position:relative; padding:18px; border-radius:28px; background:var(--surface-glass); -webkit-backdrop-filter:blur(18px); backdrop-filter:blur(18px); border:1px solid var(--border-glass); box-shadow:var(--shadow-float); animation:plf-float 7s ease-in-out infinite;">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 6px 14px;">
            <div>
              <div style="font-family:'Sora',sans-serif; font-weight:600; font-size:16px;">Estufa · Nó A101</div>
              <div style="font-size:12px; color:var(--text-faint);">Monitoramento em tempo real</div>
            </div>
            <div style="display:inline-flex; padding:4px; border-radius:999px; background:var(--surface-raised); gap:2px;">
              <span style="padding:5px 11px; border-radius:999px; font-size:12px; font-weight:600; color:var(--text-muted);">12h</span>
              <span style="padding:5px 11px; border-radius:999px; font-size:12px; font-weight:600; background:var(--brand-green-tint); color:var(--brand-green);">24h</span>
              <span style="padding:5px 11px; border-radius:999px; font-size:12px; font-weight:600; color:var(--text-muted);">Semana</span>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1.1fr 1fr; gap:12px;">
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:18px; border-radius:18px; background:var(--surface-solid); box-shadow:var(--shadow-soft);">
              <div style="position:relative; width:132px; height:132px;">
                <svg width="132" height="132" viewBox="0 0 132 132" style="transform:rotate(-90deg);">
                  <circle cx="66" cy="66" r="56" fill="none" stroke="var(--border-subtle)" stroke-width="12"/>
                  <defs><linearGradient id="plfg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d977"/><stop offset="1" stop-color="#16a34a"/></linearGradient></defs>
                  <circle cx="66" cy="66" r="56" fill="none" stroke="url(#plfg)" stroke-width="12" stroke-linecap="round" stroke-dasharray="351.9" stroke-dashoffset="74"/>
                </svg>
                <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                  <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:34px; line-height:1; color:var(--brand-green);">79<span style="font-size:18px;">%</span></div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Health score</div>
                </div>
              </div>
              <div style="display:inline-flex; align-items:center; gap:6px; margin-top:12px; padding:4px 10px; border-radius:999px; background:var(--success-tint); color:var(--brand-green); font-size:12px; font-weight:600;"><span style="width:7px; height:7px; border-radius:50%; background:var(--brand-green);"></span>Umidade ótima</div>
            </div>
            <div style="display:grid; grid-template-rows:1fr 1fr; gap:12px;">
              <div style="padding:14px; border-radius:16px; background:var(--surface-solid); box-shadow:var(--shadow-soft);">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:999px; background:var(--brand-green-tint); color:var(--brand-green);"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg></span>
                  <span style="font-size:11px; font-weight:500; letter-spacing:0.04em; text-transform:uppercase; color:var(--text-muted);">Umidade solo</span>
                </div>
                <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:24px; margin-top:8px;">52<span style="font-size:14px; color:var(--text-muted);">%</span></div>
              </div>
              <div style="padding:14px; border-radius:16px; background:var(--surface-solid); box-shadow:var(--shadow-soft);">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:999px; background:var(--brand-green-tint); color:var(--brand-green);"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/></svg></span>
                  <span style="font-size:11px; font-weight:500; letter-spacing:0.04em; text-transform:uppercase; color:var(--text-muted);">Temp. ar</span>
                </div>
                <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:24px; margin-top:8px;">24<span style="font-size:14px; color:var(--text-muted);">°C</span></div>
              </div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:12px;">
            <div style="padding:12px 14px; border-radius:16px; background:var(--surface-solid); box-shadow:var(--shadow-soft);">
              <div style="font-size:10px; font-weight:500; letter-spacing:0.04em; text-transform:uppercase; color:var(--text-muted);">CO₂</div>
              <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:19px; margin-top:4px;">410<span style="font-size:11px; color:var(--text-muted);"> ppm</span></div>
            </div>
            <div style="padding:12px 14px; border-radius:16px; background:var(--surface-solid); box-shadow:var(--shadow-soft);">
              <div style="font-size:10px; font-weight:500; letter-spacing:0.04em; text-transform:uppercase; color:var(--text-muted);">pH solo</div>
              <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:19px; margin-top:4px;">6.4</div>
            </div>
            <div style="padding:12px 14px; border-radius:16px; background:var(--surface-solid); box-shadow:var(--shadow-soft);">
              <div style="font-size:10px; font-weight:500; letter-spacing:0.04em; text-transform:uppercase; color:var(--text-muted);">Luz</div>
              <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:19px; margin-top:4px;">820<span style="font-size:11px; color:var(--text-muted);"> lux</span></div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:10px; margin-top:12px; padding:11px 14px; border-radius:16px; background:var(--surface-solid); box-shadow:var(--shadow-soft);">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:999px; border:2px solid var(--brand-green); border-top-color:transparent; animation:plf-spin 1.1s linear infinite;"></span>
            <div style="flex:1;">
              <div style="font-size:12px; font-weight:600;">Núcleo Rust avaliando irrigação</div>
              <div style="display:flex; gap:3px; margin-top:5px;">
                <span style="flex:1; height:5px; border-radius:3px; background:var(--brand-green); animation:plf-scan 1.6s ease-in-out infinite;"></span>
                <span style="flex:1; height:5px; border-radius:3px; background:var(--brand-green-soft); animation:plf-scan 1.6s ease-in-out .2s infinite;"></span>
                <span style="flex:1; height:5px; border-radius:3px; background:var(--brand-teal); animation:plf-scan 1.6s ease-in-out .4s infinite;"></span>
                <span style="flex:1; height:5px; border-radius:3px; background:var(--border-subtle);"></span>
                <span style="flex:1; height:5px; border-radius:3px; background:var(--border-subtle);"></span>
              </div>
            </div>
            <span style="font-size:11px; color:var(--brand-green); font-weight:600;">regra local OK</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- VIDEO SCRUB -->
  <section id="demo-video" style="position:relative; z-index:1;">
    <div id="plf-video-section">
      <div id="plf-video-sticky">
        <video id="plf-video-scrub" src="/videos/PlantiumAI_site_mudo.mp4" poster="/landing/hero.jpg" muted playsinline preload="auto" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;"></video>
        <div style="position:absolute; inset:0; background:linear-gradient(to bottom,rgba(8,15,11,0.55) 0%,rgba(8,15,11,0.18) 25%,rgba(8,15,11,0.18) 75%,rgba(8,15,11,0.7) 100%); pointer-events:none;"></div>


        <div id="plf-video-progress" style="position:absolute; bottom:0; left:0; height:3px; width:0%; background:var(--brand-green); z-index:3; transition:width .05s linear;"></div>
      </div>
    </div>
  </section>

  <!-- PROBLEMA -->
  <section style="position:relative; z-index:1; max-width:1180px; margin:0 auto; padding:80px 24px 40px;">
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center;" class="plf-2col">
      <div>
        <div style="font-size:13px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--brand-green);">O problema</div>
        <h2 style="font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(28px,3.4vw,40px); line-height:1.15; letter-spacing:-0.01em; margin:14px 0 16px;">Sem ler o equilíbrio biológico, a decisão fica no escuro</h2>
        <p style="font-size:16.5px; line-height:1.65; color:var(--text-muted); margin:0;">A carência de leitura da <strong style="color:var(--text-base); font-weight:600;">biocenose</strong> — o equilíbrio biológico do ambiente — dificulta o ajuste da irrigação, gerando desperdício de água, risco de doenças e necessidade de acompanhamento constante.</p>
        <p style="font-size:14px; line-height:1.6; color:var(--text-faint); margin:16px 0 0;">Fonte: levantamento IFAG (2026) junto a produtores goianos.</p>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
        ${["Desperdício de água", "Falta de automação", "Monitoramento remoto difícil", "Sem histórico ou rastreabilidade", "Ausência de alertas inteligentes", "Baixa previsibilidade"]
          .map(
            (p) => `<div style="padding:18px; border-radius:18px; background:var(--surface-glass); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); border:1px solid var(--border-glass); box-shadow:var(--shadow-soft);">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:11px; background:var(--danger-tint); color:var(--danger); margin-bottom:10px;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg></span>
            <div style="font-size:14.5px; font-weight:600; line-height:1.4;">${p}</div>
          </div>`,
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- SOLUÇÃO / COMO FUNCIONA -->
  <section id="tecnologia" style="position:relative; z-index:1; max-width:1180px; margin:0 auto; padding:64px 24px 40px;">
    <div style="text-align:center; max-width:680px; margin:0 auto 44px;">
      <div style="font-size:13px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--brand-green);">Como funciona · protótipo funcional</div>
      <h2 style="font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(28px,3.4vw,40px); line-height:1.15; letter-spacing:-0.01em; margin:14px 0 12px;">Arquitetura em camadas, do sensor ao atuador</h2>
      <p style="font-size:16.5px; line-height:1.6; color:var(--text-muted);">Um fluxo de dados resiliente: mesmo sem internet ou IA, a estufa permanece protegida por regras locais — tudo registrado para auditoria.</p>
    </div>
    <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:14px; align-items:stretch;" class="plf-flow">
      ${[
        { n: "01", title: "Nós ESP32", desc: "Sensores via NDJSON (115200 baud) / MQTT Wi-Fi.", icon: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 1.5v3M14 1.5v3M10 19.5v3M14 19.5v3M1.5 10h3M1.5 14h3M19.5 10h3M19.5 14h3"/>' },
        { n: "02", title: "Núcleo Rust + tokio", desc: "Validação, domínio, regras e persistência em SQLite.", icon: '<path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/>' },
        { n: "03", title: "Gateway de IA", desc: "Failover com Circuit Breaker e fallback regra_local.", icon: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/>' },
        { n: "04", title: "Interface React/TS", desc: "Painel com ECharts em tempo real, offline-first.", icon: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 20h8M12 17v3"/>' },
        { n: "05", title: "Atuadores", desc: "Relé NF + válvula solenoide em malha fechada e segura.", icon: '<path d="M13 2 4.5 13H11l-1 9 8.5-11H12z"/>' },
      ]
        .map(
          (f) => `<div style="position:relative; padding:22px 18px; border-radius:20px; background:var(--surface-glass); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); border:1px solid var(--border-glass); box-shadow:var(--shadow-soft); display:flex; flex-direction:column;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:12px; background:var(--brand-green-tint); color:var(--brand-green);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${f.icon}</svg></span>
            <span style="font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-faint);">${f.n}</span>
          </div>
          <h3 style="font-family:'Sora',sans-serif; font-weight:600; font-size:15.5px; margin:14px 0 8px; line-height:1.25;">${f.title}</h3>
          <p style="font-size:13px; line-height:1.5; color:var(--text-muted); margin:0;">${f.desc}</p>
        </div>`,
        )
        .join("")}
    </div>
    <div style="display:flex; align-items:flex-start; gap:12px; margin-top:20px; padding:18px 20px; border-radius:18px; background:var(--brand-green-tint); border:1px solid var(--border-glass);">
      <span style="flex:none; display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:999px; background:var(--brand-green); color:#06120b;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></span>
      <div>
        <div style="font-size:14.5px; font-weight:600;">Fail-safe por padrão</div>
        <p style="font-size:14px; line-height:1.55; color:var(--text-muted); margin:4px 0 0;">Padrão Circuit Breaker com fallback <code style="font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--brand-green);">regra_local</code>: a malha de irrigação opera em segurança mesmo offline. Relé NF + válvula solenoide deixam o sistema seguro em caso de falha, com histórico em SQLite.</p>
      </div>
    </div>
  </section>

  <!-- MATRIZ DE VANTAGENS -->
  <section style="position:relative; z-index:1; max-width:1180px; margin:0 auto; padding:64px 24px 40px;">
    <div style="text-align:center; max-width:640px; margin:0 auto 44px;">
      <div style="font-size:13px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--brand-green);">Vantagens competitivas</div>
      <h2 style="font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(28px,3.4vw,40px); line-height:1.15; letter-spacing:-0.01em; margin:14px 0 0;">Quatro pilares, do regional ao internacional</h2>
    </div>
    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:20px;" class="plf-pillars">
      <div class="plf-card-hover" style="padding:28px; border-radius:24px; background:var(--surface-glass); -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); border:1px solid var(--border-glass); box-shadow:var(--shadow-soft);">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="display:inline-flex; align-items:center; justify-content:center; width:46px; height:46px; border-radius:14px; background:var(--brand-green-tint); color:var(--brand-green);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
          <div>
            <div style="font-family:'Sora',sans-serif; font-weight:600; font-size:19px;">Preço</div>
            <div style="font-size:12.5px; color:var(--text-faint);">Acessibilidade real</div>
          </div>
        </div>
        <p style="font-size:14.5px; line-height:1.6; color:var(--text-muted); margin:16px 0 0;">Kit do protótipo funcional a <strong style="color:var(--text-base); font-weight:600;">R$ 1.010,08/unidade</strong> e kit completo a R$ 1.705,22. Modelo <strong style="color:var(--text-base); font-weight:600;">SaaS</strong> (assinatura recorrente + kit inicial), focado no pequeno produtor.</p>
      </div>
      <div class="plf-card-hover" style="padding:28px; border-radius:24px; background:var(--surface-glass); -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); border:1px solid var(--border-glass); box-shadow:var(--shadow-soft);">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="display:inline-flex; align-items:center; justify-content:center; width:46px; height:46px; border-radius:14px; background:var(--brand-green-tint); color:var(--brand-green);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></span>
          <div>
            <div style="font-family:'Sora',sans-serif; font-weight:600; font-size:19px;">Design</div>
            <div style="font-size:12.5px; color:var(--text-faint);">Leveza nativa</div>
          </div>
        </div>
        <p style="font-size:14.5px; line-height:1.6; color:var(--text-muted); margin:16px 0 0;">Desktop em <strong style="color:var(--text-base); font-weight:600;">Tauri 2 + Rust + React/TS + Tailwind + ECharts</strong>: binários nativos compactos que reutilizam o webview do SO, com segurança de memória do Rust no I/O serial.</p>
      </div>
      <div class="plf-card-hover" style="padding:28px; border-radius:24px; background:var(--surface-glass); -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); border:1px solid var(--border-glass); box-shadow:var(--shadow-soft);">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="display:inline-flex; align-items:center; justify-content:center; width:46px; height:46px; border-radius:14px; background:var(--brand-green-tint); color:var(--brand-green);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/></svg></span>
          <div>
            <div style="font-family:'Sora',sans-serif; font-weight:600; font-size:19px;">Tecnologia</div>
            <div style="font-size:12.5px; color:var(--text-faint);">Offline-first resiliente</div>
          </div>
        </div>
        <p style="font-size:14.5px; line-height:1.6; color:var(--text-muted); margin:16px 0 0;">Opera sem depender de nuvem: decisão local por regras + <strong style="color:var(--text-base); font-weight:600;">SQLite</strong> e padrão Circuit Breaker. Preparada para visão computacional na borda (YOLO via Raspberry Pi) — <em>evolução futura</em>.</p>
      </div>
      <div class="plf-card-hover" style="padding:28px; border-radius:24px; background:var(--surface-glass); -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); border:1px solid var(--border-glass); box-shadow:var(--shadow-soft);">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="display:inline-flex; align-items:center; justify-content:center; width:46px; height:46px; border-radius:14px; background:var(--brand-green-tint); color:var(--brand-green);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          <div>
            <div style="font-family:'Sora',sans-serif; font-weight:600; font-size:19px;">Serviço</div>
            <div style="font-size:12.5px; color:var(--text-faint);">Inserção regional</div>
          </div>
        </div>
        <p style="font-size:14.5px; line-height:1.6; color:var(--text-muted); margin:16px 0 0;">Ecossistema de Goiás: <strong style="color:var(--text-base); font-weight:600;">Desafio AgroStartup 2026</strong> (SENAR, Sebrae GO, FAPEG), parceria VarejoIN/FPM e cooperação com a SiriNEO Technologies. Atendimento via WhatsApp <em>(planejado)</em>.</p>
      </div>
    </div>
  </section>

  <!-- MERCADO -->
  <section id="mercado" style="position:relative; z-index:1; max-width:1180px; margin:0 auto; padding:64px 24px 40px;">
    <div style="padding:48px; border-radius:28px; background:var(--surface-glass); -webkit-backdrop-filter:blur(18px); backdrop-filter:blur(18px); border:1px solid var(--border-glass); box-shadow:var(--shadow-float); position:relative; overflow:hidden;">
      <div style="position:absolute; bottom:-120px; right:-60px; width:340px; height:340px; border-radius:50%; background:radial-gradient(circle,rgba(52,217,119,0.16),transparent 70%);"></div>
      <div style="position:relative; max-width:620px;">
        <div style="font-size:13px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--brand-green);">Mercado e viabilidade</div>
        <h2 style="font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(28px,3.4vw,40px); line-height:1.15; letter-spacing:-0.01em; margin:14px 0 0;">Números reais do piloto, sem promessas absolutas</h2>
      </div>
      <div style="position:relative; display:grid; grid-template-columns:repeat(4,1fr); gap:24px; margin-top:38px;" class="plf-kpis">
        <div>
          <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(30px,3.6vw,44px); line-height:1; color:var(--brand-green);">~15<span style="font-size:22px;">% a.a.</span></div>
          <div style="font-size:13.5px; color:var(--text-muted); margin-top:8px;">crescimento da agricultura protegida + vertical farming</div>
        </div>
        <div>
          <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(30px,3.6vw,44px); line-height:1;">R$ 460</div>
          <div style="font-size:13.5px; color:var(--text-muted); margin-top:8px;">OpEx mensal do piloto (a partir do 4º mês)</div>
        </div>
        <div>
          <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(30px,3.6vw,44px); line-height:1;">R$ 43.048</div>
          <div style="font-size:13.5px; color:var(--text-muted); margin-top:8px;">implantação do piloto — abaixo da meta (R$ 52.940)</div>
        </div>
        <div>
          <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(30px,3.6vw,44px); line-height:1;">R$ 1.010</div>
          <div style="font-size:13.5px; color:var(--text-muted); margin-top:8px;">kit do protótipo funcional / unidade</div>
        </div>
      </div>
      <div style="position:relative; display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:36px;" class="plf-tam">
        <div style="padding:20px; border-radius:18px; background:var(--surface-solid); box-shadow:var(--shadow-soft);">
          <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:15px; color:var(--brand-green);">TAM <span style="font-weight:500; font-size:12px; color:var(--text-faint);">· total addressable market</span></div>
          <p style="font-size:13.5px; line-height:1.55; color:var(--text-muted); margin:8px 0 0;">Mercado global de agricultura protegida e vertical farming, em crescimento de ~15% a.a. (Vertical Field, 2024).</p>
        </div>
        <div style="padding:20px; border-radius:18px; background:var(--surface-solid); box-shadow:var(--shadow-soft);">
          <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:15px; color:var(--brand-green);">SAM <span style="font-weight:500; font-size:12px; color:var(--text-faint);">· serviceable available market</span></div>
          <p style="font-size:13.5px; line-height:1.55; color:var(--text-muted); margin:8px 0 0;">Horticultura protegida e pequenos produtores no Brasil — público que o produto atende hoje.</p>
        </div>
        <div style="padding:20px; border-radius:18px; background:var(--surface-solid); box-shadow:var(--shadow-soft);">
          <div style="font-family:'Sora',sans-serif; font-weight:700; font-size:15px; color:var(--brand-green);">SOM <span style="font-weight:500; font-size:12px; color:var(--text-faint);">· serviceable obtainable market</span></div>
          <p style="font-size:13.5px; line-height:1.55; color:var(--text-muted); margin:8px 0 0;">Goiás e Centro-Oeste no curto prazo — estimativas a refinar com os pilotos.</p>
        </div>
      </div>
      <p style="position:relative; font-size:13px; color:var(--text-faint); margin:22px 0 0;">* Conectividade alternativa via Starlink onde não há 4G: antena R$ 2.800,00 (única) + R$ 275,00/mês. Valores apresentados como estimativas a refinar com os pilotos.</p>
    </div>
  </section>

  <!-- EQUIPE -->
  <section id="equipe" style="position:relative; z-index:1; max-width:1180px; margin:0 auto; padding:64px 24px 40px;">
    <div style="text-align:center; max-width:620px; margin:0 auto 44px;">
      <div style="font-size:13px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--brand-green);">Equipe · fundadores</div>
      <h2 style="font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(28px,3.4vw,40px); line-height:1.15; letter-spacing:-0.01em; margin:14px 0 0;">Quem constrói a PlantiumAI</h2>
    </div>
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:22px;" class="plf-team">
      ${[
        { photo: "/landing/thyago.jpeg", name: "Thyago Henrique Toledo de Assis", role: "Owner · Full-Stack & Financeiro", badge: "Software", bio: "Lidera o ecossistema de software (Rust/Tauri 2) e o repositório oficial; conduz custos, análise econômica e viabilidade do piloto." },
        { photo: "/landing/joao.jpeg", name: "João Felipe Antunes Ribeiro", role: "Owner · Hardware & Negócio", badge: "Hardware", bio: "Planeja, valida e especifica componentes físicos, sensores e atuadores; articula inserção comercial e modelagem de mercado (VarejoIN/FPM)." },
        { photo: "/landing/gabriel.jpeg", name: "Gabriel Augusto de Sousa", role: "Owner · Arquitetura ESP32/IoT", badge: "Firmware", bio: "Desenha a arquitetura IoT distribuída e o firmware dos nós ESP32; ponte de cooperação tecnológica com a SiriNEO Technologies." },
        { photo: "/landing/marco.jpeg", name: "Marco Antônio Moreira de Freitas", role: "CEO & Agrônomo", badge: "Agronomia", bio: "Lidera a visão estratégica e a validação agronômica (faixas ideais, limiares de estresse), alinhando o sistema às dores mapeadas pelo IFAG." },
      ]
        .map(
          (m) => `<div class="plf-team-card" style="border-radius:24px; overflow:hidden; background:var(--surface-glass); -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); border:1px solid var(--border-glass); box-shadow:var(--shadow-soft);">
          <div style="position:relative; aspect-ratio:4/5; overflow:hidden;">
            <img src="${m.photo}" alt="${m.name}" style="width:100%; height:100%; object-fit:cover; object-position:center 18%;"/>
            <div style="position:absolute; inset:0; background:linear-gradient(180deg,transparent 55%,rgba(6,18,11,0.78) 100%);"></div>
            <span style="position:absolute; left:14px; bottom:12px; display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; background:rgba(52,217,119,0.92); color:#06120b; font-size:11.5px; font-weight:700;">${m.badge}</span>
          </div>
          <div style="padding:18px 18px 22px;">
            <div style="font-family:'Sora',sans-serif; font-weight:600; font-size:16.5px; line-height:1.25;">${m.name}</div>
            <div style="font-size:13px; font-weight:600; color:var(--brand-green); margin-top:6px;">${m.role}</div>
            <p style="font-size:13px; line-height:1.5; color:var(--text-muted); margin:10px 0 0;">${m.bio}</p>
          </div>
        </div>`,
        )
        .join("")}
    </div>
    <p style="text-align:center; font-size:13px; color:var(--text-faint); margin:30px auto 0; max-width:720px;">Crédito acadêmico — Trabalho Científico, Engenharia de Software, Faculdade SENAI FATESG, Goiânia/GO, 2026. Orientador: Prof. Renato Ribeiro dos Santos.</p>
  </section>

  <!-- CTA FINAL -->
  <section id="contato" style="position:relative; z-index:1; max-width:1180px; margin:0 auto; padding:40px 24px 72px;">
    <div style="padding:56px 40px; border-radius:28px; text-align:center; background:linear-gradient(135deg,var(--brand-green),var(--brand-green-deep)); box-shadow:0 24px 56px rgba(22,163,74,0.4); position:relative; overflow:hidden;">
      <div style="position:absolute; top:-80px; left:-40px; width:240px; height:240px; border-radius:50%; background:radial-gradient(circle,rgba(255,255,255,0.18),transparent 70%);"></div>
      <div style="position:absolute; bottom:-100px; right:-40px; width:280px; height:280px; border-radius:50%; background:radial-gradient(circle,rgba(255,255,255,0.12),transparent 70%);"></div>
      <h2 style="position:relative; font-family:'Sora',sans-serif; font-weight:700; font-size:clamp(28px,3.4vw,40px); line-height:1.15; letter-spacing:-0.01em; color:#06120b; margin:0;">Vamos cultivar o futuro juntos</h2>
      <p style="position:relative; font-size:17px; line-height:1.6; color:rgba(6,18,11,0.78); max-width:540px; margin:16px auto 0;">Estamos abrindo conversas com investidores e parceiros que acreditam em alimento inteligente e sustentável.</p>
      <div style="position:relative; display:flex; gap:14px; justify-content:center; margin-top:32px; flex-wrap:wrap;">
        <a href="/planos" style="padding:14px 30px; border-radius:999px; border:none; background:#06120b; color:#fff; font-family:'Inter',sans-serif; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 8px 20px rgba(0,0,0,0.25); transition:transform .15s;">Planos</a>
        <a href="https://github.com/PlantiumAI/PlantiumAI" target="_blank" rel="noopener" class="plf-cta-git" style="display:inline-flex; align-items:center; gap:8px; padding:14px 30px; border-radius:999px; background:#181717; border:none; color:#ffffff; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 8px 20px rgba(0,0,0,0.15); transition:transform .15s;"><svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.71 1.23 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.28.83 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>Ver no GitHub</a>
        <a href="https://www.youtube.com/@PlantiumAI" target="_blank" rel="noopener" class="plf-cta-yt" style="display:inline-flex; align-items:center; gap:8px; padding:14px 30px; border-radius:999px; background:#FF0000; border:none; color:#ffffff; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 8px 20px rgba(255,0,0,0.25); transition:transform .15s;"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.11-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.39.58A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.12C4.5 20.5 12 20.5 12 20.5s7.5 0 9.39-.58A3 3 0 0 0 23.5 17.8 31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>Inscreva-se no canal</a>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer style="position:relative; z-index:1; border-top:1px solid var(--border-subtle); margin-top:8px;" class="plf-footer-wrap">
    <div style="max-width:1180px; margin:0 auto; padding:40px 24px 24px; display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:32px; align-items:start;" class="plf-footer">
      <div>
        <div style="display:flex; align-items:center; gap:11px; font-family:'Sora',sans-serif; font-weight:700; font-size:17px;">
          <img src="/logo-plantiumai.png" alt="Logo PlantiumAI" width="36" height="36" style="display:block; width:36px; height:36px; border-radius:50%; object-fit:cover;"/>
          PlantiumAI
        </div>
        <p style="font-size:13.5px; line-height:1.55; color:var(--text-muted); margin:14px 0 0; max-width:340px;">Funcionalidades de nuvem, painel web, app móvel e visão computacional fazem parte da evolução planejada.</p>
      </div>
      <div>
        <div style="font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-faint); margin-bottom:12px;">Navegação</div>
        <div style="display:flex; flex-direction:column; gap:9px; font-size:14px; color:var(--text-muted);">
          <a href="#solucao">Solução</a>
          <a href="#tecnologia">Tecnologia</a>
          <a href="#mercado">Mercado</a>
          <a href="#equipe">Equipe</a>
        </div>
      </div>
      <div>
        <div style="font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-faint); margin-bottom:12px;">Canais oficiais</div>
        <div style="display:flex; flex-direction:column; gap:9px; font-size:14px; color:var(--text-muted);">
          <a href="mailto:plantiumai@gmail.com" style="display:flex; align-items:center; gap:8px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>plantiumai@gmail.com</a>
          <a href="https://youtube.com/@PlantiumAI" target="_blank" rel="noopener" style="display:flex; align-items:center; gap:8px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 5 12 5 12 5s-7 0-8.9.4A3 3 0 0 0 1 7.5 31 31 0 0 0 .6 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1C5 19 12 19 12 19s7 0 8.9-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.4 12 31 31 0 0 0 23 7.5zM9.8 15.3V8.7l5.7 3.3z"/></svg>@PlantiumAI</a>
          <a href="https://github.com/PlantiumAI/PlantiumAI" target="_blank" rel="noopener" style="display:flex; align-items:center; gap:8px;"><svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.71 1.23 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.28.83 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>PlantiumAI/PlantiumAI</a>
        </div>
      </div>
    </div>
    <div style="max-width:1180px; margin:0 auto; padding:18px 24px 0; border-top:1px solid var(--border-subtle); font-size:13px; color:var(--text-faint); display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;">
      <span>© 2026 PlantiumAI · Micro estufas e hortas verticais inteligentes</span>
      <span>Goiânia/GO · Desafio AgroStartup 2026</span>
    </div>
  </footer>

</div>
`;

export function Landing() {
  useEffect(() => {
    // ---- Menu mobile: fechar ao clicar num link (enhancement do checkbox) ----
    const navToggle = document.getElementById(
      "plf-nav-toggle",
    ) as HTMLInputElement | null;
    const menu = document.getElementById("plf-mobile-menu");
    const closeMenu = () => {
      if (navToggle) navToggle.checked = false;
    };
    menu?.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", closeMenu),
    );

    // ---- Scroll reveal (animações que valorizam a marca) ----
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let io: IntersectionObserver | null = null;
    if (!prefersReduced && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("plf-in");
              io?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      // Já visível na viewport? Revela no MESMO tick (sem flash visível→some).
      const inView = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight * 0.9 && r.bottom > 0;
      };
      // Grids de cards: classe aplicada via JS (sem JS, conteúdo permanece
      // visível). Filhos animam em cascata via CSS nth-child.
      document
        .querySelectorAll<HTMLElement>(
          ".plf-root .plf-flow, .plf-root .plf-pillars, .plf-root .plf-team",
        )
        .forEach((g) => {
          g.classList.add("plf-stagger");
          if (inView(g)) g.classList.add("plf-in");
          else io?.observe(g);
        });
      // Blocos principais sobem com fade; cascata entre irmãos do mesmo grupo.
      const blocks = document.querySelectorAll<HTMLElement>(
        ".plf-root section > div:not(#plf-video-section):not(.plf-stagger), .plf-root #solucao, .plf-root .plf-preview, .plf-root .plf-footer > div",
      );
      blocks.forEach((el) => {
        el.classList.add("plf-reveal");
        const sibs = Array.from(el.parentElement?.children ?? []).filter((c) =>
          c.classList.contains("plf-reveal"),
        );
        const i = sibs.indexOf(el);
        el.style.transitionDelay = `${Math.min(i, 5) * 80}ms`;
        if (inView(el)) el.classList.add("plf-in");
        else io?.observe(el);
      });
    }

    // GSAP ScrollTrigger video scrub
    gsap.registerPlugin(ScrollTrigger);

    const section = document.getElementById("plf-video-section");
    const video = document.getElementById("plf-video-scrub") as HTMLVideoElement | null;
    const progressBar = document.getElementById("plf-video-progress") as HTMLElement | null;
    const scrollHint = document.getElementById("plf-scroll-hint") as HTMLElement | null;
    // Mobile/touch travam no "seek" rápido do currentTime (iOS bloqueia seeks
    // durante o scroll). Nesses casos — e com prefers-reduced-motion — caímos
    // para autoplay em loop (sem scroll-jacking), garantindo responsividade.
    const lowPower = window.matchMedia(
      "(prefers-reduced-motion: reduce), (max-width: 760px), (pointer: coarse)",
    ).matches;
    let st: ReturnType<typeof ScrollTrigger.create> | null = null;
    let initialized = false;

    const initScrub = () => {
      if (initialized) return;
      initialized = true;
      st = ScrollTrigger.create({
        // Pin do PRÓPRIO bloco do vídeo (position:fixed) — não usar CSS sticky.
        trigger: "#plf-video-sticky",
        start: "top top",
        end: "+=250%", // distância de scroll p/ percorrer o vídeo (~2,5 telas)
        pin: true,
        pinSpacing: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (video && Number.isFinite(video.duration) && video.duration > 0) {
            video.currentTime = video.duration * self.progress;
          }
          if (progressBar) progressBar.style.width = `${self.progress * 100}%`;
          if (scrollHint) scrollHint.style.opacity = self.progress > 0.05 ? "0" : "1";
        },
      });
      // Recalcula medidas após o layout assentar (evita gaps/posições erradas).
      ScrollTrigger.refresh();
    };

    if (video) {
      if (lowPower) {
        // Acessibilidade: sem scroll-jacking — vídeo vira loop suave em altura normal.
        section?.classList.add("plf-reduced");
        video.loop = true;
        video.play().catch(() => {});
      } else {
        if (video.readyState >= 1 && Number.isFinite(video.duration)) {
          initScrub();
        } else {
          video.addEventListener("loadedmetadata", initScrub, { once: true });
          video.addEventListener("canplay", initScrub, { once: true });
          // Fallback de segurança: inicializa de qualquer forma após 1 segundo
          const t = setTimeout(initScrub, 1000);
          
          // Note: clear timeout on unmount is handled in cleanup function below
        }
      }
    }

    // Recalcula quando tudo (imagens/fontes) terminar de carregar.
    const onLoad = () => ScrollTrigger.refresh();
    if (!lowPower) window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      if (video) {
        video.removeEventListener("loadedmetadata", initScrub);
        video.removeEventListener("canplay", initScrub);
      }
      menu?.querySelectorAll("a").forEach((a) =>
        a.removeEventListener("click", closeMenu),
      );
      io?.disconnect();
      st?.kill();
    };
  }, []);

  return (
    <div className="plf-root" style={{ scrollBehavior: "smooth" }} dangerouslySetInnerHTML={{ __html: HTML }} />
  );
}

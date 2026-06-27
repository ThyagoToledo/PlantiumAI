"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowLeft, HelpCircle } from "lucide-react";
import "../landing.css";

interface PricingCardProps {
  title: string;
  tag: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  billingPeriod: "mensal" | "anual";
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  buttonLink: string;
  badgeText?: string;
}

function PricingCard({
  title,
  tag,
  description,
  monthlyPrice,
  annualPrice,
  billingPeriod,
  features,
  isPopular = false,
  buttonText,
  buttonLink,
  badgeText,
}: PricingCardProps) {
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s ease, box-shadow 0.3s ease",
  });

  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
    background: "radial-gradient(circle at 50% 50%, rgba(52, 217, 119, 0.15) 0%, transparent 60%)",
    transition: "opacity 0.5s ease",
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xc = rect.width / 2;
    const yc = rect.height / 2;

    // Calculo do angulo baseado na inclinacao em relacao ao centro
    const rotateX = -(y - yc) / (rect.height / 20); // Limita inclinacao em X
    const rotateY = (x - xc) / (rect.width / 20);  // Limita inclinacao em Y

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s ease, box-shadow 0.3s ease",
    });

    setGlareStyle({
      opacity: 1,
      background: `radial-gradient(circle at ${x}px ${y}px, rgba(52, 217, 119, 0.15) 0%, transparent 50%)`,
      transition: "opacity 0.15s ease",
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s ease, box-shadow 0.3s ease",
    });
    setGlareStyle((prev) => ({
      ...prev,
      opacity: 0,
      transition: "opacity 0.5s ease",
    }));
  };

  const price = billingPeriod === "mensal" ? monthlyPrice : annualPrice;
  const totalYear = annualPrice * 12;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={`relative rounded-3xl p-8 flex flex-col justify-between backdrop-blur-md shadow-2xl transition-all duration-300 border ${
        isPopular
          ? "bg-[#14291e]/50 border-[#34d977] shadow-[0_0_40px_rgba(52,217,119,0.15)]"
          : "bg-[#12211a]/30 border-[#78c896]/10 hover:border-[#34d977]/30 shadow-black/40"
      }`}
    >
      {/* Reflexo de Brilho encapsulado com overflow-hidden para nao cortar o badge externo */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-3xl">
        <div className="absolute inset-0" style={glareStyle} />
      </div>

      {/* Destaque adicional para plano popular (Renderizado por fora do clipping) */}
      {isPopular && badgeText && (
        <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-emerald-400/20 z-20">
          {badgeText}
        </div>
      )}

      <div className="relative z-10">
        <div className="mb-6">
          <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isPopular ? "text-emerald-400" : "text-[#6c8478]"}`}>
            {tag}
          </span>
          <h3 className="font-display font-extrabold text-2xl sm:text-3xl mt-1 text-[#eaf3ee]">
            {title}
          </h3>
        </div>

        <p className="text-sm text-[#9fb4a8] mb-8 font-normal leading-relaxed min-h-[48px]">
          {description}
        </p>

        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-[#9fb4a8] text-xl font-medium">R$</span>
            <span className="text-5xl font-extrabold tracking-tight text-[#eaf3ee] transition-all duration-300">
              {price}
            </span>
            <span className="text-[#9fb4a8] text-sm">/mês</span>
          </div>
          <span className="text-xs text-[#6c8478] block mt-2 font-mono">
            {billingPeriod === "anual"
              ? `Faturamento anual de R$ ${totalYear}`
              : "Faturamento mensal recorrente"
            }
          </span>
        </div>

        <ul className="space-y-4 mb-8">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <div className={`p-0.5 rounded-full shrink-0 mt-0.5 ${isPopular ? "bg-emerald-500/10 text-emerald-400" : "bg-[#14291e]/50 text-emerald-400"}`}>
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-[#d8e6df]">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={buttonLink}
        className={`relative z-10 block w-full text-center py-4 px-6 rounded-2xl text-sm font-bold transition-all duration-300 ${
          isPopular
            ? "bg-gradient-to-r from-[#34d977] to-teal-500 text-slate-950 hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.01]"
            : "border border-emerald-500/20 text-[#eaf3ee] hover:bg-emerald-500/5 hover:border-emerald-500/40"
        }`}
      >
        {buttonText}
      </Link>
    </div>
  );
}

function GreenhouseBackground() {
  const [particles, setParticles] = useState<{ left: number; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const list = [...Array(25)].map(() => ({
      left: Math.random() * 100,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 18,
      duration: Math.random() * 15 + 12,
    }));
    setParticles(list);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Video de Fundo da Estufa - Zoom reduzido com scale-95 e opacidade reduzida para 15% para ficar sutil e transparente */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-[0.28] scale-[0.95] transition-all duration-700"
      >
        <source src="/EstufaEditSite.mp4" type="video/mp4" />
      </video>

      {/* Grade de fundo simulando paineis de vidro */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* Gradiente luminoso e escuro ambiental para manter legibilidade do texto */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070d0a] via-[#070d0a]/75 to-[#070d0a]" />

      {/* Particulas flutuantes de clorofila/sensorica */}
      <div className="absolute inset-0">
        {particles.map((p, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              // @ts-ignore
              "--delay": `${p.delay}s`,
              "--duration": `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0% {
            transform: translateY(105vh) translateX(0) scale(0.8) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-5vh) translateX(45px) scale(0.4) rotate(360deg);
            opacity: 0;
          }
        }
        .particle {
          position: absolute;
          bottom: -20px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(52, 217, 119, 0.35) 0%, rgba(16, 185, 129, 0) 70%);
          animation: float var(--duration) linear infinite;
          animation-delay: var(--delay);
          pointer-events: none;
        }
      ` }} />
    </div>
  );
}

export default function PlanosPage() {
  const [billingPeriod, setBillingPeriod] = useState<"mensal" | "anual">("anual");

  return (
    <div className="min-h-screen bg-[#070d0a] text-[#eaf3ee] transition-colors duration-300 relative overflow-x-hidden font-sans selection:bg-[#34d977] selection:text-[#06120b] plf-root">
      {/* Greenhouse Animated Background */}
      <GreenhouseBackground />

      {/* Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-180px] right-[-120px] w-[560px] h-[560px] rounded-full bg-radial-gradient from-emerald-500/8 to-transparent filter blur-[40px] opacity-60"></div>
        <div className="absolute bottom-[-220px] left-[-160px] w-[600px] h-[600px] rounded-full bg-radial-gradient from-teal-500/8 to-transparent filter blur-[40px] opacity-60"></div>
      </div>

      {/* Header */}
      <header className="fixed top-[18px] left-0 right-0 z-40 max-w-[1180px] mx-auto px-6">
        <nav className="relative flex items-center justify-between gap-4 px-6 py-3 rounded-full bg-[#14261c]/55 border border-[#78c896]/14 backdrop-blur-xl shadow-lg">
          <Link href="/#topo" className="flex items-center gap-3 font-semibold text-lg tracking-tight font-display text-[#eaf3ee] hover:opacity-90 transition">
            <img
              src="/logo-plantiumai.png"
              alt="Logo PlantiumAI"
              width={38}
              height={38}
              className="block rounded-full object-cover shadow shadow-black/40"
            />
            <span className="plf-nav-title">PlantiumAI</span>
          </Link>

          {/* Toggle do menu mobile: CSS puro (checkbox hack), funciona sem JS */}
          <input type="checkbox" id="plf-nav-toggle" className="plf-nav-toggle" aria-hidden tabIndex={-1} />

          {/* Navegacao Centralizada (Abas) */}
          <div className="flex-1 flex justify-center gap-1 plf-tabs">
            <Link href="/#solucao" className="px-3 py-2 rounded-full text-xs font-semibold text-[#9fb4a8] hover:text-[#eaf3ee] hover:bg-[#16281e]/60 transition-colors">Solução</Link>
            <Link href="/#demo-video" className="px-3 py-2 rounded-full text-xs font-semibold text-[#9fb4a8] hover:text-[#eaf3ee] hover:bg-[#16281e]/60 transition-colors">PlantiumAI</Link>
            <Link href="/#tecnologia" className="px-3 py-2 rounded-full text-xs font-semibold text-[#9fb4a8] hover:text-[#eaf3ee] hover:bg-[#16281e]/60 transition-colors">Tecnologia</Link>
            <Link href="/#mercado" className="px-3 py-2 rounded-full text-xs font-semibold text-[#9fb4a8] hover:text-[#eaf3ee] hover:bg-[#16281e]/60 transition-colors">Mercado</Link>
            <Link href="/#equipe" className="px-3 py-2 rounded-full text-xs font-semibold text-[#9fb4a8] hover:text-[#eaf3ee] hover:bg-[#16281e]/60 transition-colors">Equipe</Link>
            <Link href="/#parceiros" className="px-3 py-2 rounded-full text-xs font-semibold text-[#9fb4a8] hover:text-[#eaf3ee] hover:bg-[#16281e]/60 transition-colors">Parceiros</Link>
            <Link href="/#contato" className="px-3 py-2 rounded-full text-xs font-semibold text-[#9fb4a8] hover:text-[#eaf3ee] hover:bg-[#16281e]/60 transition-colors">Contato</Link>
            <Link href="/planos" className="px-3 py-2 rounded-full text-xs font-semibold text-[#eaf3ee] bg-[#16281e]/80 border border-emerald-500/10 transition-colors">Planos</Link>
            <Link href="/documentos" className="px-3 py-2 rounded-full text-xs font-semibold text-[#9fb4a8] hover:text-[#eaf3ee] hover:bg-[#16281e]/60 transition-colors">Documentos</Link>
          </div>

          <div className="plf-nav-right flex items-center gap-4">
            <Link
              href="/#topo"
              className="plf-desktop-only flex items-center gap-1.5 text-xs font-semibold text-[#9fb4a8] hover:text-emerald-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Início
            </Link>
            <Link
              href="/login"
              className="plf-login-btn px-4 py-2 rounded-full bg-[#22c55e] text-[#06120b] text-xs font-bold hover:bg-[#16a34a] transition-all shadow-[0_4px_14px_rgba(52,217,119,0.3)] hover:scale-[1.02]"
            >
              Login
            </Link>
            <label htmlFor="plf-nav-toggle" className="plf-hamburger" role="button" aria-label="Abrir menu" tabIndex={0}>
              <svg className="plf-burger-open" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              <svg className="plf-burger-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </label>
          </div>

          {/* Backdrop p/ fechar tocando fora */}
          <label htmlFor="plf-nav-toggle" className="plf-nav-backdrop" aria-hidden></label>

          {/* Menu mobile (hambúrguer) */}
          <div id="plf-mobile-menu" className="plf-mobile-menu">
            <Link href="/#solucao">Solução</Link>
            <Link href="/#demo-video">PlantiumAI</Link>
            <Link href="/#tecnologia">Tecnologia</Link>
            <Link href="/#mercado">Mercado</Link>
            <Link href="/#equipe">Equipe</Link>
            <Link href="/#contato">Contato</Link>
            <Link href="/planos">Planos</Link>
            <Link href="/documentos">Documentos</Link>
            <Link href="/login" className="plf-mm-login">Entrar no painel</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider text-emerald-400">
            Nossos Planos
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl mt-6 tracking-tight leading-tight text-[#eaf3ee]">
            Cultive com inteligência e previsibilidade
          </h1>
          <p className="text-[#9fb4a8] text-lg mt-4 leading-relaxed font-normal">
            Escolha a assinatura ideal para as suas micro estufas ou hortas verticais. Integre seus dispositivos IoT à nuvem e acesse diagnósticos avançados.
          </p>

          {/* Seletor de Faturamento Premium Deslizante de largura fixa e pointer-events-none no slider */}
          <div className="mt-10 relative inline-flex items-center p-1 rounded-full bg-[#0d1b14]/80 border border-emerald-500/20 shadow-lg shadow-emerald-950/20 w-[296px]">
            {/* Sliding Pill Indicator */}
            <div
              className="absolute top-1 bottom-1 w-[144px] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ease-out shadow-md pointer-events-none z-0"
              style={{
                left: billingPeriod === "mensal" ? "4px" : "148px",
              }}
            />
            <button
              onClick={() => setBillingPeriod("mensal")}
              className={`relative z-10 w-[144px] py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                billingPeriod === "mensal" ? "text-slate-950 font-bold" : "text-[#9fb4a8] hover:text-[#eaf3ee]"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("anual")}
              className={`relative z-10 w-[144px] py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 flex items-center justify-center gap-1.5 ${
                billingPeriod === "anual" ? "text-slate-950 font-bold" : "text-[#9fb4a8] hover:text-[#eaf3ee]"
              }`}
            >
              Anual
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded transition-all duration-300 ${
                billingPeriod === "anual" ? "bg-slate-950/20 text-slate-950" : "bg-emerald-950 text-emerald-400 border border-emerald-500/10"
              }`}>
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-20">
          
          <PricingCard
            title="WhatsApp Grátis"
            tag="FREEMIUM · A ISCA"
            description="IA agronômica gratuita para identificar doenças por fotos instantaneamente e indicar tratamentos."
            monthlyPrice={0}
            annualPrice={0}
            billingPeriod={billingPeriod}
            buttonText="Começar Grátis"
            buttonLink="https://wa.me/message/PLANTIUMAI"
            features={[
              "Identificação instantânea de fitopatologias",
              "Chatbot com IA 24/7 no WhatsApp",
              "Sem limite de consultas ou fotos",
              "Recomendações ecológicas e convencionais",
              "Links para parceiros de defensivos",
              "Sem necessidade de hardware ou sensores",
              "100% gratuito, sem cartão de crédito",
            ]}
          />

          <PricingCard
            title="Software Assinatura"
            tag="PREMIUM · O ANZOL"
            description="Aluguel mensal completo: locação das placas ESP32, sensores, conectividade 4G LTE ativa, suporte remoto e alertas (sem painel LED)."
            monthlyPrice={299}
            annualPrice={249}
            billingPeriod={billingPeriod}
            isPopular={true}
            badgeText="Recomendado"
            buttonText="Assinar Premium"
            buttonLink="/login"
            features={[
              "Locação das placas ESP32 e sensores inclusa",
              "Conectividade 4G redundante ativa (SIM card)",
              "Monitoramento completo (Ar, Solo, CO₂ e Luz)",
              "Painel Web e Desktop (Offline-First em Rust)",
              "Diagnósticos avançados e alertas via WhatsApp",
              "Instalação física e calibração básica inclusas",
              "Suporte técnico e manutenção de hardware",
            ]}
          />

          <PricingCard
            title="Aquisição Total"
            tag="PRO · A ESCALA"
            description="O cliente adquire a propriedade do hardware próprio (a partir de R$ 1.010,08) e paga uma assinatura enxuta apenas pelo software e alertas."
            monthlyPrice={79}
            annualPrice={59}
            billingPeriod={billingPeriod}
            buttonText="Adquirir Kit Pro"
            buttonLink="/login"
            features={[
              "Propriedade definitiva do hardware IoT",
              "Taxa recorrente de software altamente reduzida",
              "Emulador de biomas completo integrado",
              "Suporte a controle dinâmico multi-estufas",
              "1 ano de manutenção presencial inclusa",
              "Visão computacional e YOLO na borda (opcional)",
              "Integração com API aberta e MQTT local",
            ]}
          />

        </div>

        {/* Tabela Comparativa Detalhada */}
        <section className="mb-20">
          <h2 className="font-display font-semibold text-2xl text-center mb-8 text-[#eaf3ee]">
            Comparação detalhada de recursos
          </h2>
          <div className="overflow-x-auto rounded-3xl border border-emerald-500/10 shadow-lg bg-[#12211a]/20 backdrop-blur-md">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#78c896]/10 bg-[#12211a]/40">
                  <th className="p-4 font-semibold text-[#9fb4a8]">Especificações</th>
                  <th className="p-4 font-semibold text-[#eaf3ee]">WhatsApp Grátis (Freemium)</th>
                  <th className="p-4 font-semibold text-[#eaf3ee]">Software Assinatura (Premium)</th>
                  <th className="p-4 font-semibold text-[#eaf3ee]">Aquisição Total (Pro)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#78c896]/10 text-[#eaf3ee]/90">
                <tr className="hover:bg-emerald-500/5 transition-colors">
                  <td className="p-4 font-medium text-[#9fb4a8]">Aquisição de Hardware</td>
                  <td className="p-4">Não Exige</td>
                  <td className="p-4">Aluguel (Locação Placas/Sensores)</td>
                  <td className="p-4">Compra / Propriedade definitiva</td>
                </tr>
                <tr className="hover:bg-emerald-500/5 transition-colors">
                  <td className="p-4 font-medium text-[#9fb4a8]">Custo do Hardware IoT (CapEx)</td>
                  <td className="p-4">-</td>
                  <td className="p-4">Sem Custo Inicial</td>
                  <td className="p-4">R$ 1.010,08 (Básico) / R$ 1.705,22 (Pro)<br /><span className="text-xs text-[#9fb4a8]">(com LED: +R$ 850,00 ou +R$ 1.150,00)</span></td>
                </tr>
                <tr className="hover:bg-emerald-500/5 transition-colors">
                  <td className="p-4 font-medium text-[#9fb4a8]">Coleta de Dados (Sensores)</td>
                  <td className="p-4">-</td>
                  <td className="p-4">Ar, Solo, CO₂ e Luz</td>
                  <td className="p-4">Ar, Solo, CO₂ e Luz</td>
                </tr>
                <tr className="hover:bg-emerald-500/5 transition-colors">
                  <td className="p-4 font-medium text-[#9fb4a8]">Suplementação Luminosa</td>
                  <td className="p-4">-</td>
                  <td className="p-4">Opcional (Locação painel LED)</td>
                  <td className="p-4">Opcional (Compra do painel LED)</td>
                </tr>
                <tr className="hover:bg-emerald-500/5 transition-colors">
                  <td className="p-4 font-medium text-[#9fb4a8]">Operação Offline-First</td>
                  <td className="p-4">-</td>
                  <td className="p-4">Sim (Rust local / SQLite)</td>
                  <td className="p-4">Sim (Rust local / SQLite)</td>
                </tr>
                <tr className="hover:bg-emerald-500/5 transition-colors">
                  <td className="p-4 font-medium text-[#9fb4a8]">Interface Conversacional</td>
                  <td className="p-4">Identificação de Doenças (Fotos)</td>
                  <td className="p-4">Completa (Diagnósticos por Voz/Texto e PDFs)</td>
                  <td className="p-4">Completa (Diagnósticos por Voz/Texto e PDFs)</td>
                </tr>
                <tr className="hover:bg-emerald-500/5 transition-colors">
                  <td className="p-4 font-medium text-[#9fb4a8]">Emulador de Biomas</td>
                  <td className="p-4 text-red-500 font-semibold">-</td>
                  <td className="p-4 text-red-500 font-semibold">-</td>
                  <td className="p-4 text-emerald-400 font-medium">✓ (Modulação dinâmica de microclima)</td>
                </tr>
                <tr className="hover:bg-emerald-500/5 transition-colors">
                  <td className="p-4 font-medium text-[#9fb4a8]">Mão de obra e Instalação</td>
                  <td className="p-4">-</td>
                  <td className="p-4">Inclusa (Básica) / +R$ 200,00 (LED)</td>
                  <td className="p-4">R$ 590,00 (Sem LED) / R$ 790,00 (Com LED)</td>
                </tr>
                <tr className="hover:bg-emerald-500/5 transition-colors">
                  <td className="p-4 font-medium text-[#9fb4a8]">Suporte e Manutenção</td>
                  <td className="p-4">Comunidade</td>
                  <td className="p-4">Suporte Remoto</td>
                  <td className="p-4 text-emerald-400 font-medium">1 Ano de Manutenção Presencial e Garantia</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#34d977] mt-4 leading-relaxed text-center font-mono font-semibold">
            * O plano de WhatsApp Grátis funciona de forma independente e não requer hardware local de sensoriamento.
          </p>
        </section>

        {/* Investimento inicial: equipamento e instalação (pagamento único) */}
        <section className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider text-emerald-400">
              Investimento inicial · pagamento único
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl mt-6 tracking-tight leading-tight text-[#eaf3ee]">
              Equipamento e instalação
            </h2>
            <p className="text-[#9fb4a8] text-base mt-4 leading-relaxed">
              O kit de hardware e a instalação em campo são pagos uma única vez, separados da assinatura recorrente.
              A mão de obra segue a taxa da equipe, de R$ 55,00 por hora.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Kit básico */}
            <div className="relative rounded-3xl p-7 flex flex-col bg-[#12211a]/30 border border-[#78c896]/10 backdrop-blur-md shadow-black/40 shadow-2xl">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6c8478]">Equipamento</span>
              <h3 className="font-display font-extrabold text-2xl mt-1 text-[#eaf3ee]">Kit Protótipo IoT</h3>
              <div className="mt-4 mb-2 flex items-baseline gap-1">
                <span className="text-[#9fb4a8] text-sm font-medium">Sem LED:</span>
                <span className="text-xl font-bold text-[#eaf3ee]">R$ 1.010,08</span>
              </div>
              <div className="mb-5 flex items-baseline gap-1">
                <span className="text-emerald-400 text-sm font-semibold">Com LED:</span>
                <span className="text-2xl font-extrabold text-emerald-400">R$ 1.860,08</span>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3"><div className="p-0.5 rounded-full shrink-0 mt-0.5 bg-[#14291e]/50 text-emerald-400"><Check className="w-3.5 h-3.5" /></div><span className="text-[#d8e6df]">Placa ESP32 central configurada localmente</span></li>
                <li className="flex items-start gap-3"><div className="p-0.5 rounded-full shrink-0 mt-0.5 bg-[#14291e]/50 text-emerald-400"><Check className="w-3.5 h-3.5" /></div><span className="text-[#d8e6df]">Sensores de umidade (solo/ar), temp, luz e CO₂</span></li>
                <li className="flex items-start gap-3"><div className="p-0.5 rounded-full shrink-0 mt-0.5 bg-[#14291e]/50 text-emerald-400"><Check className="w-3.5 h-3.5" /></div><span className="text-[#d8e6df]">Opcional: Painel LED Grow Light Full Spectrum 100W (+R$ 850,00)</span></li>
              </ul>
            </div>

            {/* Kit completo */}
            <div className="relative rounded-3xl p-7 flex flex-col bg-[#12211a]/30 border border-[#78c896]/10 backdrop-blur-md shadow-black/40 shadow-2xl">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6c8478]">Equipamento</span>
              <h3 className="font-display font-extrabold text-2xl mt-1 text-[#eaf3ee]">Kit Expansão Pro</h3>
              <div className="mt-4 mb-2 flex items-baseline gap-1">
                <span className="text-[#9fb4a8] text-sm font-medium">Sem LED:</span>
                <span className="text-xl font-bold text-[#eaf3ee]">R$ 1.705,22</span>
              </div>
              <div className="mb-5 flex items-baseline gap-1">
                <span className="text-emerald-400 text-sm font-semibold">Com LED:</span>
                <span className="text-2xl font-extrabold text-emerald-400">R$ 2.855,22</span>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3"><div className="p-0.5 rounded-full shrink-0 mt-0.5 bg-[#14291e]/50 text-emerald-400"><Check className="w-3.5 h-3.5" /></div><span className="text-[#d8e6df]">Sensores de precisão + Câmera IP67 (IA YOLO)</span></li>
                <li className="flex items-start gap-3"><div className="p-0.5 rounded-full shrink-0 mt-0.5 bg-[#14291e]/50 text-emerald-400"><Check className="w-3.5 h-3.5" /></div><span className="text-[#d8e6df]">Indicado para estufas comerciais e containers</span></li>
                <li className="flex items-start gap-3"><div className="p-0.5 rounded-full shrink-0 mt-0.5 bg-[#14291e]/50 text-emerald-400"><Check className="w-3.5 h-3.5" /></div><span className="text-[#d8e6df]">Opcional: Painel LED Profissional Multicor (+R$ 1.150,00)</span></li>
              </ul>
            </div>

            {/* Instalação */}
            <div className="relative rounded-3xl p-7 flex flex-col bg-[#14291e]/50 border border-[#34d977]/40 backdrop-blur-md shadow-[0_0_40px_rgba(52,217,119,0.12)]">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">Mão de obra</span>
              <h3 className="font-display font-extrabold text-2xl mt-1 text-[#eaf3ee]">Instalação Física</h3>
              <div className="mt-4 mb-2 flex items-baseline gap-1">
                <span className="text-[#9fb4a8] text-sm font-medium">Básica (Sem LED):</span>
                <span className="text-xl font-bold text-[#eaf3ee]">R$ 590,00</span>
              </div>
              <div className="mb-5 flex items-baseline gap-1">
                <span className="text-emerald-400 text-sm font-semibold">Completa (Com LED):</span>
                <span className="text-2xl font-extrabold text-emerald-400">R$ 790,00</span>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3"><div className="p-0.5 rounded-full shrink-0 mt-0.5 bg-emerald-500/10 text-emerald-400"><Check className="w-3.5 h-3.5" /></div><span className="text-[#d8e6df]">Básica: 8 horas em campo (calibração e fixação)</span></li>
                <li className="flex items-start gap-3"><div className="p-0.5 rounded-full shrink-0 mt-0.5 bg-emerald-500/10 text-emerald-400"><Check className="w-3.5 h-3.5" /></div><span className="text-[#d8e6df]">Com LED: 12 horas em campo + cabeamento de potência</span></li>
                <li className="flex items-start gap-3"><div className="p-0.5 rounded-full shrink-0 mt-0.5 bg-emerald-500/10 text-emerald-400"><Check className="w-3.5 h-3.5" /></div><span className="text-[#9fb4a8]">Área de cobertura: Goiânia e região metropolitana</span></li>
              </ul>
            </div>
          </div>

          {/* Adendo de deslocamento */}
          <div className="mt-6 p-6 rounded-2xl border border-emerald-500/10 bg-[#12211a]/20 backdrop-blur-sm">
            <h4 className="font-semibold text-base mb-2 text-[#eaf3ee] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Instalação fora de Goiânia — deslocamento
            </h4>
            <p className="text-sm text-[#9fb4a8] leading-relaxed">
              Para municípios fora de Goiânia, aplica-se um acréscimo de deslocamento calculado por{" "}
              <span className="font-mono text-[#34d977]">D = 2 × d × c + p</span>, onde{" "}
              <span className="font-mono text-[#d8e6df]">d</span> é a distância rodoviária (km) até o destino;{" "}
              <span className="font-mono text-[#d8e6df]">c</span> = R$ 1,30/km (combustível, desgaste e tempo); o fator 2 cobre ida e volta; e{" "}
              <span className="font-mono text-[#d8e6df]">p</span> é a diária de R$ 180,00 (alimentação e hospedagem), apenas quando houver pernoite.
              Exemplos: 120 km sem pernoite → <span className="text-[#d8e6df] font-semibold">+R$ 312,00</span>; 250 km com pernoite → <span className="text-[#d8e6df] font-semibold">+R$ 830,00</span>.
            </p>
          </div>
        </section>

        {/* Retorno Financeiro e Viabilidade */}
        <section className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider text-emerald-400">
              Viabilidade e ROI · Embasamento Real
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl mt-6 tracking-tight leading-tight text-[#eaf3ee]">
              Retorno financeiro e mitigação
            </h2>
            <p className="text-[#9fb4a8] text-base mt-4 leading-relaxed">
              Entenda como a automação de precisão e a IA em malha fechada protegem a margem do produtor e viabilizam a operação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Bloco 1: Viabilidade do Aluguel */}
            <div className="p-8 rounded-3xl border border-emerald-500/10 bg-[#12211a]/20 backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 className="font-display font-extrabold text-xl text-[#eaf3ee] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#34d977] inline-block animate-pulse" />
                  Modelagem Financeira HaaS e Viabilidade
                </h3>
                <p className="text-sm text-[#9fb4a8] leading-relaxed mb-4">
                  No plano **Premium (Software Assinatura)**, a PlantiumAI subsidia 100% do investimento inicial em hardware (ESP32 central, fiação, sensores radiculares e atuadores) no modelo de locação (HaaS). 
                </p>
                <p className="text-sm text-[#9fb4a8] leading-relaxed">
                  O valor de **R$ 299,00/mês** (ou **R$ 249,00/mês** no anual) foi desenhado para viabilizar essa amortização dos dispositivos (CapEx aproximado de R$ 1.010,08) juntamente com a sustentabilidade do chip de telemetria 4G LTE dedicado (**R$ 60,00/mês**), infraestrutura do banco de dados na nuvem e processamento dos prompts agronômicos via API.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-emerald-500/10 text-xs text-[#34d977] font-mono">
                PAYBACK ESTIMADO DO HARDWARE EM COBERTURA: ~10 MESES
              </div>
            </div>

            {/* Bloco 2: Métricas de ROI e Perdas */}
            <div className="p-8 rounded-3xl border border-emerald-500/10 bg-[#12211a]/20 backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 className="font-display font-extrabold text-xl text-[#eaf3ee] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#34d977] inline-block animate-pulse" />
                  Mitigação de Perdas e Eficiência Agrícola
                </h3>
                <ul className="space-y-4 text-sm text-[#9fb4a8]">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    <span>
                      <strong className="text-[#eaf3ee]">Até 85% de redução</strong> na perda total de ciclos produtivos por estresse térmico/hídrico não identificado ou erro humano.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    <span>
                      <strong className="text-[#eaf3ee]">Até 40% de economia</strong> de água e nutrientes na irrigação pulsada automática em malha fechada.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    <span>
                      <strong className="text-[#eaf3ee]">Proteção de Receita</strong>: Evitar uma única quebra de safra em estufa vertical (como cultivo de morango ou folhosas especiais) preserva até <strong className="text-[#eaf3ee]">R$ 15.000,00</strong> por ciclo de cultivo.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-6 border-t border-emerald-500/10 text-xs text-[#34d977] font-mono">
                Fontes: EMBRAPA Hortaliças · CNA 2026 · FAO · VarejoIN
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-4xl mx-auto mb-12">
          <h2 className="font-display font-semibold text-2xl text-center mb-8 text-[#eaf3ee]">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-emerald-500/10 bg-[#12211a]/20 backdrop-blur-sm hover:border-emerald-500/20 transition-all duration-300">
              <h4 className="font-semibold text-base mb-2 text-[#eaf3ee] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                O kit de hardware e a instalação já estão inclusos na assinatura?
              </h4>
              <p className="text-sm text-[#9fb4a8] leading-relaxed">
                Não. São pagamentos únicos, separados da mensalidade: o kit protótipo IoT custa R$ 1.010,08 (R$ 1.860,08 com LED de suplementação) e a versão de expansão Pro custa R$ 1.705,22 (R$ 2.855,22 com LED profissional); a instalação física em campo custa R$ 590,00 (básica) ou R$ 790,00 (completa com suporte LED). No plano Premium (Software Assinatura), a locação básica do hardware já está inclusa na assinatura mensal.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-emerald-500/10 bg-[#12211a]/20 backdrop-blur-sm hover:border-emerald-500/20 transition-all duration-300">
              <h4 className="font-semibold text-base mb-2 text-[#eaf3ee] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                O sistema de irrigação funciona mesmo sem conexão com a internet?
              </h4>
              <p className="text-sm text-[#9fb4a8] leading-relaxed">
                Sim. A inteligência de irrigação baseada em regras locais roda diretamente no app de borda (desktop/Tauri), garantindo o monitoramento físico mesmo se a internet oscilar ou falhar.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-emerald-500/10 bg-[#12211a]/20 backdrop-blur-sm hover:border-emerald-500/20 transition-all duration-300">
              <h4 className="font-semibold text-base mb-2 text-[#eaf3ee] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                Existe fidelidade nos planos mensais ou desconto no faturamento anual?
              </h4>
              <p className="text-sm text-[#9fb4a8] leading-relaxed">
                Não há fidelidade nos planos mensais, você pode cancelar a assinatura a qualquer momento. No faturamento anual, você ganha 17% de desconto sobre o valor total. Essa porcentagem de desconto equivale a obter exatamente 2 meses grátis de assinatura por ano (você utiliza os 12 meses pagando apenas por 10).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-500/10 py-8 bg-[#050a07] relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#9fb4a8]">
          <span>© 2026 PlantiumAI · Micro estufas e hortas verticais inteligentes · ThyagoToledo</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-emerald-400 transition">Início</Link>
            <Link href="/login" className="hover:text-emerald-400 transition">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

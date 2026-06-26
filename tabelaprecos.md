# PlantiumAI — Planos de Assinatura

> Modelo de negócio **SaaS** (Software como Serviço), conforme a Seção 6.4 do Trabalho
> Científico: cobrança recorrente por assinatura, **atrelada ao fornecimento inicial do kit
> físico**. O cliente **adquire o hardware à parte** (kit a partir de R$ 1.010,08 — protótipo —
> ou R$ 1.705,22 — versão completa com visão computacional; ver Anexo A do TCC) e contrata uma
> **assinatura mensal para usar o sistema** (dashboard, IA, alertas, nuvem e suporte).
>
> Premissa de preço: **nem barato demais** para o início (precisa cobrir o OpEx de R$ 460/mês da
> arquitetura futura — Anexo B — e amortizar o CapEx de R$ 43.048,74 — Anexo C), **nem caro demais**
> para o pequeno produtor goiano de micro estufas e hortas verticais, público-alvo central do projeto.

---

## Visão geral dos três planos

| | 🌱 **Semente** | 🌿 **Cultivo** | 🏡 **Estufa+** |
|---|:---:|:---:|:---:|
| **Posicionamento** | Essencial | Profissional · *mais popular* | Premium / Visão |
| **Mensal** | **R$ 89/mês** | **R$ 179/mês** | **R$ 349/mês** |
| **Anual** (2 meses grátis) | **R$ 74/mês** | **R$ 149/mês** | **R$ 291/mês** |
| Unidades de cultivo | 1 | até 3 | até 10 |
| Usuários | 1 | até 3 | ilimitado |
| Sensores ambientais e de solo | ✅ | ✅ | ✅ |
| Dashboard web em tempo real | ✅ | ✅ | ✅ |
| Irrigação por regras (offline / fail-safe) | ✅ | ✅ | ✅ |
| Alertas inteligentes (regras + IA) | Básico (Haiku) | Avançado (Sonnet) | Avançado (Sonnet) |
| Histórico e rastreabilidade | 6 meses | 24 meses | Ilimitado |
| Relatórios PDF / CSV | Mensal | Semanal | Sob demanda |
| Clima integrado (Open-Meteo) | — | ✅ | ✅ |
| Diagnóstico e recomendações por IA | — | ✅ | ✅ |
| Integração WhatsApp (alertas + consultas) | — | ✅ | ✅ |
| **Visão computacional** (câmera + IA multimodal) | — | — | ✅ |
| Detecção foliar precoce (YOLO na borda) | — | — | ✅ |
| Conectividade 4G gerenciada (SIM incluso) | — | — | ✅ |
| Armazenamento de imagens (nuvem) | — | — | 50 GB/mês |
| Suporte | E-mail | E-mail + WhatsApp | Prioritário |

> *Hardware vendido separadamente.* Câmera USB IP67 e hub de borda Raspberry Pi (necessários ao
> plano Estufa+) são itens da **evolução** do projeto (Anexo A, Tabela A.2).

---

## Detalhamento

### 🌱 Plano Semente — Essencial · R$ 89/mês
**Para quem está começando: uma micro estufa ou horta vertical.**
Endereça a **dor principal** mapeada pelo IFAG (2026) — o ajuste inadequado da irrigação (score
526,9) — com o núcleo do sistema já validado no protótipo funcional:
- Monitoramento contínuo de umidade do solo e do ar, temperatura e luminosidade;
- Classificação da umidade do substrato em 5 níveis (faixa ideal 35%–65%);
- Decisão de irrigação por regras operando **offline**, com salvaguarda (Circuit Breaker + fallback `regra_local`);
- Dashboard web, alertas básicos por IA e relatório mensal em PDF.

### 🌿 Plano Cultivo — Profissional · R$ 179/mês  ·  *mais popular*
**Para o produtor que escala: até 3 unidades e equipe.**
Tudo do Semente, e agrega a camada de **inteligência** descrita na Seção 4.2 (gateway de IA):
- Análise por IA (Sonnet) com **diagnóstico e recomendações** em linguagem natural;
- Integração conversacional via **WhatsApp** (“Como está minha plantação hoje?”, “Quanto de água economizei?”);
- Clima integrado, múltiplos usuários com permissões e relatórios semanais (PDF/CSV).

### 🏡 Plano Estufa+ — Premium / Visão · R$ 349/mês
**Para operações que exigem diagnóstico fitossanitário e conectividade em campo.**
Tudo do Cultivo, e adiciona a **arquitetura de evolução** (Seção 5):
- **Visão computacional**: câmera IP67 + detector YOLO na borda (Raspberry Pi) para diagnóstico
  foliar primário e detecção precoce de pragas (dores IFAG de score 471,4 e 254,0);
- **SIM 4G gerenciado incluso** e armazenamento de imagens em nuvem (~50 GB/mês);
- Rastreabilidade ambiental completa e suporte prioritário.

---

## Preços separados: equipamento, instalação e assinatura

O investimento do produtor é apresentado em **três componentes distintos**, para deixar claro o que é
gasto único e o que é mensal:

| Componente | Tipo | Base de cálculo | Custo (R$) | Preço ao cliente (R$) | Margem (R$) |
|---|---|---|---:|---:|---:|
| Equipamento — kit básico | Único | Hardware (Anexo A) + 28% | 1.010,08 | **1.290,00** | 279,92 |
| Equipamento — kit completo | Único | Hardware (Anexo A) + 28% | 1.705,22 | **2.190,00** | 484,78 |
| Instalação e configuração | Único | 8 h × R$ 55,00/h | 440,00 | **590,00** | 150,00 |
| Assinatura | Recorrente | ver planos acima | — | **89 / 179 / 349 /mês** | 64 / 119 / 169 |

**Instalação** (Goiânia e região metropolitana): 8 h de mão de obra à taxa de R$ 55,00/h (a mesma do
desenvolvimento) — montagem física, fixação de sensores/atuadores, calibração, configuração do app e
teste da irrigação.

### Adendo — deslocamento fora de Goiânia
Acréscimo calculado por **D = 2 × d × c + p**, onde `d` = distância rodoviária (km) Goiânia→destino;
`c` = R$ 1,30/km (combustível + desgaste + tempo); fator 2 = ida e volta; `p` = diária de R$ 180,00
(alimentação/hospedagem), só quando houver pernoite.

| Distância (ida) | Cálculo | Acréscimo |
|---|---|---:|
| Goiânia / RM | — | R$ 0,00 |
| 120 km (sem pernoite) | 2 × 120 × 1,30 | R$ 312,00 |
| 250 km (com pernoite) | 2 × 250 × 1,30 + 180 | R$ 830,00 |

> A **assinatura é a principal fonte de renda** (recorrente); equipamento e instalação são receitas
> únicas que aceleram o retorno do investimento.

## Notas de implementação (botão "Planos" na home)
- Seção `#planos` na landing `web/` (Next.js + Tailwind), 3 cards responsivos (grid → coluna no mobile),
  card central "Cultivo" em destaque (`scale` + borda verde da paleta), toggle **Mensal/Anual** animado,
  CTA "Falar com a equipe" reaproveitando o padrão de botão já existente na CTA da home.
- Animações de entrada (fade/slide com IntersectionObserver ou Framer Motion), respeitando `prefers-reduced-motion`.
- Valores são **estimativas iniciais** sujeitas a ajuste após as instalações-piloto (coerente com a
  ressalva de SAM/SOM da Seção 6.1 do Trabalho Científico).

> Fonte dos custos e do embasamento: *Trabalho Científico PlantiumAI (2026)* — Seção 6.4 e Anexos A, B e C.

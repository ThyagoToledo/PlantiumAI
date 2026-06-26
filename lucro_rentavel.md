# PlantiumAI — Lucro e Rentabilidade das Assinaturas

> Análise da rentabilidade dos três planos de [tabelaprecos.md](tabelaprecos.md), com **memória de
> cálculo explícita** (o Trabalho Científico exige números acompanhados de tabela e cálculo).
> Base de custos: **Anexo B** (OpEx R$ 460/mês) e **Anexo C** (CapEx de implantação R$ 43.048,74)
> do Trabalho Científico PlantiumAI (2026).

---

## 1. Estrutura de custos

### 1.1 Custo fixo mensal (compartilhado entre todos os clientes)
Parte do OpEx **não escala** por cliente — é diluída conforme a base cresce.

| Item (Anexo B) | R$/mês | Natureza |
|---|---:|---|
| VPS / Servidor (backend + PostgreSQL) | 200,00 | Fixo |
| API de IA — base (alertas, prompt caching) | 150,00 | Semi-fixo |
| **Custo fixo de plataforma** | **≈ 350,00** | Diluído na base |

### 1.2 Custo marginal por assinatura ativa (R$/mês)
O que **cada cliente novo** acrescenta de custo, por plano:

| Componente | Semente | Cultivo | Estufa+ |
|---|---:|---:|---:|
| IA por unidade (Haiku/Sonnet, com cache) | 8 | 25 | 45 |
| Armazenamento de imagens (Anexo B) | 2 | 10 | 50 |
| SIM 4G (Anexo B, por unidade) | — | — | 60 |
| Banda/infra incremental | 5 | 10 | 25 |
| **Custo marginal / assinante** | **≈ 25** | **≈ 60** | **≈ 180** |

> Semente e Cultivo assumem conectividade do próprio produtor (Wi-Fi/4G dele). O SIM 4G só é
> custeado pela startup no Estufa+, onde está incluso no preço.

---

## 2. Margem de contribuição por plano (mensal)

Margem de contribuição = Preço − Custo marginal. (Plano anual usado como cenário conservador.)

| Plano | Preço/mês | Custo marginal | **Margem** | **Margem %** |
|---|---:|---:|---:|---:|
| 🌱 Semente | 89,00 | 25,00 | **64,00** | 72% |
| 🌿 Cultivo | 179,00 | 60,00 | **119,00** | 66% |
| 🏡 Estufa+ | 349,00 | 180,00 | **169,00** | 48% |

Todos os planos têm margem de contribuição **positiva e alta** — saudável para SaaS. O Estufa+ tem
margem percentual menor por carregar hardware-serviço (SIM + imagens), mas a **maior margem absoluta**.

---

## 3. Cliente médio (ARPU) — mix de vendas estimado

Mix inicial assumido para o SOM regional (Goiás/Centro-Oeste): **50% Semente · 35% Cultivo · 15% Estufa+**.

```
ARPU            = 0,50×89  + 0,35×179 + 0,15×349 = R$ 159,50 /assinante·mês
Custo marginal  = 0,50×25  + 0,35×60  + 0,15×180 = R$  63,75 /assinante·mês
Margem média    = 159,50 − 63,75                 = R$  95,75 /assinante·mês
```

---

## 4. Ponto de equilíbrio (break-even operacional)

Cobre apenas o custo fixo de plataforma (R$ 350/mês):

```
Break-even = Custo fixo / Margem média = 350 / 95,75 ≈ 3,7  →  4 assinantes
```

**A partir de ~4 assinaturas a operação mensal já se paga.** Tudo acima disso é lucro operacional
que amortiza o CapEx.

---

## 5. Cenários de receita e lucro

Lucro operacional/mês = (ARPU − Custo marginal) × Nº assinantes − Custo fixo.
*(Custo fixo escalonado: R$ 350 até 50 clientes; R$ 600 a partir de 100, por upgrade de VPS.)*

| Assinantes | Receita/mês | Custo var. | Custo fixo | **Lucro op./mês** | **Lucro op./ano** |
|---:|---:|---:|---:|---:|---:|
| 10 | 1.595 | 638 | 350 | **607** | **7.284** |
| 30 | 4.785 | 1.913 | 350 | **2.522** | **30.264** |
| 50 | 7.975 | 3.188 | 350 | **4.437** | **53.244** |
| 100 | 15.950 | 6.375 | 600 | **8.975** | **107.700** |

---

## 6. Retorno sobre o investimento (payback do CapEx)

CapEx total de implantação do piloto = **R$ 43.048,74** (Anexo C).

```
Payback (30 assinantes)  = 43.048,74 / 2.522  ≈ 17,1 meses
Payback (50 assinantes)  = 43.048,74 / 4.437  ≈  9,7 meses
Payback (100 assinantes) = 43.048,74 / 8.975  ≈  4,8 meses
```

Com **30 a 50 assinaturas** — fração mínima do SOM de R$ 12,5 mi (Seção 6.1) — o investimento se
paga em **menos de 1,5 ano**, e antes disso em escala maior.

---

## 7. Receita única: equipamento + instalação

Além da assinatura recorrente, cada cliente gera **receita única** na venda do equipamento e na
instalação. Não está contabilizada nos cenários da Seção 5 (que consideram só a assinatura), e **acelera
o payback**.

| Componente | Custo (R$) | Preço (R$) | Margem (R$) |
|---|---:|---:|---:|
| Equipamento — kit básico (Anexo A) | 1.010,08 | 1.290,00 | **279,92** |
| Equipamento — kit completo (visão) | 1.705,22 | 2.190,00 | **484,78** |
| Instalação (8 h × R$ 55,00/h) | 440,00 | 590,00 | **150,00** |

**Receita única por cliente:** R$ 1.880,00 (kit básico + instalação) a R$ 2.780,00 (kit completo +
instalação). **Margem única:** R$ 429,92 a R$ 634,78 por cliente.

### Adendo — deslocamento fora de Goiânia
**D = 2 × d × c + p** — `d` = km Goiânia→destino; `c` = R$ 1,30/km; fator 2 = ida/volta; `p` = diária
R$ 180,00 (só com pernoite). Ex.: 120 km → +R$ 312,00; 250 km c/ pernoite → +R$ 830,00. Repassado
integralmente ao cliente (custo neutro).

> Combinando os dois fluxos, 30 assinaturas geram ~R$ 30 mil/ano recorrentes **mais** ~R$ 12,9 mil a
> R$ 19 mil de margem única (30 × R$ 429,92 a R$ 634,78), reduzindo o payback do CapEx para bem menos de
> um ano.

---

## 8. Conclusão

- **Preço equilibrado**: a partir de R$ 89/mês o produtor de pequena estufa acessa o sistema sem
  barreira alta; o teto de R$ 349 atende operações maiores com visão computacional.
- **Sustentável**: margem de contribuição de 48%–72% e break-even em ~4 assinantes.
- **Rentável**: lucro operacional anual de **R$ 30 mil a R$ 108 mil** entre 30 e 100 assinaturas,
  com payback do CapEx em **5 a 17 meses** — coerente com o SOM regional estimado no Trabalho Científico.

> **Ressalva** (alinhada à Seção 6.1 do TCC): custos de IA, armazenamento e mix de planos são
> estimativas e devem ser refinados com dados reais das instalações-piloto.

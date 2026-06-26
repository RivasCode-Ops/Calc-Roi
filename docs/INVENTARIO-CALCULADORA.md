# Inventário — Calc-Roi (Raio-X · Reforço · Picos)

**Referência de código:** `master@8bd1b33` (produção / GitHub Pages · inclui este inventário) · branch `simulacao-precos-reforco@bf91a5c` (simulação comercial) · **26/06/2026**

**URL produção:** https://rivascode-ops.github.io/Calc-Roi/  
**Inventário (GitHub):** https://github.com/RivasCode-Ops/Calc-Roi/blob/master/docs/INVENTARIO-CALCULADORA.md

SPA estática (HTML/CSS/JS vanilla). Sem backend, sem build. Três abas principais no `index.html`.

---

## 1. ROI Negócios

| Item | Detalhe |
|------|---------|
| **Motor** | `calc-engine.js` |
| **UI** | `app.js` |
| **Persistência** | `roi-storage.js` — até 20 cenários nomeados (`calc_roi_cenarios_v1`) |
| **Entradas** | Investimento, clientes, ticket, custos, taxa aplicação (% a.m. ou a.a.), opcional pró-labore/depreciação/horizonte |
| **Saídas** | Lucro, ROI, payback, VPL, TIR, comparativo renda fixa, cenários −25% / base / +25%, semáforo |

**Fórmula resumida:** faturamento = clientes × ticket; lucro = faturamento − custos − pró-labore − depreciação; VPL desconta fluxo pelo horizonte (padrão 60 meses) com taxa da aplicação; TIR por bisseção no mesmo fluxo.

---

## 2. Precificação Reforço

| Item | Detalhe |
|------|---------|
| **Config** | `reforco-pricing.config.js` — **único arquivo de regra de negócio editável** |
| **Motor** | `reforco-pricing-engine.js` (funções puras) |
| **UI** | `reforco-app.js` |
| **Testes** | `test_reforco_pricing_engine.py` |
| **Template comercial** | `reforco-pricing.config.TEMPLATE.js` (não carregado pelo site) |

### Escopo e preços — leia antes de confundir produção com simulação

| Ambiente | Commit / branch | Tabela |
|----------|-----------------|--------|
| **Produção (Pages)** | `master@8bd1b33` | **Homologada** — valores de exemplo até tabela da escola |
| **Simulação (rascunho)** | `simulacao-precos-reforco@bf91a5c` · PR #2 draft | **Mercado** — discussão comercial, **não mergear** sem confirmação |

#### Produção (`master`) — homologada em jun/2026

| Segmento | R$/h | Modalidade | Fator/aluno |
|----------|------|------------|-------------|
| Infantil 4–5 | 35 | Individual | 1,00 |
| 1º–5º | 40 | Dupla | 0,65 |
| 6º–9º | 50 | Trio | 0,55 |
| Ensino médio | 60 | Grupo | 0,45 (ref. 6 alunos) |

Descontos: 8+ aulas/mês → 5% · 12+ → 10% · semanas/mês: 4 · duração padrão: 60 min.

#### Simulação (`simulacao-precos-reforco`) — **não é tabela oficial**

| Segmento | R$/h | Modalidade | Fator/aluno |
|----------|------|------------|-------------|
| Infantil 4–5 | 45 | Individual | 1,00 |
| 1º–5º | 50 | Dupla | 0,70 |
| 6º–9º | 60 | Trio | 0,60 |
| Ensino médio | 70 | Grupo | 0,50 (ref. 6 alunos) |

Mesmas faixas de desconto e semanas. **Tabela comercial definitiva ainda depende da escola** (Projeto 2).

**Fórmula:** `mensalidade = valorHoraBase × fator × (min/60) × aulasSemana × semanas × (1 − desconto%)`

---

## 3. Picos do Saber (Gestão Escolar)

| Item | Detalhe |
|------|---------|
| **Motor** | `gestao-engine.js` |
| **UI** | `gestao-app.js` |
| **Persistência** | `gestao-storage.js` — Painel Mestre (`picos_gestao_mestre_v1`) |
| **Gráficos / PDF** | `gestao-charts.js`, `gestao-export.js` |

**Módulos** (calculam a partir do Painel Mestre): Viabilidade, Capacidade, Preço ideal, ROI escolar, Cenários, Equilíbrio.

---

## 4. Validação e erros (por aba)

| Aba | Campos obrigatórios | Zero / vazio | Erro de cálculo / motor | localStorage |
|-----|---------------------|--------------|-------------------------|--------------|
| **ROI** | Investimento, clientes, ticket, custos, taxa aplicação (> 0) | UI: **"Revise os campos"** + lista do que falta; não calcula | `try/catch` no submit → mensagem genérica para recarregar (Ctrl+F5) | Lista corrompida → `[]`; salvar sem nome / nome duplicado / limite 20 → mensagem no painel de cenários |
| **ROI — VPL/TIR** | (derivado do lucro) | Lucro ≤ 0 ou prejuízo | **TIR:** exibe **"—"** (sem TIR positiva no horizonte); **VPL** numérico (pode ser negativo); semáforo vermelho / veredito "Prejuízo" | Resumo do cenário salvo inclui VPL/TIR quando existem |
| **Reforço** | Segmento, modalidade, aulas/semana (> 0), duração (> 0) | 0 ou vazio → **"Revise os campos"** + texto da engine (`segmento`, `modalidade`, `aulas por semana`, `duração`) | `ReforcoPricingEngine` ausente → `console.error` e aba inoperante | **Não persiste** cenários na v1 |
| **Picos** | Alunos atuais, alunos/turma, mensalidade, turnos (> 0) para módulos | Validação no motor (`validarMestre`); módulos podem ficar vazios se mestre incompleto | Gráfico/PDF: falha de CDN ou jsPDF → aviso no botão PDF (`try/catch`) | JSON inválido → `console.warn`, formulário com defaults; quota cheia → `console.warn`, continua em memória |

**Regra geral:** nenhuma aba trava o browser em loop; erros de extensões Chrome no console podem ser ignorados na homologação.

---

## 5. Arquivos-chave

| Arquivo | Função |
|---------|--------|
| `index.html` | Layout, abas, formulários |
| `calc-engine.js` / `app.js` | ROI |
| `reforco-pricing.config.js` | Preços reforço (produção) |
| `reforco-pricing-engine.js` / `reforco-app.js` | Motor e UI reforço |
| `gestao-*.js` | Picos do Saber |
| `docs/HOMOLOGACAO-REFORCO.md` | Checklist homologação (issue #1 fechada) |
| `docs/REFORCO-PRICING.md` | Fórmula e plug-in do módulo reforço |

---

## 6. Testes automatizados

```bash
python -m pytest test_calc_engine.py test_gestao_engine.py test_reforco_pricing_engine.py -q
```

Espelham `calc-engine.js`, `gestao-engine.js` e `reforco-pricing-engine.js`. Na branch de simulação, `test_reforco_pricing_engine.py` usa os valores de mercado.

---

## 7. Pendências conhecidas (negócio, não técnico)

- Substituir `reforco-pricing.config.js` em `master` pela **tabela comercial confirmada** (Projeto 2).
- Revalidar coluna "Esperado" em `docs/HOMOLOGACAO-REFORCO.md` após troca de preços.
- PR #2 (`simulacao-precos-reforco`) permanece **draft** até decisão da escola.

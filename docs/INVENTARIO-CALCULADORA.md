# Inventário — Calc-Roi (Raio-X · Reforço · Picos)

**Referência de código:** `master@bfdd87d` (produção / GitHub Pages) · branch `simulacao-precos-reforco@bf91a5c` (simulação comercial · **não** em Pages) · **26/06/2026**

**URL produção:** https://rivascode-ops.github.io/Calc-Roi/  
**URL local:** http://localhost:8765/ (`scripts/servir.ps1`, `SERVIR.bat` ou `python -m http.server 8765`)  
**Inventário (GitHub):** https://github.com/RivasCode-Ops/Calc-Roi/blob/master/docs/INVENTARIO-CALCULADORA.md

SPA estática (HTML/CSS/JS vanilla). Sem backend, sem build. **Três abas** no `index.html`: ROI Negócios · Precificação Reforço · Picos do Saber.

### Nomenclatura de versão (evitar confusão)

| Onde aparece | Significado | Valor atual (`master`) |
|--------------|-------------|------------------------|
| Badge na UI — ROI | Rótulo de produto na tela | `Raio-X de Negócios · V2 · cenários salvos` |
| Badge na UI — Picos | Rótulo de produto na tela | `Picos do Saber · Gestão Escolar v9` |
| `?v=` nos `<script>` | **Cache bust** do navegador, não versão de negócio | ex.: `gestao-engine.js?v=10`, `gestao-app.js?v=11`, `app.js?v=11` |
| `README.md` roadmap | Marcos de entrega (V9 localStorage/PDF, V10 VPL/TIR) | V10 concluído em código |

**Regra:** citar versão oficial use badge UI + roadmap README; **não** confundir `?v=11` com “versão 11 do Picos”.

### Integração entre abas

- **Não existe** `window.sharedStorage` nem ponte automática Reforço → Picos no código atual (`master`).
- Cada aba tem motor e persistência próprios (ROI: `roi-storage.js`; Picos: `gestao-storage.js`; Reforço: sem cenários salvos na v1).

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
| **Produção (Pages)** | `master` (config 35/40/50/60 · fatores 1,00/0,65/0,55/0,45) | **Homologada** — valores de exemplo até tabela da escola |
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

**UI Picos:** badge e `#gestao-resumo` ficam **no topo do painel** (rolam com o conteúdo; **não** são `position: fixed/sticky`). Sub-abas (`Painel Mestre`, `Viabilidade`, …) abaixo do resumo.

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
| `docs/APRESENTACAO-CALCULADORA.md` | One-pager comercial / apresentação |
| `docs/REFORCO-PRICING.md` | Fórmula e plug-in do módulo reforço |

---

## 6. Testes automatizados

```bash
python -m pytest test_calc_engine.py test_gestao_engine.py test_reforco_pricing_engine.py -q
```

Espelham `calc-engine.js`, `gestao-engine.js` e `reforco-pricing-engine.js`. Na branch de simulação, `test_reforco_pricing_engine.py` usa os valores de mercado.

---

## 7. Pendências conhecidas

### Negócio (Projeto 2)

- Substituir `reforco-pricing.config.js` em **`master`** pela tabela comercial confirmada (não confundir com `simulacao-precos-reforco`).
- Revalidar coluna "Esperado" em `docs/HOMOLOGACAO-REFORCO.md` após troca de preços.
- PR #2 permanece **draft** até decisão da escola.

### Backlog de produto (não implementado)

| # | Item | Notas |
|---|------|-------|
| 1 | Numerar abas principais na UI (1 ROI · 2 Reforço · 3 Picos) | Hoje só texto nas tabs |
| 2 | CTA “levar preço ao Picos” (Reforço → mensalidade no Painel Mestre) | Sem integração hoje |
| 3 | Resumo executivo fixo na aba ROI (equivalente ao `#gestao-resumo` do Picos) | ROI mostra resultado após calcular, sem barra resumo persistente |
| 4 | Orientação de fluxo entre módulos (onboarding curto entre abas) | Documentação existe; UI não guia |

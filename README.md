# Raio-X de Negócios (Calc-Roi)

Calculadora de **ROI aplicado a negócios**: compare lucro mensal, payback e cenários com o rendimento da renda fixa.

**Live:** https://rivascode-ops.github.io/Calc-Roi

## O que calcula

| Métrica | Descrição |
|---------|-----------|
| Lucro mensal | Faturamento − custos − pró-labore − depreciação |
| ROI mensal | Lucro ÷ investimento |
| Payback | Meses para recuperar o CAPEX |
| Custo de oportunidade | vs. renda fixa (% a.a.) |
| Cenários | Pessimista (−25% clientes), base, otimista (+25%) |

Veredito: **Atrativo** · **Atenção** · **Melhor deixar aplicado** · **Prejuízo**

## Como usar (web)

1. Abra `index.html` ou o GitHub Pages
2. Preencha investimento, clientes, ticket, custos e taxa de renda fixa
3. *(Opcional)* Pró-labore, equipamentos e vida útil
4. Veja resultado base + 3 cenários

## Como usar (CLI Python)

```bash
cd 02_APPS/Calc-Roi
python calc_roi.py
```

## Testes

```bash
python -m pytest test_calc_engine.py -q
```

## Estrutura

| Arquivo | Função |
|---------|--------|
| `index.html` | UI V2 |
| `calc-engine.js` | Motor (browser) |
| `app.js` | DOM e interação |
| `calc_engine.py` | Motor (Python) |
| `calc_roi.py` | CLI interativo |
| `test_calc_engine.py` | Testes unitários |

## Roadmap

- [x] V1 — 5 campos, veredito instantâneo
- [x] V2 — Depreciação, pró-labore, cenários, motor unificado
- [ ] V3 — VPL, TIR, relatório PDF

## Stack

HTML + CSS + JavaScript (ES modules) · Python 3 · zero build step · funciona offline

# Raio-X de Negócios + Gestão Escolar (Calc-Roi)

Calculadora de **ROI para negócios** e **sistema de inteligência de gestão escolar** (Picos do Saber).

**Live:** https://rivascode-ops.github.io/Calc-Roi

## Produtos

### ROI Negócios
Compare lucro mensal, payback e cenários com o rendimento da renda fixa.

### Picos do Saber — Gestão Escolar
Cadastre **uma vez** no **Painel Mestre**; todos os módulos calculam automaticamente:

| Módulo | Entrega |
|--------|---------|
| Viabilidade | Receita, custos, lucro, margem, semáforo |
| Capacidade | Turmas, salas, professoras, carga horária |
| Preço ideal | Custo real/aluno, planos com semáforo |
| ROI | Payback, ROI anual, gráfico acumulado |
| Cenários | Tabela + gráfico 10 / 30 / 50 alunos |
| Equilíbrio | Break-even + slider “e se a mensalidade for…” |

**Recursos v9:** dados salvos no navegador (`localStorage`), resumo executivo, gráficos Chart.js, export PDF.

## Como usar (web)

1. Abra `index.html`, `SERVIR.bat`, `scripts/servir.ps1` ou GitHub Pages
2. Aba **Picos do Saber** → preencha o **Painel Mestre**
3. Navegue pelos módulos — os dados persistem ao recarregar a página
4. **Copiar análise** ou **Baixar PDF** para apresentar ao sócio/contador

## Desenvolvimento

```bash
# Dependências Python (testes)
pip install -r requirements.txt

# Servidor local
python -m http.server 8080
# ou: scripts/servir.ps1  |  SERVIR.bat (Windows)

# CLI ROI
python calc_roi.py
```

**Cursor:** regras em `.cursor/rules/`, guia em `AGENTS.md`, MCP em `docs/MCP-SETUP.md`.

```bash
# Configurar MCP do projeto (v2 — dry-run + checklist primeiro)
node cursor-mcp-configurator-v2.js --servers filesystem,github,postgres,fetch,memory --project --dry-run --print-checklist
node cursor-mcp-configurator-v2.js --servers filesystem,github,postgres,fetch,memory --project --open-cursor --print-checklist
```

## Testes

```bash
python -m pytest test_calc_engine.py test_gestao_engine.py -q
```

## Estrutura

| Arquivo | Função |
|---------|--------|
| `index.html` | UI (ROI + Gestão) |
| `calc-engine.js` / `app.js` | Motor e UI ROI |
| `gestao-engine.js` | Motor central Picos |
| `gestao-app.js` | UI Painel Mestre + módulos |
| `gestao-storage.js` | Persistência localStorage |
| `gestao-charts.js` | Gráficos Chart.js |
| `gestao-export.js` | Exportação PDF |
| `test_gestao_engine.py` | Testes gestão escolar |

## Roadmap

- [x] V1 — ROI básico
- [x] V2 — Cenários, depreciação, comparativo renda fixa
- [x] V3 Gestão — Painel Mestre ERP, 6 módulos automáticos
- [x] V9 — localStorage, gráficos, PDF, resumo executivo
- [x] V10 (parcial) — cenários ROI salvos com nome
- [ ] V10 — VPL, TIR

## Stack

HTML + CSS + JavaScript vanilla · Chart.js + jsPDF (CDN) · Python 3 + pytest · zero build · GitHub Pages · CI (GitHub Actions)

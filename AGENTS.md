# Calc-Roi — guia para agentes

## O que é

SPA estática com calculadora de ROI e gestão escolar (Picos do Saber). Sem backend, sem build.

## Comandos úteis

```bash
# Servir localmente
python -m http.server 8080

# Testes (motores ativos)
python -m pytest test_calc_engine.py test_gestao_engine.py -q

# CLI ROI
python calc_roi.py
```

Windows: `SERVIR.bat` ou `scripts\servir.ps1`

## Onde mexer

| Tarefa | Arquivos |
|--------|----------|
| Lógica ROI | `calc-engine.js`, `calc_engine.py`, `test_calc_engine.py` |
| Lógica escola | `gestao-engine.js`, `test_gestao_engine.py` |
| UI ROI | `app.js`, `index.html` (#panel-roi) |
| UI gestão | `gestao-app.js`, `index.html` (#panel-gestao) |
| Gráficos / PDF | `gestao-charts.js`, `gestao-export.js` |
| Persistência | `gestao-storage.js` |
| Cenários ROI salvos | `roi-storage.js`, `app.js` |

## Regras Cursor

Ver `.cursor/rules/` — contexto do projeto, motores e testes.

## Não fazer sem pedido

- Migrar para React/Next.js ou adicionar bundler
- Reativar módulos legados `escola-*` / `preco-*`
- Adicionar backend ou banco de dados

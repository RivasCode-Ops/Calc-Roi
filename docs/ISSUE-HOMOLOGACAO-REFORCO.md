## Calc-Roi — Precificação Reforço · fase de homologação

### Estado
- [x] UI integrada (`reforco-app.js`, aba **Precificação Reforço**)
- [x] Engine modular (`reforco-pricing-engine.js`)
- [x] Config separada (`reforco-pricing.config.js` — valores de **exemplo**)
- [x] Checklist: [`docs/HOMOLOGACAO-REFORCO.md`](./docs/HOMOLOGACAO-REFORCO.md) (`054eafb`)
- [x] Templates: [`docs/TEMPLATE-STATUS-REFORCO.md`](./docs/TEMPLATE-STATUS-REFORCO.md) (`11a03ea`)

### Escopo congelado nesta fase
> **Não alterar** UI nem engine nesta homologação.  
> Próxima mudança permitida: **`reforco-pricing.config.js`** (tabela real), após PASS comercial.

### Demo
https://rivascode-ops.github.io/Calc-Roi/ → aba **Precificação Reforço**

> [!IMPORTANT]
> **Cenário 1 — valor correto**
>
> Ensino médio · individual · 2 aulas/semana · 60 min = **R$ 456,00/aluno**
>
> Motivo: 8 aulas/mês (2 × 4 semanas) → desconto **5%** sobre subtotal R$ 480,00.
>
> **Não usar R$ 480,00** como mensalidade final de referência.

---

### Cenários a executar

| # | Entrada | Esperado (config exemplo) |
|---|---------|---------------------------|
| 1 | EM · individual · 2 aulas/sem · 60 min | R$ 456,00/aluno (desconto 5%) |
| 2 | 1º–5º · trio · 3 aulas/sem · 60 min | R$ 237,60/aluno · receita turma R$ 712,80 |
| 3 | Aulas/semana = 0 ou vazio | "Revise os campos" · sem travar |
| 4 | Infantil · dupla · 1 aula/sem · 45 min | R$ 68,25/aluno (35×0,65×45/60×4) |
| 5 | Abas ROI + Picos do Saber | Sem regressão · console limpo (app) |

Detalhes: [`docs/HOMOLOGACAO-REFORCO.md`](./docs/HOMOLOGACAO-REFORCO.md)

---

### Resultado da homologação

| # | Cenário | Resultado | Observação |
|---|---------|-----------|------------|
| 1 | EM · individual · 2 aulas/sem | ☑ PASS ☐ FAIL | GitHub Pages · R$ 456,00 |
| 2 | 1º–5º · trio · 3 aulas/sem | ☑ PASS ☐ FAIL | R$ 237,60/aluno |
| 3 | Form inválido | ☑ PASS ☐ FAIL | Engine rejeita; UI estável |
| 4 | Infantil · dupla · 45 min | ☑ PASS ☐ FAIL | Expectativa doc corrigida → R$ 68,25 |
| 5 | Regressão ROI + Picos | ☐ PASS ☐ FAIL | Pendente validação manual |

**Validação comercial (negócio):** ☐ Valores fazem sentido ☐ Ajustar config

**Veredicto final:** ☐ **Homologado** ☐ Pendente config real ☐ Bug UI/engine

---

### Commits de referência

| Commit | Conteúdo |
|--------|----------|
| `6eff4af` | Config + engine + testes |
| `1c181a1` | UI aba Precificação Reforço |
| `054eafb` | Checklist homologação |
| `11a03ea` | Templates status/issue/PR |

---

### Após homologar
- [ ] Fechar issue com veredicto
- [ ] Atualizar `reforco-pricing.config.js` com tabela real (PR separado)
- [ ] Re-rodar cenários 1–4 com novos valores esperados

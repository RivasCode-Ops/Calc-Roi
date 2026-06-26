# Template — status / issue / comentário de PR

Copie a seção adequada ao canal. Atualize commit, link e fase conforme o projeto evoluir.

---

## Issue — abrir homologação (copiar corpo)

```markdown
## Calc-Roi — Precificação Reforço · fase de homologação

### Estado
- [x] UI integrada (`reforco-app.js`, aba **Precificação Reforço**)
- [x] Engine modular (`reforco-pricing-engine.js`)
- [x] Config separada (`reforco-pricing.config.js` — valores de exemplo)
- [x] Checklist versionado: `docs/HOMOLOGACAO-REFORCO.md` (`054eafb`)

### Escopo congelado nesta fase
> **Não alterar** UI nem engine. Apenas homologar e, depois, trocar a config.

### Próximo passo
- [ ] Executar os **5 cenários** do checklist
- [ ] Validar aderência **comercial** dos valores
- [ ] Se OK → atualizar **somente** `reforco-pricing.config.js` com tabela real

**Demo:** https://rivascode-ops.github.io/Calc-Roi/ → aba *Precificação Reforço*

> [!IMPORTANT]
> **Cenário 1 — valor correto**
> Ensino médio · individual · 2 aulas/semana = **R$ 456,00/aluno**
> (8 aulas/mês → desconto 5% sobre R$ 480,00).
> **Não usar R$ 480,00** como referência de mensalidade final.

### Commits de referência
| Commit | Conteúdo |
|--------|----------|
| `1c181a1` | UI da aba Precificação Reforço |
| `6eff4af` | Config + engine + testes |
| `054eafb` | Checklist de homologação |

### Resultado da homologação
Preencher após os testes:

| # | Cenário | Resultado | Observação |
|---|---------|-----------|------------|
| 1 | EM · individual · 2 aulas/sem | ☐ PASS ☐ FAIL | |
| 2 | 1º–5º · trio · 3 aulas/sem | ☐ PASS ☐ FAIL | |
| 3 | Form inválido | ☐ PASS ☐ FAIL | |
| 4 | Infantil · dupla · 45 min | ☐ PASS ☐ FAIL | |
| 5 | Regressão ROI + Picos | ☐ PASS ☐ FAIL | |

**Veredicto:** ☐ Homologado ☐ Pendente ajuste config ☐ Bug UI/engine
```

---

## Comentário de PR — entrega de integração

```markdown
## Summary
Integra a aba **Precificação Reforço** reaproveitando layout e padrões existentes do Calc-Roi.

## Reaproveitado
- CSS / card / abas / `.result` / `.linha`
- `CalcEngine.fmtMoeda`
- Padrão de validação do `app.js`

## Novo
- `reforco-pricing.config.js` · `reforco-pricing-engine.js` · `reforco-app.js`
- Checklist: `docs/HOMOLOGACAO-REFORCO.md`

## Test plan
- [ ] Cenários 1–5 em `docs/HOMOLOGACAO-REFORCO.md`
- [ ] Cenário 1 = **R$ 456,00** (não R$ 480,00)
- [ ] ROI VPL/TIR e Picos do Saber sem regressão

## Fora de escopo deste PR
Alteração de valores comerciais → PR futuro só em `reforco-pricing.config.js`
```

---

## Status curto — README / wiki / pin

```markdown
**Fase:** homologação · Precificação Reforço  
**Checklist:** [`docs/HOMOLOGACAO-REFORCO.md`](./HOMOLOGACAO-REFORCO.md)  
**Demo:** https://rivascode-ops.github.io/Calc-Roi/  
**Próximo:** validar 5 cenários → tabela real em `reforco-pricing.config.js`
```

---

## Cursor — contexto do agente

```txt
Calc-Roi: aba Precificação Reforço em homologação.
NÃO refatorar UI/engine. Seguir docs/HOMOLOGACAO-REFORCO.md.
Única mudança permitida agora: reforco-pricing.config.js (tabela real).
Cenário 1 correto: R$ 456,00/aluno (desconto 5% em 8 aulas/mês).
Refs: 1c181a1 UI · 6eff4af engine · 054eafb checklist
```

---

## WhatsApp / status rápido

```
Calc-Roi — Precificação Reforço em homologação ✅
Estrutura pronta. Testar 5 cenários do checklist.
Depois: só trocar tabela de preços no config.
https://rivascode-ops.github.io/Calc-Roi/
Cenário 1 = R$ 456/aluno (não R$ 480)
```

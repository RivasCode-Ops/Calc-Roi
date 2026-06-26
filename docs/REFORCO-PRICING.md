# Precificação Reforço Escolar — config + engine

Módulo separado da UI. Ajuste preços em `reforco-pricing.config.js`; cálculos em `reforco-pricing-engine.js`.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `reforco-pricing.config.js` | Segmentos, modalidades, descontos, semanas/mês |
| `reforco-pricing-engine.js` | Funções puras (`calcularPrecoReforco`) |
| `test_reforco_pricing_engine.py` | Testes espelho |
| `docs/PROMPT-PRECIFICACAO-REFORCO.md` | Prompt Cursor para plugar na UI |

## Valores atuais

**Template de exemplo** — substitua pela tabela real da escola:

| Segmento | R$/hora |
|----------|---------|
| Infantil 4-5 | 35 |
| 1º ao 5º | 40 |
| 6º ao 9º | 50 |
| Ensino médio | 60 |

| Modalidade | Fator/aluno |
|------------|-------------|
| Individual | 1,00 |
| Dupla | 0,65 |
| Trio | 0,55 |
| Grupo | 0,45 |

| Aulas/mês | Desconto |
|-----------|----------|
| 4 | 0% |
| 8+ | 5% |
| 12+ | 10% |

## Fórmula

```
valorHoraAluno = valorHoraBase × fatorModalidade
valorAula      = valorHoraAluno × (duracaoMin / 60)
aulasMes       = aulasSemana × semanasPorMes
subtotal       = valorAula × aulasMes
mensalidade    = subtotal × (1 - desconto%)
```

## Teste rápido (console)

Carregue no HTML (antes de usar):

```html
<script src="reforco-pricing.config.js"></script>
<script src="reforco-pricing-engine.js"></script>
```

```javascript
ReforcoPricingEngine.calcularPrecoReforco({
  segmentoId: 'fundamental_1_5',
  modalidadeId: 'individual',
  aulasPorSemana: 2,
  duracaoMinutos: 60,
});
```

## Onde plugar no Calc-Roi

✅ **UI integrada** — aba **Precificação Reforço** em `index.html` + `reforco-app.js`.

Arquivos da integração:

| Arquivo | Função |
|---------|--------|
| `index.html` | Aba, formulário, área de resultado |
| `reforco-app.js` | Liga form → `calcularPrecoReforco()` |

## Prompt curto (Cursor)

```txt
Plugue reforco-pricing.config.js + reforco-pricing-engine.js na UI do Calc-Roi:
nova aba "Precificação Reforço", reutilize CSS/máscaras de index.html.
Form: segmento, modalidade, aulas/semana, duração.
Resultado: valor/aula, aulas/mês, mensalidade/aluno, observações.
Validação como app.js ("Revise os campos").
Não altere gestao-* nem ROI até eu pedir.
```

## Atualizar preços reais

Edite só `reforco-pricing.config.js` e rode `pytest test_reforco_pricing_engine.py` se ajustar regras.

# Homologação — Precificação Reforço (Calc-Roi)

**URL:** https://rivascode-ops.github.io/Calc-Roi/ → aba **Precificação Reforço**  
**Config:** `reforco-pricing.config.js`  
**Branch:** `simulacao-precos-reforco` — **simulação de mercado**, não tabela oficial  
**Referência técnica homologada:** `master` (issue #1 fechada)

---

## Antes de testar

- [ ] Ctrl+F5 (cache limpo)
- [ ] F12 → Console aberto
- [ ] Confirmar que selects de segmento/modalidade carregaram

---

## Cenários obrigatórios

### 1 — Ensino médio · individual · 2 aulas/sem · 60 min

| Campo | Valor |
|-------|-------|
| Segmento | Ensino médio (R$ 70/h) |
| Modalidade | Individual |
| Aulas/semana | 2 |
| Duração | 60 min |

**Esperado (simulação mercado):**

| Métrica | Valor |
|---------|-------|
| Valor/aula | R$ 70,00 |
| Aulas/mês | 8 (2 × 4 semanas) |
| Subtotal | R$ 560,00 |
| Desconto | 5% (faixa 8+ aulas) |
| **Mensalidade/aluno** | **R$ 532,00** |

- [ ] PASS — revalidar nesta branch (master: R$ 456,00 homologado)

---

### 2 — 1º ao 5º · trio · 3 aulas/sem · 60 min

| Campo | Valor |
|-------|-------|
| Segmento | 1º ao 5º ano |
| Modalidade | Trio |
| Aulas/semana | 3 |
| Duração | 60 min |

**Esperado:**

| Métrica | Valor |
|---------|-------|
| Valor/aula | R$ 30,00 (50 × 0,60) |
| Aulas/mês | 12 |
| Desconto | 10% |
| **Mensalidade/aluno** | **R$ 324,00** |
| Receita turma (3 alunos ref.) | R$ 972,00 |

- [ ] PASS — revalidar nesta branch (master: R$ 237,60 homologado)

---

### 3 — Validação (form inválido)

- [x] Aulas/semana = 0 ou vazio → **"Revise os campos"**, página estável
- [x] Duração = 0 → idem (via engine)
- [x] Sem travar browser / sem loop no console

---

### 4 — Infantil · dupla · 1 aula/sem · 45 min

| Métrica | Esperado |
|---------|----------|
| Valor/aula | R$ 23,63 (45 × 0,70 × 45/60) |
| Aulas/mês | 4 (1 × 4 semanas) |
| Desconto | nenhum (< 8 aulas/mês) |
| **Mensalidade/aluno** | **R$ 94,50** |

Fórmula: `45 × 0,70 × (45/60) × 4 = 94,50`

- [ ] PASS — revalidar nesta branch (master: R$ 68,25 homologado)

---

### 5 — Console e abas adjacentes

- [x] Aba **ROI Negócios** ainda calcula VPL/TIR (homologado em master)
- [x] Aba **Picos do Saber** abre sem erro (homologado em master)
- [x] Console sem erro vermelho **da aplicação** (homologado em master)

---

## Veredicto

| Área | Status |
|------|--------|
| Cálculo / descontos | ☐ OK ☐ Pendente |
| Validação | ☐ OK ☐ Pendente |
| UI / abas | ☐ OK ☐ Pendente |
| Valores comerciais (negócio) | ☐ OK ☑ Simulação em discussão |

**Homologação técnica (master):** concluída — issue #1.  
**Esta branch:** validar impacto da simulação de mercado antes da tabela oficial.

---

## Após homologar

1. Substituir valores em `reforco-pricing.config.js` pela tabela real da escola  
2. Re-rodar só a coluna "Esperado" deste checklist  
3. (Opcional) Cenários salvos em localStorage — não implementado na v1  

---

## Registro técnico (copiar se precisar)

> A integração da UI foi concluída com reaproveitamento consistente da base existente. A aba Precificação Reforço está conectada à engine modular; homologação pendente apenas de validação comercial dos valores em `reforco-pricing.config.js`.

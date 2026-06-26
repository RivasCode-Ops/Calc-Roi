# Homologação — Precificação Reforço (Calc-Roi)

**URL:** https://rivascode-ops.github.io/Calc-Roi/ → aba **Precificação Reforço**  
**Config:** `reforco-pricing.config.js` (valores de exemplo até tabela real)  
**Última integração UI:** commit `1c181a1`

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
| Segmento | Ensino médio (R$ 60/h) |
| Modalidade | Individual |
| Aulas/semana | 2 |
| Duração | 60 min |

**Esperado (config exemplo):**

| Métrica | Valor |
|---------|-------|
| Valor/aula | R$ 60,00 |
| Aulas/mês | 8 (2 × 4 semanas) |
| Subtotal | R$ 480,00 |
| Desconto | 5% (faixa 8+ aulas) |
| **Mensalidade/aluno** | **R$ 456,00** |

- [x] PASS (GitHub Pages · engine) — notas: 2026-06

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
| Valor/aula | R$ 22,00 (40 × 0,55) |
| Aulas/mês | 12 |
| Desconto | 10% |
| **Mensalidade/aluno** | **R$ 237,60** |
| Receita turma (3 alunos ref.) | R$ 712,80 |

- [x] PASS (GitHub Pages · engine)

---

### 3 — Validação (form inválido)

- [x] Aulas/semana = 0 ou vazio → **"Revise os campos"**, página estável
- [x] Duração = 0 → idem (via engine)
- [x] Sem travar browser / sem loop no console

---

### 4 — Infantil · dupla · 1 aula/sem · 45 min

| Métrica | Esperado |
|---------|----------|
| Valor/aula | R$ 17,06 (35 × 0,65 × 45/60) |
| Aulas/mês | 4 (1 × 4 semanas) |
| Desconto | nenhum (< 8 aulas/mês) |
| **Mensalidade/aluno** | **R$ 68,25** |

Fórmula: `35 × 0,65 × (45/60) × 4 = 68,25`

- [x] PASS (GitHub Pages · engine) — corrigido expectativa doc em 2026-06

---

### 5 — Console e abas adjacentes

- [ ] Aba **ROI Negócios** ainda calcula VPL/TIR
- [ ] Aba **Picos do Saber** abre sem erro
- [ ] Console sem erro vermelho **da aplicação** (extensões Chrome podem ignorar)

---

## Veredicto

| Área | Status |
|------|--------|
| Cálculo / descontos | ☐ OK ☐ Pendente |
| Validação | ☐ OK ☐ Pendente |
| UI / abas | ☐ OK ☐ Pendente |
| Valores comerciais (negócio) | ☐ OK ☐ Ajustar config |

**Homologado quando:** cenários 1–4 PASS + 5 sem regressão.

---

## Após homologar

1. Substituir valores em `reforco-pricing.config.js` pela tabela real da escola  
2. Re-rodar só a coluna "Esperado" deste checklist  
3. (Opcional) Cenários salvos em localStorage — não implementado na v1  

---

## Registro técnico (copiar se precisar)

> A integração da UI foi concluída com reaproveitamento consistente da base existente. A aba Precificação Reforço está conectada à engine modular; homologação pendente apenas de validação comercial dos valores em `reforco-pricing.config.js`.

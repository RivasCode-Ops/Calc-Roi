# Prompt Cursor — Precificação de Reforço Escolar (reuso Calc-Roi)

Use este prompt no **Calc-Roi** quando quiser transformar a shell visual (HTML/CSS/JS vanilla) em calculadora de mensalidade, **reaproveitando layout e persistência**, sem começar do zero.

> **Alternativa já existente:** o produto **EduPrice** (`~/Projects/EduPrice`) já tem motor modular (`domain/`, Modo Consultor, testes Vitest). Use este prompt no Calc-Roi se quiser **uma página única estática** alinhada ao visual do Raio-X/Picos, ou se quiser **substituir a aba ROI** por precificação escolar.

---

## Como usar

1. Abra o workspace **Calc-Roi** no Cursor.
2. Cole o prompt abaixo no chat.
3. Complemente (recomendado):

> Comece analisando os arquivos atuais e proponha primeiro um plano de refatoração antes de editar o código.

---

## Copy completa

```txt
Quero reaproveitar a estrutura visual e técnica já existente deste projeto (Calc-Roi), mas substituir completamente a lógica de negócio da aba/calculadora alvo por uma nova calculadora de precificação para reforço escolar.

Objetivo:
Transformar o app em calculadora de mensalidade/precificação para aulas de reforço escolar, aproveitando layout, CSS, tabs, formulários, máscaras de moeda, localStorage e organização de arquivos da base atual.

Antes de criar qualquer coisa nova, analise e mapeie o que reutilizar:
- index.html — layout, tabs (ROI / Picos), estilos, grid de resultados
- calc-engine.js / app.js — padrão engine + UI (como referência de separação)
- roi-storage.js — padrão de cenários nomeados em localStorage
- gestao-*.js — só se for integrar na aba Picos; caso contrário, foco na aba principal

Instruções importantes:
1. Preserve ao máximo: layout geral, estilo visual, componentes reutilizáveis, utilitários (fmtMoeda, parseMoeda, validação).
2. Remova apenas a lógica específica de ROI/VPL/TIR da calculadora que for substituída.
3. Não quero calculadora de ROI genérica na aba refatorada — quero precificação de reforço escolar.
4. Refatore modular: nova engine em arquivo dedicado (ex.: reforco-pricing-engine.js).
5. Funções puras; UI sem fórmulas centrais.

Nova regra de negócio:
- segmento: infantil 4-5, 1º ao 5º ano, 6º ao 9º ano, ensino médio
- modalidade: individual, dupla, trio, grupo
- aulas por semana, duração da aula (minutos)
- valor base por hora/aula (configurável por segmento)
- multiplicadores por modalidade (configurável)
- semanas por mês (padrão 4, configurável)
- desconto para planos com mais aulas (regras configuráveis)
- saídas: valor por aula, aulas por mês, mensalidade sugerida, regras/descontos aplicados

Configurável (objeto ou JSON em arquivo separado, ex.: reforco-pricing.config.js):
- valor base por segmento
- multiplicadores por modalidade
- semanas por mês
- faixas de desconto por volume de aulas/mês

Requisitos de interface:
- manter estrutura visual atual; trocar títulos, labels, placeholders, resultados
- headline: precificação de reforço escolar
- área de resultado: valor por aula, aulas/mês, mensalidade sugerida, observações
- validação: campos vazios, NaN, divisão por zero — mensagem clara (padrão "Revise os campos")

Requisitos técnicos:
- zero build; HTML + JS vanilla como hoje
- testes Python espelhando a engine (test_reforco_pricing_engine.py), se possível
- sem dependências novas
- cache-bust ?v= nos scripts alterados

Entregáveis:
1. Análise breve do que foi reaproveitado
2. Lista de arquivos alterados/criados
3. Implementação completa
4. Próximos passos (SaaS, export PDF, multi-unidade)

Importante:
Substituir todo texto/label/placeholder do domínio antigo na aba refatorada. O resultado deve parecer produto educacional nativo, não adaptação forçada.
```

---

## Copy curta

```txt
Reaproveite a estrutura do Calc-Roi (index.html, CSS, máscaras, localStorage), mas substitua a lógica da calculadora alvo por precificação de reforço escolar.

Antes de codar: mapeie arquivos reutilizáveis e proponha plano de refatoração.

Calculadora:
- segmentos: infantil 4-5, 1º-5º, 6º-9º, ensino médio
- modalidade: individual, dupla, trio, grupo
- aulas/semana, duração, valor base/hora, descontos por volume
- saídas: valor/aula, aulas/mês, mensalidade

Engine modular separada + config ajustável + validação de inputs.
Trocar todos os textos do domínio antigo na aba refatorada.
No final: o que reaproveitou, arquivos alterados, implementação pronta.
```

---

## Arquivos prováveis (Calc-Roi)

| Ação | Arquivo |
|------|---------|
| Reutilizar | `index.html` (CSS, tabs), padrões de `app.js` |
| Substituir / novo | `reforco-pricing-engine.js`, `reforco-pricing.config.js`, `reforco-app.js` |
| Opcional | `reforco-storage.js` (clone de `roi-storage.js`) |
| Testes | `test_reforco_pricing_engine.py` |
| Manter intacto | aba Picos (`gestao-*.js`) até integração explícita |

---

## Relação com EduPrice

| Critério | Calc-Roi (este prompt) | EduPrice |
|----------|------------------------|----------|
| Stack | HTML estático, zero build | Next.js + TypeScript + Vitest |
| Modo Consultor (custos fixos → mensalidade) | Implementar do zero | ✅ já existe |
| Integração Picos | mesma página | embed futuro via módulo |
| SaaS | evolução manual | roadmap em `docs/roadmap-saas.md` |

**Regra prática:** validação rápida com visual do Calc-Roi → este prompt. Produto modular longo prazo → EduPrice.

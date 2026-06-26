/**
 * TEMPLATE — tabela comercial (Projeto 2)
 *
 * Este arquivo NÃO é carregado pelo site. Serve só para você preencher
 * os números reais e depois copiar o bloco REFORCO_PRICING_CONFIG para
 * reforco-pricing.config.js (commit + push → GitHub Pages).
 *
 * Como usar:
 * 1. Substitua cada ___ pelo valor da escola.
 * 2. Não altere os IDs (infantil_4_5, dupla, etc.) — a engine depende deles.
 * 3. Copie o objeto para reforco-pricing.config.js.
 * 4. Revalide cenários 1–4 em docs/HOMOLOGACAO-REFORCO.md (coluna Esperado).
 */
const REFORCO_PRICING_CONFIG = {
  // Quantas semanas entram no mês? (ex.: 4)
  semanasPorMes: ___,

  // Duração padrão quando o formulário não informar minutos (ex.: 60)
  duracaoPadraoMinutos: ___,

  // Valor HORA BASE por segmento (R$/h antes do fator da modalidade)
  segmentos: {
    infantil_4_5: {
      label: 'Infantil 4-5 anos',
      valorHoraBase: ___, // R$/h
    },
    fundamental_1_5: {
      label: '1º ao 5º ano',
      valorHoraBase: ___, // R$/h
    },
    fundamental_6_9: {
      label: '6º ao 9º ano',
      valorHoraBase: ___, // R$/h
    },
    ensino_medio: {
      label: 'Ensino médio',
      valorHoraBase: ___, // R$/h
    },
  },

  /**
   * fatorPorAluno: % do valorHoraBase cobrado POR ALUNO na turma
   * alunosReferencia: tamanho típico (informativo; não entra na fórmula)
   *
   * Exemplo: dupla 0,65 → cada aluno paga 65% da hora base do segmento.
   */
  modalidades: {
    individual: {
      label: 'Individual',
      fatorPorAluno: ___, // ex.: 1.0
      alunosReferencia: 1,
    },
    dupla: {
      label: 'Dupla',
      fatorPorAluno: ___, // ex.: 0.65
      alunosReferencia: 2,
    },
    trio: {
      label: 'Trio',
      fatorPorAluno: ___, // ex.: 0.55
      alunosReferencia: 3,
    },
    grupo: {
      label: 'Grupo',
      fatorPorAluno: ___, // ex.: 0.45
      alunosReferencia: ___, // ex.: 6 — ajuste se a escola usar outro tamanho
    },
  },

  /**
   * Desconto sobre a mensalidade por aluno.
   * aulasNoMes = aulasPorSemana × semanasPorMes
   * Aplica a faixa com maior minAulas que ainda seja <= aulasNoMes.
   *
   * Mantenha sempre uma faixa minAulas: 0 com descontoPct: 0.
   */
  descontosPorAulasNoMes: [
    { minAulas: 0, descontoPct: 0, label: 'Sem desconto' },
    { minAulas: ___, descontoPct: ___, label: '___' }, // ex.: 8 aulas → 5%
    { minAulas: ___, descontoPct: ___, label: '___' }, // ex.: 12 aulas → 10%
    // Adicione mais faixas se a escola tiver (ordem crescente de minAulas)
  ],
};

// --- Referência rápida (fórmula da engine) ---
// valorHoraAluno = valorHoraBase × fatorPorAluno
// valorAula      = valorHoraAluno × (duracaoMin / 60)
// aulasMes       = aulasSemana × semanasPorMes
// mensalidade    = valorAula × aulasMes × (1 - descontoPct/100)

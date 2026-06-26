/**
 * Configuração de precificação — Reforço Escolar
 *
 * Ajuste valores aqui sem alterar a engine (reforco-pricing-engine.js).
 * Valores abaixo são EXEMPLO inicial — substitua pela tabela real da escola.
 */
const REFORCO_PRICING_CONFIG = {
  /** Semanas consideradas em um mês para cálculo de mensalidade */
  semanasPorMes: 4,

  /** Duração padrão da aula (minutos) quando o formulário não informar */
  duracaoPadraoMinutos: 60,

  segmentos: {
    infantil_4_5: {
      label: 'Infantil 4-5 anos',
      valorHoraBase: 35,
    },
    fundamental_1_5: {
      label: '1º ao 5º ano',
      valorHoraBase: 40,
    },
    fundamental_6_9: {
      label: '6º ao 9º ano',
      valorHoraBase: 50,
    },
    ensino_medio: {
      label: 'Ensino médio',
      valorHoraBase: 60,
    },
  },

  /**
   * fatorPorAluno: multiplicador sobre valorHoraBase por aluno na turma
   * alunosReferencia: tamanho típico da turma (informativo / receita total)
   */
  modalidades: {
    individual: {
      label: 'Individual',
      fatorPorAluno: 1.0,
      alunosReferencia: 1,
    },
    dupla: {
      label: 'Dupla',
      fatorPorAluno: 0.65,
      alunosReferencia: 2,
    },
    trio: {
      label: 'Trio',
      fatorPorAluno: 0.55,
      alunosReferencia: 3,
    },
    grupo: {
      label: 'Grupo',
      fatorPorAluno: 0.45,
      alunosReferencia: 6,
    },
  },

  /**
   * Desconto sobre a mensalidade por aluno conforme total de aulas no mês.
   * Usa a faixa com maior minAulas que ainda seja <= aulas no mês.
   */
  descontosPorAulasNoMes: [
    { minAulas: 0, descontoPct: 0, label: 'Sem desconto' },
    { minAulas: 8, descontoPct: 5, label: '5% (8+ aulas/mês)' },
    { minAulas: 12, descontoPct: 10, label: '10% (12+ aulas/mês)' },
  ],
};

if (typeof window !== 'undefined') {
  window.ReforcoPricingConfig = REFORCO_PRICING_CONFIG;
}

if (typeof module !== 'undefined') {
  module.exports = { REFORCO_PRICING_CONFIG };
}

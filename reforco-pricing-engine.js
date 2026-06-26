/** Motor de precificação — Reforço Escolar (funções puras) */

function getConfig() {
  return (
    (typeof window !== 'undefined' && window.ReforcoPricingConfig) ||
    (typeof REFORCO_PRICING_CONFIG !== 'undefined' && REFORCO_PRICING_CONFIG) ||
    {}
  );
}

function listarSegmentos(config) {
  const cfg = config || getConfig();
  return Object.entries(cfg.segmentos || {}).map(([id, s]) => ({
    id,
    label: s.label,
    valorHoraBase: s.valorHoraBase,
  }));
}

function listarModalidades(config) {
  const cfg = config || getConfig();
  return Object.entries(cfg.modalidades || {}).map(([id, m]) => ({
    id,
    label: m.label,
    fatorPorAluno: m.fatorPorAluno,
    alunosReferencia: m.alunosReferencia,
  }));
}

function resolverDesconto(aulasNoMes, config) {
  const cfg = config || getConfig();
  const faixas = [...(cfg.descontosPorAulasNoMes || [])].sort(
    (a, b) => b.minAulas - a.minAulas
  );
  const faixa = faixas.find((f) => aulasNoMes >= f.minAulas) || {
    descontoPct: 0,
    label: 'Sem desconto',
  };
  return faixa;
}

function validarEntradaReforco(entrada, config) {
  const cfg = config || getConfig();
  const faltando = [];

  if (!entrada.segmentoId || !cfg.segmentos?.[entrada.segmentoId]) {
    faltando.push('segmento');
  }
  if (!entrada.modalidadeId || !cfg.modalidades?.[entrada.modalidadeId]) {
    faltando.push('modalidade');
  }
  if (!Number.isFinite(entrada.aulasPorSemana) || entrada.aulasPorSemana <= 0) {
    faltando.push('aulas por semana');
  }
  const duracao =
    entrada.duracaoMinutos ??
    cfg.duracaoPadraoMinutos ??
    60;
  if (!Number.isFinite(duracao) || duracao <= 0) {
    faltando.push('duração da aula');
  }

  return { ok: faltando.length === 0, faltando, duracaoMinutos: duracao };
}

/**
 * @param {object} entrada
 * @param {string} entrada.segmentoId
 * @param {string} entrada.modalidadeId
 * @param {number} entrada.aulasPorSemana
 * @param {number} [entrada.duracaoMinutos]
 * @param {object} [config]
 */
function calcularPrecoReforco(entrada, config) {
  const cfg = config || getConfig();
  const validacao = validarEntradaReforco(entrada, cfg);
  if (!validacao.ok) {
    return {
      ok: false,
      faltando: validacao.faltando,
      erro: 'Campos inválidos ou faltando: ' + validacao.faltando.join(', '),
    };
  }

  const segmento = cfg.segmentos[entrada.segmentoId];
  const modalidade = cfg.modalidades[entrada.modalidadeId];
  const semanas = cfg.semanasPorMes ?? 4;
  const duracaoMin = validacao.duracaoMinutos;
  const horasPorAula = duracaoMin / 60;

  const valorHoraPorAluno = segmento.valorHoraBase * modalidade.fatorPorAluno;
  const valorPorAula = valorHoraPorAluno * horasPorAula;
  const aulasPorMes = entrada.aulasPorSemana * semanas;
  const subtotalMensal = valorPorAula * aulasPorMes;

  const faixaDesconto = resolverDesconto(aulasPorMes, cfg);
  const descontoPct = faixaDesconto.descontoPct ?? 0;
  const valorDesconto = subtotalMensal * (descontoPct / 100);
  const mensalidadePorAluno = subtotalMensal - valorDesconto;

  const alunos = modalidade.alunosReferencia ?? 1;
  const receitaTurmaMensal = mensalidadePorAluno * alunos;

  const observacoes = [
    `Segmento: ${segmento.label} (base R$ ${segmento.valorHoraBase}/h)`,
    `Modalidade: ${modalidade.label} (${Math.round(modalidade.fatorPorAluno * 100)}% do valor base por aluno)`,
    `${entrada.aulasPorSemana} aula(s)/semana × ${semanas} semanas = ${aulasPorMes} aulas/mês`,
    `Duração: ${duracaoMin} min (${horasPorAula.toFixed(2).replace('.', ',')} h/aula)`,
    faixaDesconto.descontoPct
      ? `Desconto aplicado: ${faixaDesconto.label}`
      : 'Sem desconto por volume',
  ];

  return {
    ok: true,
    segmento: segmento.label,
    modalidade: modalidade.label,
    valorHoraPorAluno,
    valorPorAula,
    aulasPorSemana: entrada.aulasPorSemana,
    aulasPorMes,
    semanasPorMes: semanas,
    duracaoMinutos: duracaoMin,
    subtotalMensal,
    descontoPct,
    valorDesconto,
    mensalidadePorAluno,
    alunosReferencia: alunos,
    receitaTurmaMensal,
    observacoes,
    faixaDesconto: faixaDesconto.label,
  };
}

const ReforcoPricingEngine = {
  getConfig,
  listarSegmentos,
  listarModalidades,
  resolverDesconto,
  validarEntradaReforco,
  calcularPrecoReforco,
};

if (typeof window !== 'undefined') {
  window.ReforcoPricingEngine = ReforcoPricingEngine;
}

if (typeof module !== 'undefined') {
  module.exports = ReforcoPricingEngine;
}

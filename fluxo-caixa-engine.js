/** Motor — Fluxo de Caixa mensal (Picos do Saber) */

function parsePct(str) {
  if (str == null || str === '') return 0;
  const s = String(str).replace('%', '').trim().replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * @param {HTMLElement} root — painel #sub-fluxo-caixa ou #panel-gestao
 * @param {object} [parseMoeda] — window.CalcEngine.parseMoeda
 */
function lerEntradaFluxoCaixa(root, parseMoeda) {
  const pm = parseMoeda || ((v) => parseFloat(String(v).replace(/\D/g, '')) / 100 || 0);
  const el = (id) => root.querySelector('#' + id);

  return {
    saldoInicial: pm(el('fc_saldo_inicial')?.value),
    inadimplenciaPct: parsePct(el('fc_inadimplencia_pct')?.value),
    evasaoPct: parsePct(el('fc_evasao_pct')?.value),
    investimentosMes: pm(el('fc_investimentos_mes')?.value),
    outrosEntradas: pm(el('fc_outros_entradas')?.value),
    outrosSaidas: pm(el('fc_outros_saidas')?.value),
  };
}

/**
 * @param {object} entrada
 * @param {number} entrada.alunosAtuais
 * @param {number} entrada.mensalidade
 * @param {number} entrada.folhaTotal
 * @param {number} entrada.custosFixosTotal
 * @param {number} entrada.prolabore
 * @param {number} entrada.saldoInicial
 * @param {number} entrada.inadimplenciaPct
 * @param {number} entrada.evasaoPct
 * @param {number} entrada.investimentosMes
 * @param {number} entrada.outrosEntradas
 * @param {number} entrada.outrosSaidas
 */
function calcularFluxoCaixaMensal(entrada) {
  const alunos = Math.max(0, entrada.alunosAtuais || 0);
  const mensalidade = Math.max(0, entrada.mensalidade || 0);
  const evasaoPct = Math.min(100, Math.max(0, entrada.evasaoPct || 0));
  const inadimplenciaPct = Math.min(100, Math.max(0, entrada.inadimplenciaPct || 0));

  const receitaBruta = alunos * mensalidade;
  const alunosPagantes = alunos * (1 - evasaoPct / 100);
  const receitaBrutaAjustada = alunosPagantes * mensalidade;
  const perdaInadimplencia = receitaBrutaAjustada * (inadimplenciaPct / 100);
  const receitaLiquidaMensalidades = receitaBrutaAjustada - perdaInadimplencia;

  const outrosEntradas = entrada.outrosEntradas || 0;
  const entradasTotais = receitaLiquidaMensalidades + outrosEntradas;

  const saidasOperacionais =
    (entrada.folhaTotal || 0) +
    (entrada.custosFixosTotal || 0) +
    (entrada.prolabore || 0);
  const investimentosMes = entrada.investimentosMes || 0;
  const outrosSaidas = entrada.outrosSaidas || 0;
  const saidasTotais = saidasOperacionais + investimentosMes + outrosSaidas;

  const fluxoMes = entradasTotais - saidasTotais;
  const saldoInicial = entrada.saldoInicial || 0;
  const saldoFinal = saldoInicial + fluxoMes;

  return {
    receitaBruta,
    alunosPagantes,
    receitaBrutaAjustada,
    perdaInadimplencia,
    receitaLiquidaMensalidades,
    entradasTotais,
    saidasOperacionais,
    investimentosMes,
    outrosSaidas,
    saidasTotais,
    fluxoMes,
    saldoInicial,
    saldoFinal,
    veredito: vereditoFluxoCaixa(saldoFinal, fluxoMes),
  };
}

function vereditoFluxoCaixa(saldoFinal, fluxoMes) {
  if (saldoFinal < 0) {
    return {
      texto: 'Caixa negativo — risco alto',
      semaforo: 'vermelho',
    };
  }
  if (fluxoMes < 0) {
    return {
      texto: 'Queimando caixa — atenção',
      semaforo: 'amarelo',
    };
  }
  return {
    texto: 'Caixa crescendo — saudável',
    semaforo: 'verde',
  };
}

/** Combina Painel Mestre (gestão) + campos da sub-aba. */
function calcularFluxoCaixaDoMestre(mestre, totaisMestreFn, fcEntrada) {
  const totais = totaisMestreFn(mestre);
  return calcularFluxoCaixaMensal({
    alunosAtuais: mestre.capacidade.alunosAtuais,
    mensalidade: mestre.precos.mensalidadePadrao,
    folhaTotal: totais.folhaSalarial,
    custosFixosTotal: totais.fixosTotal,
    prolabore: mestre.metas.prolaboreSocio,
    ...fcEntrada,
  });
}

const FluxoCaixaEngine = {
  parsePct,
  lerEntradaFluxoCaixa,
  calcularFluxoCaixaMensal,
  vereditoFluxoCaixa,
  calcularFluxoCaixaDoMestre,
};

if (typeof window !== 'undefined') {
  window.FluxoCaixaEngine = FluxoCaixaEngine;
}

if (typeof module !== 'undefined') {
  module.exports = FluxoCaixaEngine;
}

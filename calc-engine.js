/** Motor de cálculo — Raio-X de Negócios V2 (espelha calc_engine.py) */

const CENARIO_FATOR = {
  pessimista: 0.75,
  base: 1.0,
  otimista: 1.25,
};

/**
 * @param {object} entrada
 * @param {'pessimista'|'base'|'otimista'} cenario
 */
function calcularCenario(entrada, cenario = 'base') {
  const fator = CENARIO_FATOR[cenario] ?? 1;
  const clientes = Math.max(0, Math.round(entrada.numeroClientes * fator));
  const fat = clientes * entrada.ticketMedio;

  const dep =
    entrada.valorEquipamentos > 0 && entrada.vidaUtilMeses > 0
      ? entrada.valorEquipamentos / entrada.vidaUtilMeses
      : 0;

  const lucro =
    fat - entrada.custosMensais - entrada.prolaboreMensal - dep;

  const inv = entrada.investimentoTotal;
  const roi = inv > 0 ? (lucro / inv) * 100 : 0;
  const payback = lucro > 0 ? inv / lucro : null;

  const selicMensalPct = entrada.taxaRendaFixaAnual / 12;
  const rf = inv > 0 ? inv * (selicMensalPct / 100) : 0;
  const rfAnual = inv > 0 ? inv * (entrada.taxaRendaFixaAnual / 100) : 0;
  const diff = lucro - rf;
  const lucroAnual = lucro * 12;
  const roiAnual = inv > 0 ? (lucroAnual / inv) * 100 : 0;
  const depAnual = dep * 12;

  let veredito;
  let semaforo;
  if (lucro <= 0) {
    veredito = 'Prejuízo';
    semaforo = 'vermelho';
  } else if (diff >= 0 && roi >= selicMensalPct * 2) {
    veredito = 'Atrativo';
    semaforo = 'verde';
  } else if (diff >= 0) {
    veredito = 'Atenção';
    semaforo = 'amarelo';
  } else {
    veredito = 'Melhor deixar aplicado';
    semaforo = 'vermelho';
  }

  return {
    cenario,
    clientes,
    faturamentoMensal: fat,
    depreciacaoMensal: dep,
    depreciacaoAnual: depAnual,
    lucroMensal: lucro,
    lucroAnual,
    roiMensalPercentual: roi,
    roiAnualPercentual: roiAnual,
    paybackMeses: payback,
    rendimentoPassivoMensal: rf,
    rendimentoPassivoAnual: rfAnual,
    diferencialRendaFixa: diff,
    diferencialRendaFixaAnual: lucroAnual - rfAnual,
    veredito,
    semaforo,
  };
}

/** @param {object} entrada */
function calcularTodosCenarios(entrada) {
  return {
    pessimista: calcularCenario(entrada, 'pessimista'),
    base: calcularCenario(entrada, 'base'),
    otimista: calcularCenario(entrada, 'otimista'),
  };
}

function fmtMoeda(v) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoeda(str) {
  if (!str) return 0;
  const s = String(str).trim();
  if (!s) return 0;
  if (s.includes(',') || s.includes('R$')) {
    const limpo = s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(limpo);
    return Number.isFinite(n) ? n : 0;
  }
  const n = parseFloat(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function aplicarMascaraMoeda(el) {
  const digitos = el.value.replace(/\D/g, '');
  const centavos = (parseInt(digitos, 10) || 0) / 100;
  el.value = fmtMoeda(centavos);
  return centavos;
}

function parsePercentual(str) {
  if (!str) return 0;
  const s = String(str).replace('%', '').trim();
  if (!s) return 0;
  if (s.includes(',')) {
    const n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  if (s.includes('.')) {
    const partes = s.split('.');
    if (partes.length === 2 && partes[1].length <= 2) {
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : 0;
    }
  }
  const n = parseFloat(s.replace(/\./g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Aceita % a.m. ou % a.a. (se > 1,5, trata como anual). */
function normalizarTaxaMensal(str) {
  const taxa = parsePercentual(str);
  if (taxa <= 0) return 0;
  return taxa > 1.5 ? taxa / 12 : taxa;
}

function fmtPercentual(v, casas = 2) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function taxaAnualDeMensal(taxaMensal) {
  return taxaMensal * 12;
}

function normalizarCamposMoeda(form) {
  form.querySelectorAll('.input-moeda').forEach((el) => {
    const v = el.value.trim();
    if (!v) return;
    const valor = parseMoeda(v);
    el.value = fmtMoeda(valor);
  });
}

function lerEntradaDoForm(form) {
  const taxaMensal = normalizarTaxaMensal(form.selicMes?.value);
  return {
    investimentoTotal: parseMoeda(form.investimento.value),
    numeroClientes: parseInt(form.clientes.value, 10) || 0,
    ticketMedio: parseMoeda(form.ticket.value),
    custosMensais: parseMoeda(form.custos.value),
    taxaRendaFixaMensal: taxaMensal,
    taxaRendaFixaAnual: taxaAnualDeMensal(taxaMensal),
    prolaboreMensal: parseMoeda(form.prolabore?.value),
    valorEquipamentos: parseMoeda(form.equipamentos?.value),
    vidaUtilMeses: parseInt(form.vidaUtil?.value, 10) || 60,
  };
}

function validarEntrada(e) {
  const faltando = [];
  if (e.investimentoTotal <= 0) faltando.push('investimento');
  if (e.numeroClientes <= 0) faltando.push('clientes');
  if (e.ticketMedio <= 0) faltando.push('ticket médio');
  if (e.custosMensais < 0) faltando.push('custos');
  if (e.taxaRendaFixaMensal <= 0) faltando.push('rendimento da aplicação');
  e._faltando = faltando;
  return faltando.length === 0;
}

function textoAnalise(entrada, base) {
  const sinal = base.diferencialRendaFixa >= 0 ? '+' : '−';
  const payback =
    base.paybackMeses == null ? '—' : base.paybackMeses.toFixed(1) + ' meses';
  const linhas = [
    '=== RAIO-X DE NEGÓCIOS V2 ===',
    '',
    'INVESTIMENTO: ' + fmtMoeda(entrada.investimentoTotal),
    'RENDIMENTO APLICAÇÃO: ' + fmtPercentual(entrada.taxaRendaFixaMensal) + '% a.m. · ' + fmtPercentual(entrada.taxaRendaFixaAnual) + '% a.a.',
    'APLICAÇÃO FINANCEIRA rende (ano): ' + fmtMoeda(base.rendimentoPassivoAnual),
    'NEGÓCIO retorna (ano): ' + fmtMoeda(base.lucroAnual),
    'LUCRO MENSAL (base): ' + fmtMoeda(base.lucroMensal),
    'RENDA PASSIVA (mês): ' + fmtMoeda(base.rendimentoPassivoMensal),
    'DIFERENÇA (mês): ' + sinal + ' ' + fmtMoeda(Math.abs(base.diferencialRendaFixa)),
    'DIFERENÇA (ano): ' + (base.diferencialRendaFixaAnual >= 0 ? '+' : '−') + ' ' + fmtMoeda(Math.abs(base.diferencialRendaFixaAnual)),
    'ROI mensal: ' + base.roiMensalPercentual.toFixed(2) + '% · anual: ' + base.roiAnualPercentual.toFixed(2) + '%',
    'PAYBACK: ' + payback,
    'VEREDITO: ' + base.veredito,
    '',
    'CENÁRIOS — lucro mensal:',
    '  Pessimista (75% clientes): ' + fmtMoeda(calcularCenario(entrada, 'pessimista').lucroMensal),
    '  Base: ' + fmtMoeda(base.lucroMensal),
    '  Otimista (125% clientes): ' + fmtMoeda(calcularCenario(entrada, 'otimista').lucroMensal),
    '',
    'Gerado em https://rivascode-ops.github.io/Calc-Roi',
  ];
  if (base.depreciacaoAnual > 0) {
    linhas.splice(12, 0, 'DEPRECIAÇÃO (ano): ' + fmtMoeda(base.depreciacaoAnual));
  }
  return linhas.join('\n');
}

window.CalcEngine = {
  CENARIO_FATOR,
  calcularCenario,
  calcularTodosCenarios,
  fmtMoeda,
  parseMoeda,
  aplicarMascaraMoeda,
  parsePercentual,
  normalizarTaxaMensal,
  normalizarCamposMoeda,
  fmtPercentual,
  taxaAnualDeMensal,
  lerEntradaDoForm,
  validarEntrada,
  textoAnalise,
};

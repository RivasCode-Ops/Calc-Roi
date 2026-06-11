/** Motor — Precificação e Planos Comerciais (Picos do Saber) */

const SEMANAS_MES = 4;
const DESCONTO_ANUAL_VISTA = 0.1;

function lerEntradaPreco(form) {
  return {
    numAlunos: parseInt(form.alunosTotal.value, 10) || 0,
    alunosPorTurma: parseInt(form.alunosTurmaPreco.value, 10) || 6,
    horasEncontro: parseFloat(String(form.horasEncontro.value).replace(',', '.')) || 1.5,
    encontrosSemana: parseFloat(String(form.encontrosSemana.value).replace(',', '.')) || 2,
    valorHoraProf: window.CalcEngine.parseMoeda(form.valorHora.value),
    custosFixosMensais: window.CalcEngine.parseMoeda(form.custosFixosPreco.value),
    margemLucroPct: parseFloat(String(form.margemLucro.value).replace(',', '.')) || 0,
    mensalidadeReferencia: window.CalcEngine.parseMoeda(form.mensalidadeRef?.value),
  };
}

function validarEntradaPreco(e) {
  const faltando = [];
  if (e.numAlunos <= 0) faltando.push('total de alunos');
  if (e.alunosPorTurma <= 0) faltando.push('alunos por turma');
  if (e.horasEncontro <= 0) faltando.push('horas por encontro');
  if (e.encontrosSemana <= 0) faltando.push('encontros por semana');
  if (e.valorHoraProf <= 0) faltando.push('valor da hora');
  if (e.custosFixosMensais < 0) faltando.push('custos fixos');
  if (e.margemLucroPct < 0) faltando.push('margem de lucro');
  e._faltando = faltando;
  return faltando.length === 0;
}

function arredondarMensalidade(valor) {
  if (valor <= 0) return 0;
  return Math.ceil(valor / 50) * 50;
}

function calcularPreco(entrada) {
  const turmas = Math.ceil(entrada.numAlunos / entrada.alunosPorTurma);
  const encontrosMes = entrada.encontrosSemana * SEMANAS_MES;
  const custoPorEncontro = entrada.valorHoraProf * entrada.horasEncontro;
  const custoProfessorMes = turmas * encontrosMes * custoPorEncontro;

  const pisoPorAula = custoPorEncontro / entrada.alunosPorTurma;
  const pisoMensalAluno = pisoPorAula * encontrosMes;

  const custoRealPorAluno = (custoProfessorMes + entrada.custosFixosMensais) / entrada.numAlunos;
  const precoMinimo = custoRealPorAluno * (1 + entrada.margemLucroPct / 100);
  const planoAnual12x = arredondarMensalidade(precoMinimo);
  const planoAnualVista = Math.round(planoAnual12x * 12 * (1 - DESCONTO_ANUAL_VISTA));

  const horaRecuperacaoMin = Math.max(120, entrada.valorHoraProf * 1.5);
  const horaRecuperacaoMax = Math.max(180, entrada.valorHoraProf * 2.25);
  const pacote10Min = Math.round(horaRecuperacaoMin * 10);
  const pacote10Max = Math.round(horaRecuperacaoMax * 10);
  const pacote20Min = Math.round(horaRecuperacaoMin * 20 * 0.92);
  const pacote20Max = Math.round(horaRecuperacaoMax * 20 * 0.92);

  const margemEfetivaPct =
    planoAnual12x > 0 ? ((planoAnual12x - custoRealPorAluno) / planoAnual12x) * 100 : -100;
  const gapPisoVsReal = pisoMensalAluno > 0 ? custoRealPorAluno / pisoMensalAluno : 0;

  const ref = entrada.mensalidadeReferencia || planoAnual12x;
  const lucroRef = ref - custoRealPorAluno;
  const margemRefPct = ref > 0 ? (lucroRef / ref) * 100 : -100;

  let veredito;
  let semaforo;
  let diagnostico;

  if (precoMinimo > 1500 || margemEfetivaPct < 0) {
    veredito = 'Preço inviável';
    semaforo = 'vermelho';
    diagnostico =
      'O custo real exige mensalidade acima do mercado típico. Reduza fixos, aumente turmas ou revise a carga horária.';
  } else if (margemEfetivaPct < Math.max(12, entrada.margemLucroPct * 0.65) || gapPisoVsReal > 2.5) {
    veredito = 'Margem apertada';
    semaforo = 'amarelo';
    diagnostico =
      'Operação possível, mas o piso “só hora da professora” (' +
      window.CalcEngine.fmtMoeda(pisoMensalAluno) +
      ') está muito abaixo do custo real. Direcione famílias ao plano anual.';
  } else {
    veredito = 'Saudável';
    semaforo = 'verde';
    diagnostico =
      'Precificação sustentável com margem de ' +
      margemEfetivaPct.toFixed(1) +
      '% no plano sugerido. Plano anual cobre custos e lucro.';
  }

  return {
    turmas,
    encontrosMes,
    custoPorEncontro,
    custoProfessorMes,
    pisoPorAula,
    pisoMensalAluno,
    custoRealPorAluno,
    precoMinimo,
    planoAnual12x,
    planoAnualVista,
    horaRecuperacaoMin,
    horaRecuperacaoMax,
    pacote10Min,
    pacote10Max,
    pacote20Min,
    pacote20Max,
    margemEfetivaPct,
    gapPisoVsReal,
    mensalidadeReferencia: ref,
    lucroReferencia: lucroRef,
    margemReferenciaPct: margemRefPct,
    veredito,
    semaforo,
    diagnostico,
  };
}

function textoAnalisePreco(entrada, r) {
  const fmt = window.CalcEngine.fmtMoeda;
  return [
    '=== PICOS DO SABER — PRECIFICAÇÃO E PLANOS ===',
    '',
    'ENTRADAS',
    'Alunos: ' + entrada.numAlunos + ' · Turma: ' + entrada.alunosPorTurma,
    'Encontros: ' + entrada.encontrosSemana + '/sem × ' + entrada.horasEncontro + 'h',
    'Hora professora: ' + fmt(entrada.valorHoraProf),
    'Fixos mensais: ' + fmt(entrada.custosFixosMensais),
    'Margem desejada: ' + entrada.margemLucroPct + '%',
    '',
    'PISO (só hora da professora)',
    'Por aula/aluno: ' + fmt(r.pisoPorAula),
    'Mensal/aluno (referência): ' + fmt(r.pisoMensalAluno),
    '',
    'CUSTO REAL',
    'Professoras/mês: ' + fmt(r.custoProfessorMes),
    'Custo real por aluno: ' + fmt(r.custoRealPorAluno),
    'Preço mínimo (+ margem): ' + fmt(r.precoMinimo),
    '',
    'PLANOS COMERCIAIS',
    'Evolução 12×: ' + fmt(r.planoAnual12x) + '/mês',
    'Anual à vista (−10%): ' + fmt(r.planoAnualVista),
    'Recuperação/hora: ' + fmt(r.horaRecuperacaoMin) + ' – ' + fmt(r.horaRecuperacaoMax),
    'Pacote 10h: ' + fmt(r.pacote10Min) + ' – ' + fmt(r.pacote10Max),
    'Pacote 20h: ' + fmt(r.pacote20Min) + ' – ' + fmt(r.pacote20Max),
    '',
    'Veredito: ' + r.veredito,
    r.diagnostico,
  ].join('\n');
}

window.PrecoEngine = {
  lerEntradaPreco,
  validarEntradaPreco,
  calcularPreco,
  textoAnalisePreco,
  SEMANAS_MES,
  DESCONTO_ANUAL_VISTA,
};

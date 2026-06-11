/** Motor central — Sistema de Gestão Escolar (Picos do Saber) */

function parseDec(val) {
  return parseFloat(String(val ?? '').replace(',', '.')) || 0;
}

function somaValores(obj) {
  return Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function arredondarMensalidade(valor) {
  if (valor <= 0) return 0;
  return Math.ceil(valor / 50) * 50;
}

const CARGOS_EQUIPE = [
  { id: 'coord', label: 'Professora coordenadora' },
  { id: 'aux', label: 'Professora auxiliar' },
  { id: 'reforco', label: 'Professora reforço' },
  { id: 'secretaria', label: 'Secretária' },
  { id: 'recepcao', label: 'Recepção' },
  { id: 'limpeza', label: 'Copeira / limpeza' },
  { id: 'vigia', label: 'Vigia' },
  { id: 'outros', label: 'Outros' },
];

function defaultsMestre() {
  return {
    investimento: {
      reforma: 25000,
      moveis: 15000,
      computadores: 12000,
      arCondicionado: 8000,
      identidade: 5000,
      materialInicial: 4000,
      outros: 6000,
    },
    capacidade: {
      capacidadeMaxima: 80,
      alunosAtuais: 50,
      alunosPorTurma: 8,
      turnos: 3,
      horasPorTurno: 4,
      diasSemana: 5,
      aulasPorSemana: 2,
      horasPorAula: 1.5,
      cargaMaxProfSemana: 20,
    },
    precos: {
      mensalidadePadrao: 700,
      descontoAnualVistaPct: 10,
      horaAvulsa: 150,
      pacoteIntensivo: 2800,
    },
    equipe: [
      { id: 'coord', quantidade: 1, salario: 3500 },
      { id: 'aux', quantidade: 2, salario: 2500 },
      { id: 'reforco', quantidade: 1, salario: 2500 },
      { id: 'secretaria', quantidade: 0, salario: 2200 },
      { id: 'recepcao', quantidade: 1, salario: 1800 },
      { id: 'limpeza', quantidade: 1, salario: 800 },
      { id: 'vigia', quantidade: 0, salario: 1500 },
      { id: 'outros', quantidade: 0, salario: 0 },
    ],
    fixos: {
      aluguel: 4500,
      energia: 600,
      internet: 200,
      agua: 150,
      materialEscolar: 400,
      materialLimpeza: 200,
      marketing: 800,
      sistemas: 300,
      contabilidade: 500,
      impostos: 600,
      outros: 500,
    },
    metas: {
      margemLucroPct: 20,
      reservaReinvestimentoPct: 5,
      prolaboreSocio: 3000,
    },
  };
}

function lerMestre(form) {
  const pm = window.CalcEngine.parseMoeda;
  const num = (name) => parseInt(form.elements[name]?.value, 10) || 0;
  const dec = (name) => parseDec(form.elements[name]?.value);
  const moeda = (name) => pm(form.elements[name]?.value);

  const investimento = {
    reforma: moeda('inv_reforma'),
    moveis: moeda('inv_moveis'),
    computadores: moeda('inv_computadores'),
    arCondicionado: moeda('inv_ar'),
    identidade: moeda('inv_identidade'),
    materialInicial: moeda('inv_material'),
    outros: moeda('inv_outros'),
  };

  const capacidade = {
    capacidadeMaxima: num('cap_max'),
    alunosAtuais: num('cap_atuais'),
    alunosPorTurma: num('cap_turma') || 8,
    turnos: num('cap_turnos') || 1,
    horasPorTurno: dec('cap_horas_turno') || 4,
    diasSemana: num('cap_dias') || 5,
    aulasPorSemana: dec('cap_aulas_sem') || 2,
    horasPorAula: dec('cap_horas_aula') || 1.5,
    cargaMaxProfSemana: dec('cap_carga_prof') || 20,
  };

  const precos = {
    mensalidadePadrao: moeda('pre_mensalidade'),
    descontoAnualVistaPct: dec('pre_desconto'),
    horaAvulsa: moeda('pre_hora_avulsa'),
    pacoteIntensivo: moeda('pre_pacote'),
  };

  const equipe = CARGOS_EQUIPE.map((c) => ({
    id: c.id,
    label: c.label,
    quantidade: num('eq_' + c.id + '_q'),
    salario: moeda('eq_' + c.id + '_s'),
  }));

  const fixos = {
    aluguel: moeda('fix_aluguel'),
    energia: moeda('fix_energia'),
    internet: moeda('fix_internet'),
    agua: moeda('fix_agua'),
    materialEscolar: moeda('fix_material_esc'),
    materialLimpeza: moeda('fix_material_lim'),
    marketing: moeda('fix_marketing'),
    sistemas: moeda('fix_sistemas'),
    contabilidade: moeda('fix_contabilidade'),
    impostos: moeda('fix_impostos'),
    outros: moeda('fix_outros'),
  };

  const metas = {
    margemLucroPct: dec('meta_margem'),
    reservaReinvestimentoPct: dec('meta_reserva'),
    prolaboreSocio: moeda('meta_prolabore'),
  };

  return { investimento, capacidade, precos, equipe, fixos, metas };
}

function validarMestre(m) {
  const faltando = [];
  if (m.capacidade.alunosAtuais <= 0) faltando.push('alunos atuais');
  if (m.capacidade.alunosPorTurma <= 0) faltando.push('alunos por turma');
  if (m.precos.mensalidadePadrao <= 0) faltando.push('mensalidade padrão');
  if (m.capacidade.turnos <= 0) faltando.push('turnos');
  m._faltando = faltando;
  return faltando.length === 0;
}

function totaisMestre(m) {
  const investimentoTotal = somaValores(m.investimento);
  const folhaSalarial = m.equipe.reduce((s, e) => s + e.quantidade * e.salario, 0);
  const fixosTotal = somaValores(m.fixos);
  const custosMensaisBase = folhaSalarial + fixosTotal + m.metas.prolaboreSocio;
  return { investimentoTotal, folhaSalarial, fixosTotal, custosMensaisBase };
}

function semaforoMargem(margemPct, margemDesejada) {
  if (margemPct < 0) return { veredito: 'Prejuízo', semaforo: 'vermelho' };
  if (margemPct < Math.max(10, margemDesejada * 0.6))
    return { veredito: 'Margem apertada', semaforo: 'amarelo' };
  return { veredito: 'Saudável', semaforo: 'verde' };
}

function analisarVolume(m, numAlunos) {
  const { folhaSalarial, fixosTotal, custosMensaisBase } = totaisMestre(m);
  const cap = m.capacidade;

  const turmas = Math.ceil(numAlunos / cap.alunosPorTurma);
  const horasTurmasSemana = turmas * cap.aulasPorSemana * cap.horasPorAula;
  const horasPorAluno = cap.aulasPorSemana * cap.horasPorAula;
  const professorasNecessarias = Math.max(
    1,
    Math.ceil(horasTurmasSemana / cap.cargaMaxProfSemana)
  );
  const salas = Math.max(1, Math.ceil(turmas / cap.turnos));
  const profCadastradas = m.equipe
    .filter((e) => e.id === 'coord' || e.id === 'aux' || e.id === 'reforco')
    .reduce((s, e) => s + e.quantidade, 0);
  const cargaPorProf =
    professorasNecessarias > 0 ? horasTurmasSemana / professorasNecessarias : 0;

  const receitaBruta = numAlunos * m.precos.mensalidadePadrao;
  const custosTotal = custosMensaisBase;
  const lucroOperacional = receitaBruta - custosTotal;
  const margemPct = receitaBruta > 0 ? (lucroOperacional / receitaBruta) * 100 : -100;
  const custoPorAluno = numAlunos > 0 ? custosTotal / numAlunos : 0;
  const margemAlvo = m.metas.margemLucroPct + m.metas.reservaReinvestimentoPct;
  const mensalidadeMinima = custoPorAluno * (1 + margemAlvo / 100);
  const mensalidadeIdeal = arredondarMensalidade(mensalidadeMinima);
  const ocupacaoPct =
    cap.capacidadeMaxima > 0 ? (numAlunos / cap.capacidadeMaxima) * 100 : 0;

  const saude = semaforoMargem(margemPct, m.metas.margemLucroPct);

  return {
    numAlunos,
    turmas,
    horasTurmasSemana,
    horasPorAluno,
    professorasNecessarias,
    profCadastradas,
    cargaPorProf,
    salas,
    receitaBruta,
    folhaSalarial,
    fixosTotal,
    custosTotal,
    lucroOperacional,
    margemPct,
    custoPorAluno,
    mensalidadeMinima,
    mensalidadeIdeal,
    ocupacaoPct,
    ...saude,
  };
}

function avaliarPlano(preco, custoPorAluno, margemDesejada) {
  const margem = preco > 0 ? ((preco - custoPorAluno) / preco) * 100 : -100;
  const s = semaforoMargem(margem, margemDesejada);
  return { preco, margem, ...s };
}

function calcularPlanos(m, vol) {
  const mensal = m.precos.mensalidadePadrao;
  const anual12 = mensal;
  const anualVista = Math.round(mensal * 12 * (1 - m.precos.descontoAnualVistaPct / 100));
  const mensalEquivVista = anualVista / 12;
  const margemDesejada = m.metas.margemLucroPct;

  return [
    { nome: 'Mensal', ...avaliarPlano(mensal, vol.custoPorAluno, margemDesejada) },
    { nome: 'Anual 12×', ...avaliarPlano(anual12, vol.custoPorAluno, margemDesejada) },
    {
      nome: 'À vista',
      preco: anualVista,
      precoMensalEquiv: mensalEquivVista,
      ...avaliarPlano(mensalEquivVista, vol.custoPorAluno, margemDesejada),
    },
    {
      nome: 'Recuperação intensiva',
      preco: m.precos.pacoteIntensivo,
      detalhe: 'Pacote · hora avulsa ' + window.CalcEngine.fmtMoeda(m.precos.horaAvulsa),
      ...avaliarPlano(m.precos.pacoteIntensivo / 20, vol.custoPorAluno, margemDesejada),
    },
  ];
}

function calcularEquilibrio(m, maxBusca) {
  const limite = maxBusca || m.capacidade.capacidadeMaxima || 300;
  for (let n = 1; n <= limite; n++) {
    const v = analisarVolume(m, n);
    if (v.lucroOperacional >= 0) return { alunos: n, ...v };
  }
  return null;
}

function calcularRoi(m, vol) {
  const { investimentoTotal } = totaisMestre(m);
  const lucro = vol.lucroOperacional;
  const paybackMeses = lucro > 0 ? investimentoTotal / lucro : null;
  const roiAnualPct = investimentoTotal > 0 ? ((lucro * 12) / investimentoTotal) * 100 : 0;
  return { investimentoTotal, lucroMensal: lucro, paybackMeses, roiAnualPct };
}

function calcularEquilibrioComMensalidade(mestre, mensalidade, maxBusca) {
  const m = {
    ...mestre,
    precos: { ...mestre.precos, mensalidadePadrao: mensalidade },
  };
  return calcularEquilibrio(m, maxBusca);
}

function projecaoRoiMensal(roi, meses) {
  const limite = meses || 24;
  const lucro = roi.lucroMensal;
  const invest = roi.investimentoTotal;
  const pts = [];
  for (let m = 0; m <= limite; m++) {
    pts.push({
      mes: m,
      lucroAcumulado: lucro * m,
      investimento: invest,
      saldo: lucro * m - invest,
    });
  }
  return pts;
}

function resumoExecutivo(mestre, r) {
  const a = r.atual;
  const eq = r.equilibrio;
  return {
    alunos: mestre.capacidade.alunosAtuais,
    lucro: a.lucroOperacional,
    margemPct: a.margemPct,
    payback: r.roi.paybackMeses,
    equilibrio: eq ? eq.alunos : null,
    veredito: a.veredito,
    semaforo: a.semaforo,
  };
}

function calcularGestao(mestre) {
  const totais = totaisMestre(mestre);
  const atual = analisarVolume(mestre, mestre.capacidade.alunosAtuais);
  const planos = calcularPlanos(mestre, atual);
  const roi = calcularRoi(mestre, atual);
  const equilibrio = calcularEquilibrio(mestre);
  const cenariosVolumes = [
    { id: 'conservador', label: 'Conservador', alunos: 10 },
    { id: 'realista', label: 'Realista', alunos: 30 },
    { id: 'meta', label: 'Meta', alunos: Math.max(mestre.capacidade.alunosAtuais, 50) },
  ];
  const cenarios = cenariosVolumes.map((c) => ({
    ...c,
    ...analisarVolume(mestre, c.alunos),
  }));

  return { totais, atual, planos, roi, equilibrio, cenarios };
}

function textoAnaliseGestao(mestre, r) {
  const fmt = window.CalcEngine.fmtMoeda;
  const a = r.atual;
  return [
    '=== PICOS DO SABER — SISTEMA DE GESTÃO ESCOLAR ===',
    '',
    'INVESTIMENTO TOTAL: ' + fmt(r.totais.investimentoTotal),
    'CUSTOS MENSAIS: ' + fmt(a.custosTotal),
    'ALUNOS ATUAIS: ' + mestre.capacidade.alunosAtuais,
    '',
    'VIABILIDADE',
    'Receita: ' + fmt(a.receitaBruta),
    'Lucro: ' + fmt(a.lucroOperacional) + ' (' + a.margemPct.toFixed(1) + '%)',
    '',
    'CAPACIDADE',
    a.numAlunos + ' alunos → ' + a.turmas + ' turmas → ' + a.horasTurmasSemana.toFixed(1) + ' h/sem → ' + a.professorasNecessarias + ' professoras',
    '',
    'PREÇO IDEAL: ' + fmt(a.mensalidadeIdeal) + '/aluno',
    'EQUILÍBRIO: ' + (r.equilibrio ? r.equilibrio.alunos + ' alunos' : 'não atingível'),
    '',
    'ROI',
    'Payback: ' + (r.roi.paybackMeses ? r.roi.paybackMeses.toFixed(1) + ' meses' : '—'),
    'ROI anual: ' + r.roi.roiAnualPct.toFixed(1) + '%',
  ].join('\n');
}

window.GestaoEngine = {
  CARGOS_EQUIPE,
  defaultsMestre,
  lerMestre,
  validarMestre,
  totaisMestre,
  analisarVolume,
  calcularGestao,
  calcularEquilibrio,
  calcularEquilibrioComMensalidade,
  projecaoRoiMensal,
  resumoExecutivo,
  textoAnaliseGestao,
};

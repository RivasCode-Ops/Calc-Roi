/** Motor — Capacidade e Viabilidade Escolar (Picos do Saber) */

function lerEntradaEscola(form) {
  const turnos = ['turnoManha', 'turnoTarde', 'turnoNoite'].filter(
    (id) => form[id]?.checked
  ).length;
  return {
    numAlunos: parseInt(form.alunos.value, 10) || 0,
    mensalidade: window.CalcEngine.parseMoeda(form.mensalidade.value),
    alunosPorTurma: parseInt(form.alunosTurma.value, 10) || 8,
    turnosAtivos: turnos || parseInt(form.horariosDia?.value, 10) || 3,
    aulasPorSemana: parseFloat(String(form.aulasSemana.value).replace(',', '.')) || 2,
    duracaoAulaHoras: parseFloat(String(form.duracaoAula.value).replace(',', '.')) || 1.5,
    horasProfessorSemana: parseFloat(String(form.horasProfessor.value).replace(',', '.')) || 30,
    salarioProfessora: window.CalcEngine.parseMoeda(form.salarioProf.value),
    salarioRecepcao: window.CalcEngine.parseMoeda(form.salarioRecepcao.value),
    custoLimpeza: window.CalcEngine.parseMoeda(form.custoLimpeza.value),
    outrosCustos: window.CalcEngine.parseMoeda(form.outrosCustos?.value),
    incluirRecepcao: form.incluirRecepcao?.checked !== false,
    incluirLimpeza: form.incluirLimpeza?.checked !== false,
  };
}

function validarEntradaEscola(e) {
  const faltando = [];
  if (e.numAlunos <= 0) faltando.push('alunos');
  if (e.mensalidade <= 0) faltando.push('mensalidade');
  if (e.alunosPorTurma <= 0) faltando.push('alunos por turma');
  if (e.turnosAtivos <= 0) faltando.push('turnos ou horários');
  if (e.salarioProfessora <= 0) faltando.push('salário professora');
  e._faltando = faltando;
  return faltando.length === 0;
}

function calcularEscola(entrada) {
  const turmas = Math.ceil(entrada.numAlunos / entrada.alunosPorTurma);
  // Horas-aula entregues (alunos × carga individual) — modelo conservador para folha docente
  const horasCargaTotal = entrada.numAlunos * entrada.aulasPorSemana * entrada.duracaoAulaHoras;
  const horasPorAluno = entrada.aulasPorSemana * entrada.duracaoAulaHoras;
  const professoras = Math.max(1, Math.ceil(horasCargaTotal / entrada.horasProfessorSemana));
  const salas = Math.max(1, Math.ceil(turmas / entrada.turnosAtivos));

  const faturamento = entrada.numAlunos * entrada.mensalidade;
  const custoProfessoras = professoras * entrada.salarioProfessora;
  const custoRecepcao = entrada.incluirRecepcao ? entrada.salarioRecepcao : 0;
  const custoLimpeza = entrada.incluirLimpeza ? entrada.custoLimpeza : 0;
  const custosFixos = custoRecepcao + custoLimpeza + (entrada.outrosCustos || 0);
  const custosTotal = custoProfessoras + custosFixos;
  const lucro = faturamento - custosTotal;
  const folhaPct = faturamento > 0 ? (custosTotal / faturamento) * 100 : 100;
  const margemPct = faturamento > 0 ? (lucro / faturamento) * 100 : -100;
  const mensalidadeMinima =
    entrada.numAlunos > 0 ? Math.ceil((custosTotal / entrada.numAlunos) * 100) / 100 : 0;

  let veredito;
  let semaforo;
  let diagnostico;
  if (lucro <= 0) {
    veredito = 'Risco';
    semaforo = 'vermelho';
    diagnostico =
      'A mensalidade não sustenta a equipe. Mínimo sugerido: ' +
      window.CalcEngine.fmtMoeda(mensalidadeMinima) +
      '/aluno com ' +
      entrada.numAlunos +
      ' alunos.';
  } else if (folhaPct > 40 || margemPct < 12) {
    veredito = 'Atenção';
    semaforo = 'amarelo';
    diagnostico =
      'Operação positiva, mas margem apertada (' +
      margemPct.toFixed(1) +
      '%). Custos consomem ' +
      folhaPct.toFixed(1) +
      '% do faturamento — cuidado ao contratar.';
  } else {
    veredito = 'Saudável';
    semaforo = 'verde';
    diagnostico =
      'Estrutura sustentável com margem de ' +
      margemPct.toFixed(1) +
      '%. Bom espaço para reinvestir ou formar reserva.';
  }

  return {
    turmas,
    horasCargaTotal,
    horasPorAluno,
    professoras,
    salas,
    recepcionistas: entrada.incluirRecepcao ? 1 : 0,
    equipeLimpeza: entrada.incluirLimpeza ? 1 : 0,
    faturamento,
    custoProfessoras,
    custosFixos,
    custosTotal,
    lucro,
    folhaPct,
    margemPct,
    mensalidadeMinima,
    veredito,
    semaforo,
    diagnostico,
    estrutura: {
      cadeiras: entrada.numAlunos,
      mesas: entrada.numAlunos,
      quadros: salas,
      arCondicionado: salas,
    },
  };
}

function calcularAlunosEquilibrio(entrada, maxBusca = 300) {
  for (let n = 1; n <= maxBusca; n++) {
    const r = calcularEscola({ ...entrada, numAlunos: n });
    if (r.lucro >= 0) return { alunos: n, resultado: r };
  }
  return null;
}

function proximosDegraus(entrada, atual) {
  const alertas = [];
  const fmt = window.CalcEngine.fmtMoeda;

  alertas.push(
    'Agora (' +
      entrada.numAlunos +
      ' alunos): ' +
      atual.professoras +
      ' professoras · ' +
      atual.salas +
      ' sala(s) · lucro ' +
      fmt(atual.lucro)
  );

  let proxProf = null;
  let proxSala = null;
  const limite = Math.max(entrada.numAlunos + 80, 100);

  for (let n = entrada.numAlunos + 1; n <= limite; n++) {
    const r = calcularEscola({ ...entrada, numAlunos: n });
    if (!proxProf && r.professoras > atual.professoras) {
      proxProf = { alunos: n, professoras: r.professoras };
    }
    if (!proxSala && r.salas > atual.salas) {
      proxSala = { alunos: n, salas: r.salas };
    }
    if (proxProf && proxSala) break;
  }

  if (proxProf) {
    alertas.push(
      'Contratação: aos ' + proxProf.alunos + ' alunos → ' + proxProf.professoras + ' professoras.'
    );
  } else {
    alertas.push('Professoras: sem necessidade de nova contratação no curto prazo.');
  }

  if (proxSala) {
    alertas.push(
      'Espaço: aos ' + proxSala.alunos + ' alunos → ' + proxSala.salas + ' salas simultâneas.'
    );
  } else {
    alertas.push('Salas: capacidade física OK para crescer sem nova sala.');
  }

  const equilibrio = calcularAlunosEquilibrio(entrada);
  if (equilibrio && entrada.numAlunos < equilibrio.alunos) {
    alertas.push(
      'Financeiro: ponto de equilíbrio estimado em ' + equilibrio.alunos + ' alunos (lucro ≥ 0).'
    );
  }

  return alertas;
}

function montarCenarios(entrada) {
  const base = [20, 50, 100, entrada.numAlunos];
  const unicos = [...new Set(base)].sort((a, b) => a - b);
  return simularCenarios(entrada, unicos);
}

function simularCenarios(entrada, volumes) {
  return volumes.map((n) => ({
    alunos: n,
    atual: n === entrada.numAlunos,
    ...calcularEscola({ ...entrada, numAlunos: n }),
  }));
}

function textoAnaliseEscola(entrada, r, alertas, cenarios) {
  const fmt = window.CalcEngine.fmtMoeda;
  const linhas = [
    '=== PICOS DO SABER — CAPACIDADE E VIABILIDADE ===',
    '',
    'ALUNOS: ' + entrada.numAlunos,
    'MENSALIDADE: ' + fmt(entrada.mensalidade),
    'MENSALIDADE MÍNIMA (equilíbrio): ' + fmt(r.mensalidadeMinima),
    '',
    'CAPACIDADE',
    'Turmas: ' + r.turmas,
    'Carga horária total: ' + r.horasCargaTotal.toFixed(1) + ' h/sem',
    'Horas por aluno: ' + r.horasPorAluno.toFixed(1) + ' h/sem',
    'Professoras: ' + r.professoras,
    'Salas: ' + r.salas,
    '',
    'FINANCEIRO',
    'Faturamento: ' + fmt(r.faturamento),
    'Custos professoras: ' + fmt(r.custoProfessoras),
    'Custos fixos: ' + fmt(r.custosFixos),
    'Lucro: ' + fmt(r.lucro) + ' (' + r.margemPct.toFixed(1) + '%)',
    'Veredito: ' + r.veredito,
    '',
    'PRÓXIMOS DEGRAUS:',
    ...alertas.map((a) => '• ' + a),
    '',
    'CENÁRIOS (lucro):',
    ...cenarios.map((c) => '  ' + c.alunos + ' alunos → ' + fmt(c.lucro)),
  ];
  return linhas.join('\n');
}

window.EscolaEngine = {
  lerEntradaEscola,
  validarEntradaEscola,
  calcularEscola,
  calcularAlunosEquilibrio,
  proximosDegraus,
  montarCenarios,
  simularCenarios,
  textoAnaliseEscola,
};

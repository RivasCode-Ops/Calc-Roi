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
  const horasSemanais = entrada.numAlunos * entrada.aulasPorSemana * entrada.duracaoAulaHoras;
  const professoras = Math.max(1, Math.ceil(horasSemanais / entrada.horasProfessorSemana));
  const salas = Math.max(1, Math.ceil(turmas / entrada.turnosAtivos));

  const faturamento = entrada.numAlunos * entrada.mensalidade;
  const custoProfessoras = professoras * entrada.salarioProfessora;
  const custoRecepcao = entrada.incluirRecepcao ? entrada.salarioRecepcao : 0;
  const custoLimpeza = entrada.incluirLimpeza ? entrada.custoLimpeza : 0;
  const custosFixos = custoRecepcao + custoLimpeza + (entrada.outrosCustos || 0);
  const custosTotal = custoProfessoras + custosFixos;
  const lucro = faturamento - custosTotal;
  const folhaPct = faturamento > 0 ? (custosTotal / faturamento) * 100 : 100;

  let veredito;
  let semaforo;
  let diagnostico;
  if (lucro <= 0) {
    veredito = 'Risco';
    semaforo = 'vermelho';
    diagnostico = 'A mensalidade não sustenta a equipe neste cenário. Reveja preço, alunos ou custos.';
  } else if (folhaPct > 40) {
    veredito = 'Atenção';
    semaforo = 'amarelo';
    diagnostico =
      'Folha e custos fixos estão acima de 40% do faturamento. Monitore contratações e reajustes.';
  } else {
    veredito = 'Saudável';
    semaforo = 'verde';
    diagnostico = 'A operação se sustenta com margem confortável para o volume atual.';
  }

  return {
    turmas,
    horasSemanais,
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

function proximosDegraus(entrada, atual) {
  const alertas = [];
  let proxProf = null;
  let proxSala = null;

  for (let n = entrada.numAlunos + 1; n <= entrada.numAlunos + 80; n++) {
    const r = calcularEscola({ ...entrada, numAlunos: n });
    if (!proxProf && r.professoras > atual.professoras) {
      proxProf = { alunos: n, professoras: r.professoras };
    }
    if (!proxSala && r.salas > atual.salas) {
      proxSala = { alunos: n, salas: r.salas };
    }
    if (proxProf && proxSala) break;
  }

  if (atual.professoras === 1) {
    alertas.push('Continue com 1 professora e ' + atual.salas + ' sala(s) até crescer.');
  }
  if (proxProf) {
    alertas.push(
      'Atenção: com ' + proxProf.alunos + ' alunos, planeje ' + proxProf.professoras + ' professoras.'
    );
  }
  if (proxSala) {
    alertas.push(
      'Estrutura: com ' + proxSala.alunos + ' alunos, planeje ' + proxSala.salas + ' salas simultâneas.'
    );
  }
  if (!proxProf && !proxSala && entrada.numAlunos >= 45) {
    alertas.push('Volume alto — revise equipe, salas e precificação com frequência.');
  }

  return alertas;
}

function simularCenarios(entrada, volumes) {
  return volumes.map((n) => ({
    alunos: n,
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
    '',
    'CAPACIDADE',
    'Turmas: ' + r.turmas,
    'Horas/semana: ' + r.horasSemanais.toFixed(1) + 'h',
    'Professoras: ' + r.professoras,
    'Salas: ' + r.salas,
    '',
    'FINANCEIRO',
    'Faturamento: ' + fmt(r.faturamento),
    'Custos: ' + fmt(r.custosTotal),
    'Lucro: ' + fmt(r.lucro),
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
  proximosDegraus,
  simularCenarios,
  textoAnaliseEscola,
};

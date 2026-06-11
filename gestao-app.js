(function () {
  if (!window.CalcEngine || !window.GestaoEngine) return;

  const { fmtMoeda, aplicarMascaraMoeda, parseMoeda } = window.CalcEngine;
  const {
    CARGOS_EQUIPE,
    defaultsMestre,
    lerMestre,
    validarMestre,
    totaisMestre,
    calcularGestao,
    textoAnaliseGestao,
  } = window.GestaoEngine;

  const form = document.getElementById('form-mestre');
  const panel = document.getElementById('panel-gestao');
  if (!form || !panel) return;

  let ultimoResultado = null;
  const iconeSemaforo = { verde: '🟢', amarelo: '🟡', vermelho: '🔴' };

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function aplicarMascaras() {
    panel.querySelectorAll('.input-moeda').forEach((el) => {
      el.addEventListener('input', () => aplicarMascaraMoeda(el));
      el.addEventListener('blur', () => {
        const v = parseMoeda(el.value);
        if (v > 0 || el.value.trim()) el.value = fmtMoeda(v);
      });
    });
  }

  function atualizarTotaisMestre(m) {
    const t = totaisMestre(m);
    setText('tot_investimento', fmtMoeda(t.investimentoTotal));
    setText('tot_folha', fmtMoeda(t.folhaSalarial));
    setText('tot_fixos', fmtMoeda(t.fixosTotal));
    setText('tot_custos_mes', fmtMoeda(t.custosMensaisBase));

    CARGOS_EQUIPE.forEach((c) => {
      const row = m.equipe.find((e) => e.id === c.id);
      const total = row ? row.quantidade * row.salario : 0;
      setText('eq_' + c.id + '_t', fmtMoeda(total));
    });
  }

  function renderSemaforo(prefix, saude, diag) {
    const bola = document.getElementById(prefix + '_bola');
    const rotulo = document.getElementById(prefix + '_rotulo');
    const diagEl = document.getElementById(prefix + '_diag');
    if (bola) bola.className = 'bola ' + saude.semaforo;
    if (rotulo) rotulo.textContent = saude.veredito;
    if (diagEl) diagEl.textContent = diag || '';
  }

  function renderViabilidade(a) {
    renderSemaforo(
      'via',
      a,
      'Receita − folha − fixos − pró-labore = lucro operacional com ' + a.numAlunos + ' alunos.'
    );
    setText('via_receita', fmtMoeda(a.receitaBruta));
    setText('via_folha', fmtMoeda(a.folhaSalarial));
    setText('via_fixos', fmtMoeda(a.fixosTotal));
    setText('via_custos', fmtMoeda(a.custosTotal));
    setText('via_lucro', fmtMoeda(a.lucroOperacional));
    setText('via_margem', a.margemPct.toFixed(1) + '%');
  }

  function renderCapacidade(m, a) {
    const fluxo = [
      a.numAlunos + ' alunos',
      'Turmas de ' + m.capacidade.alunosPorTurma,
      a.turmas + ' grupos',
      a.horasTurmasSemana.toFixed(1) + ' h/semana',
      a.professorasNecessarias + ' professoras necessárias',
    ];
    setText('cap_fluxo', fluxo.join(' → '));
    setText('cap_turmas', String(a.turmas));
    setText('cap_salas', String(a.salas));
    setText('cap_horas', a.horasTurmasSemana.toFixed(1) + ' h/sem');
    setText('cap_horas_aluno', a.horasPorAluno.toFixed(1) + ' h/aluno');
    setText('cap_prof_nec', String(a.professorasNecessarias));
    setText('cap_prof_cad', String(a.profCadastradas));
    setText('cap_carga', a.cargaPorProf.toFixed(1) + ' h/sem por professora');
    const gap = a.profCadastradas - a.professorasNecessarias;
    setText(
      'cap_gap',
      gap >= 0
        ? 'Equipe docente OK (' + gap + ' acima da necessidade)'
        : 'Faltam ' + Math.abs(gap) + ' professoras para a carga atual'
    );
  }

  function renderPreco(a, planos) {
    renderSemaforo(
      'pre',
      a,
      'Com os custos cadastrados, a mensalidade mínima ideal é ' + fmtMoeda(a.mensalidadeIdeal) + '/aluno.'
    );
    setText('pre_minimo', fmtMoeda(a.mensalidadeIdeal));
    setText('pre_custo_real', fmtMoeda(a.custoPorAluno));
    setText('pre_mensal_atual', fmtMoeda(a.receitaBruta / Math.max(1, a.numAlunos)));

    const tbody = document.getElementById('pre_planos_tbody');
    if (tbody) {
      tbody.innerHTML = planos
        .map((p) => {
          const valor =
            p.nome === 'À vista'
              ? fmtMoeda(p.preco) + ' (' + fmtMoeda(p.precoMensalEquiv) + '/mês equiv.)'
              : p.nome === 'Recuperação intensiva'
                ? fmtMoeda(p.preco) + (p.detalhe ? ' · ' + p.detalhe : '')
                : fmtMoeda(p.preco) + '/mês';
          return (
            '<tr><td>' +
            p.nome +
            '</td><td>' +
            valor +
            '</td><td>' +
            iconeSemaforo[p.semaforo] +
            ' ' +
            p.veredito +
            '</td></tr>'
          );
        })
        .join('');
    }
  }

  function renderRoi(roi) {
    setText('roi_invest', fmtMoeda(roi.investimentoTotal));
    setText('roi_lucro', fmtMoeda(roi.lucroMensal));
    setText(
      'roi_payback',
      roi.paybackMeses ? roi.paybackMeses.toFixed(1) + ' meses' : 'Sem payback (lucro ≤ 0)'
    );
    setText('roi_anual', roi.roiAnualPct.toFixed(1) + '%');
    const saude =
      roi.paybackMeses && roi.paybackMeses <= 24
        ? { veredito: 'Retorno rápido', semaforo: 'verde' }
        : roi.paybackMeses
          ? { veredito: 'Retorno moderado', semaforo: 'amarelo' }
          : { veredito: 'Sem retorno', semaforo: 'vermelho' };
    renderSemaforo('roi', saude, 'Investimento ÷ lucro mensal operacional.');
  }

  function renderCenarios(cenarios, capMax) {
    const head = document.getElementById('cen_thead');
    const body = document.getElementById('cen_tbody');
    if (!head || !body) return;

    head.innerHTML =
      '<tr><th>Indicador</th>' +
      cenarios.map((c) => '<th>' + c.label + '<br><small>' + c.alunos + ' al.</small></th>').join('') +
      '</tr>';

    const linhas = [
      { rot: 'Receita', key: 'receitaBruta', fmt: fmtMoeda },
      { rot: 'Custos', key: 'custosTotal', fmt: fmtMoeda },
      { rot: 'Lucro', key: 'lucroOperacional', fmt: fmtMoeda },
      { rot: 'Professoras', key: 'professorasNecessarias', fmt: String },
      { rot: 'Salas', key: 'salas', fmt: String },
      { rot: 'Ocupação', key: 'ocupacaoPct', fmt: (v) => v.toFixed(0) + '%' },
    ];

    body.innerHTML = linhas
      .map(
        (ln) =>
          '<tr><td>' +
          ln.rot +
          '</td>' +
          cenarios.map((c) => '<td>' + ln.fmt(c[ln.key]) + '</td>').join('') +
          '</tr>'
      )
      .join('');

    setText('cen_cap_max', 'Capacidade máxima cadastrada: ' + capMax + ' alunos');
  }

  function renderEquilibrio(eq, m, a) {
    if (!eq) {
      renderSemaforo('eqb', { veredito: 'Meta distante', semaforo: 'vermelho' }, '');
      setText('eqb_alunos', '—');
      setText('eqb_custos', fmtMoeda(a.custosTotal));
      setText('eqb_mensal', fmtMoeda(m.precos.mensalidadePadrao));
      setText('eqb_diag', 'Aumente mensalidade ou reduza custos para viabilizar o ponto de equilíbrio.');
      return;
    }
    const saude =
      m.capacidade.alunosAtuais >= eq.alunos
        ? { veredito: 'Acima do equilíbrio', semaforo: 'verde' }
        : { veredito: 'Abaixo do equilíbrio', semaforo: 'amarelo' };
    renderSemaforo('eqb', saude, '');
    setText('eqb_alunos', String(eq.alunos) + ' alunos');
    setText('eqb_custos', fmtMoeda(eq.custosTotal));
    setText('eqb_mensal', fmtMoeda(m.precos.mensalidadePadrao));
    const falta = Math.max(0, eq.alunos - m.capacidade.alunosAtuais);
    setText(
      'eqb_diag',
      falta > 0
        ? 'Faltam ' + falta + ' alunos para cobrir todas as contas com a mensalidade atual.'
        : 'Você já superou o ponto de equilíbrio — lucro operacional positivo.'
    );
  }

  function renderModulo(subtab, m, r) {
    const a = r.atual;
    if (subtab === 'viabilidade') renderViabilidade(a);
    if (subtab === 'capacidade') renderCapacidade(m, a);
    if (subtab === 'preco') renderPreco(a, r.planos);
    if (subtab === 'roi') renderRoi(r.roi);
    if (subtab === 'cenarios') renderCenarios(r.cenarios, m.capacidade.capacidadeMaxima);
    if (subtab === 'equilibrio') renderEquilibrio(r.equilibrio, m, a);
  }

  function recalcular() {
    try {
      panel.querySelectorAll('.input-moeda').forEach((el) => {
        const v = parseMoeda(el.value);
        if (v > 0 || el.value.trim()) el.value = fmtMoeda(v);
      });

      const mestre = lerMestre(form);
      atualizarTotaisMestre(mestre);

      if (!validarMestre(mestre)) return;

      ultimoResultado = { mestre, resultado: calcularGestao(mestre) };

      const subtabAtiva = panel.querySelector('.sub-tab.active');
      const id = subtabAtiva?.getAttribute('data-subtab');
      if (id && id !== 'mestre') renderModulo(id, mestre, ultimoResultado.resultado);
    } catch (err) {
      console.error(err);
    }
  }

  function initSubTabs() {
    panel.querySelectorAll('.sub-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const id = tab.getAttribute('data-subtab');
        panel.querySelectorAll('.sub-tab').forEach((t) => {
          t.classList.toggle('active', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        panel.querySelectorAll('.sub-panel').forEach((p) => {
          const on = p.id === 'sub-' + id;
          p.classList.toggle('active', on);
          p.hidden = !on;
        });
        if (id !== 'mestre' && ultimoResultado) {
          renderModulo(id, ultimoResultado.mestre, ultimoResultado.resultado);
        }
      });
    });
  }

  function preencherDefaults() {
    const d = defaultsMestre();
    const setMoeda = (name, v) => {
      const el = form.elements[name];
      if (el) el.value = fmtMoeda(v);
    };
    const setNum = (name, v) => {
      const el = form.elements[name];
      if (el) el.value = v;
    };

    Object.entries(d.investimento).forEach(([k, v]) => {
      const map = {
        reforma: 'inv_reforma',
        moveis: 'inv_moveis',
        computadores: 'inv_computadores',
        arCondicionado: 'inv_ar',
        identidade: 'inv_identidade',
        materialInicial: 'inv_material',
        outros: 'inv_outros',
      };
      setMoeda(map[k], v);
    });

    setNum('cap_max', d.capacidade.capacidadeMaxima);
    setNum('cap_atuais', d.capacidade.alunosAtuais);
    setNum('cap_turma', d.capacidade.alunosPorTurma);
    setNum('cap_turnos', d.capacidade.turnos);
    setNum('cap_horas_turno', d.capacidade.horasPorTurno);
    setNum('cap_dias', d.capacidade.diasSemana);
    setNum('cap_aulas_sem', d.capacidade.aulasPorSemana);
    setNum('cap_horas_aula', d.capacidade.horasPorAula);
    setNum('cap_carga_prof', d.capacidade.cargaMaxProfSemana);

    setMoeda('pre_mensalidade', d.precos.mensalidadePadrao);
    setNum('pre_desconto', d.precos.descontoAnualVistaPct);
    setMoeda('pre_hora_avulsa', d.precos.horaAvulsa);
    setMoeda('pre_pacote', d.precos.pacoteIntensivo);

    d.equipe.forEach((e) => {
      setNum('eq_' + e.id + '_q', e.quantidade);
      setMoeda('eq_' + e.id + '_s', e.salario);
    });

    Object.entries(d.fixos).forEach(([k, v]) => {
      const map = {
        aluguel: 'fix_aluguel',
        energia: 'fix_energia',
        internet: 'fix_internet',
        agua: 'fix_agua',
        materialEscolar: 'fix_material_esc',
        materialLimpeza: 'fix_material_lim',
        marketing: 'fix_marketing',
        sistemas: 'fix_sistemas',
        contabilidade: 'fix_contabilidade',
        impostos: 'fix_impostos',
        outros: 'fix_outros',
      };
      setMoeda(map[k], v);
    });

    setNum('meta_margem', d.metas.margemLucroPct);
    setNum('meta_reserva', d.metas.reservaReinvestimentoPct);
    setMoeda('meta_prolabore', d.metas.prolaboreSocio);
  }

  aplicarMascaras();
  initSubTabs();
  preencherDefaults();

  form.addEventListener('input', recalcular);
  form.addEventListener('change', recalcular);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    return false;
  });

  document.getElementById('btn-calcular-gestao')?.addEventListener('click', () => {
    recalcular();
    const first = panel.querySelector('.sub-tab[data-subtab="viabilidade"]');
    first?.click();
  });

  document.getElementById('btn-copiar-gestao')?.addEventListener('click', () => {
    if (!ultimoResultado) return;
    const texto = textoAnaliseGestao(ultimoResultado.mestre, ultimoResultado.resultado);
    navigator.clipboard.writeText(texto).then(() => {
      const btn = document.getElementById('btn-copiar-gestao');
      btn.textContent = 'Copiado!';
      setTimeout(() => {
        btn.textContent = 'Copiar análise completa';
      }, 2000);
    });
  });

  document.querySelector('[data-tab="gestao"]')?.addEventListener('click', recalcular);

  recalcular();
})();

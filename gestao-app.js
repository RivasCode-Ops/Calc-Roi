(function () {
  if (!window.CalcEngine || !window.GestaoEngine || !window.FluxoCaixaEngine) return;

  const { fmtMoeda, aplicarMascaraMoeda, parseMoeda } = window.CalcEngine;
  const {
    CARGOS_EQUIPE,
    defaultsMestre,
    lerMestre,
    validarMestre,
    totaisMestre,
    calcularGestao,
    calcularEquilibrioComMensalidade,
    projecaoRoiMensal,
    resumoExecutivo,
    textoAnaliseGestao,
  } = window.GestaoEngine;
  const { lerEntradaFluxoCaixa, calcularFluxoCaixaDoMestre } = window.FluxoCaixaEngine;
  const storage = window.GestaoStorage;
  const charts = window.GestaoCharts;
  const exporter = window.GestaoExport;

  const form = document.getElementById('form-mestre');
  const panel = document.getElementById('panel-gestao');
  if (!form || !panel) return;

  let ultimoResultado = null;
  let debounceSalvar = null;
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

  function agendarSalvar() {
    if (!storage) return;
    clearTimeout(debounceSalvar);
    debounceSalvar = setTimeout(() => {
      if (storage.salvarMestre(form)) {
        setText('storage_hint', 'Dados salvos automaticamente neste navegador.');
      }
    }, 600);
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

  function renderResumoExecutivo(m, r) {
    const box = document.getElementById('gestao-resumo');
    const s = resumoExecutivo(m, r);
    if (!box) return;

    const partes = [
      s.alunos + ' alunos',
      'Lucro ' + fmtMoeda(s.lucro) + '/mês',
      s.margemPct.toFixed(1) + '% margem',
    ];
    if (s.payback) partes.push('Payback ' + s.payback.toFixed(1) + ' meses');
    if (s.equilibrio) partes.push('Equilíbrio ' + s.equilibrio + ' alunos');
    partes.push(iconeSemaforo[s.semaforo] + ' ' + s.veredito);

    setText('resumo_linha', partes.join(' · '));
    box.hidden = false;
    box.className = 'resumo-exec ' + s.semaforo;
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
    if (charts) {
      charts.renderRoi(document.getElementById('chart_roi'), projecaoRoiMensal(roi, 24));
    }
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
    if (charts) {
      charts.renderCenarios(document.getElementById('chart_cenarios'), cenarios);
    }
  }

  function renderEquilibrio(eq, m, a, mensalidadeSimulada) {
    const mensal = mensalidadeSimulada ?? m.precos.mensalidadePadrao;
    const eqSim =
      mensalidadeSimulada != null
        ? calcularEquilibrioComMensalidade(m, mensalidadeSimulada)
        : eq;

    if (!eqSim) {
      renderSemaforo('eqb', { veredito: 'Meta distante', semaforo: 'vermelho' }, '');
      setText('eqb_alunos', '—');
      setText('eqb_custos', fmtMoeda(a.custosTotal));
      setText('eqb_mensal', fmtMoeda(mensal));
      setText('eqb_diag', 'Aumente mensalidade ou reduza custos para viabilizar o ponto de equilíbrio.');
      return;
    }

    const saude =
      m.capacidade.alunosAtuais >= eqSim.alunos
        ? { veredito: 'Acima do equilíbrio', semaforo: 'verde' }
        : { veredito: 'Abaixo do equilíbrio', semaforo: 'amarelo' };
    renderSemaforo('eqb', saude, '');
    setText('eqb_alunos', String(eqSim.alunos) + ' alunos');
    setText('eqb_custos', fmtMoeda(eqSim.custosTotal));
    setText('eqb_mensal', fmtMoeda(mensal));
    const falta = Math.max(0, eqSim.alunos - m.capacidade.alunosAtuais);
    const simNota =
      mensalidadeSimulada != null && mensalidadeSimulada !== m.precos.mensalidadePadrao
        ? ' (simulação com ' + fmtMoeda(mensal) + ')'
        : '';
    setText(
      'eqb_diag',
      falta > 0
        ? 'Faltam ' + falta + ' alunos para cobrir todas as contas' + simNota + '.'
        : 'Você já superou o ponto de equilíbrio — lucro operacional positivo' + simNota + '.'
    );
  }

  function renderFluxoCaixa(m) {
    const fcPanel = document.getElementById('sub-fluxo-caixa');
    if (!fcPanel) return;

    const fcEntrada = lerEntradaFluxoCaixa(fcPanel, parseMoeda);
    const r = calcularFluxoCaixaDoMestre(m, totaisMestre, fcEntrada);
    const v = r.veredito;

    renderSemaforo(
      'fc',
      { veredito: v.texto, semaforo: v.semaforo },
      m.capacidade.alunosAtuais +
        ' alunos · mensalidade ' +
        fmtMoeda(m.precos.mensalidadePadrao) +
        ' · projeção de 1 mês.'
    );

    setText('fc_val_saldo_inicial', fmtMoeda(r.saldoInicial));
    setText('fc_val_entradas', fmtMoeda(r.entradasTotais));
    setText('fc_val_saidas', fmtMoeda(r.saidasTotais));
    setText('fc_val_fluxo', fmtMoeda(r.fluxoMes));
    setText('fc_val_saldo_final', fmtMoeda(r.saldoFinal));

    setText('fc_det_receita_bruta', fmtMoeda(r.receitaBruta));
    setText(
      'fc_det_receita_ajustada',
      fmtMoeda(r.receitaBrutaAjustada) +
        ' (' +
        r.alunosPagantes.toFixed(1).replace('.', ',') +
        ' pagantes)'
    );
    setText('fc_det_inadimplencia', '− ' + fmtMoeda(r.perdaInadimplencia));
    setText('fc_det_receita_liquida', fmtMoeda(r.receitaLiquidaMensalidades));
    setText('fc_det_outras_entradas', fmtMoeda(fcEntrada.outrosEntradas));

    setText('fc_det_operacao', fmtMoeda(r.saidasOperacionais));
    setText('fc_det_investimentos', fmtMoeda(r.investimentosMes));
    setText('fc_det_outras_saidas', fmtMoeda(r.outrosSaidas));
  }

  function renderModulo(subtab, m, r, opts) {
    const a = r.atual;
    if (subtab === 'viabilidade') renderViabilidade(a);
    if (subtab === 'capacidade') renderCapacidade(m, a);
    if (subtab === 'preco') renderPreco(a, r.planos);
    if (subtab === 'roi') renderRoi(r.roi);
    if (subtab === 'cenarios') renderCenarios(r.cenarios, m.capacidade.capacidadeMaxima);
    if (subtab === 'equilibrio') {
      renderEquilibrio(r.equilibrio, m, a, opts?.mensalidadeSimulada);
    }
    if (subtab === 'fluxo-caixa') renderFluxoCaixa(m);
  }

  function recalcular() {
    try {
      panel.querySelectorAll('.input-moeda').forEach((el) => {
        const v = parseMoeda(el.value);
        if (v > 0 || el.value.trim()) el.value = fmtMoeda(v);
      });

      const mestre = lerMestre(form);
      atualizarTotaisMestre(mestre);
      agendarSalvar();

      if (!validarMestre(mestre)) return;

      ultimoResultado = { mestre, resultado: calcularGestao(mestre) };
      renderResumoExecutivo(mestre, ultimoResultado.resultado);

      const slider = document.getElementById('eqb_slider');
      const mensalSim = slider ? parseInt(slider.value, 10) : null;

      const subtabAtiva = panel.querySelector('.sub-tab.active');
      const id = subtabAtiva?.getAttribute('data-subtab');
      if (id && id !== 'mestre') {
        renderModulo(id, mestre, ultimoResultado.resultado, {
          mensalidadeSimulada:
            id === 'equilibrio' && mensalSim ? mensalSim : undefined,
        });
      }
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
          const slider = document.getElementById('eqb_slider');
          renderModulo(id, ultimoResultado.mestre, ultimoResultado.resultado, {
            mensalidadeSimulada:
              id === 'equilibrio' && slider ? parseInt(slider.value, 10) : undefined,
          });
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

  function initSliderEquilibrio() {
    const slider = document.getElementById('eqb_slider');
    if (!slider) return;

    slider.addEventListener('input', () => {
      const v = parseInt(slider.value, 10);
      setText('eqb_slider_val', fmtMoeda(v));
      if (ultimoResultado) {
        renderEquilibrio(
          ultimoResultado.resultado.equilibrio,
          ultimoResultado.mestre,
          ultimoResultado.resultado.atual,
          v
        );
      }
    });
  }

  function syncSliderComMensalidade() {
    const slider = document.getElementById('eqb_slider');
    const mestre = ultimoResultado?.mestre || lerMestre(form);
    if (!slider || !mestre.precos.mensalidadePadrao) return;
    const m = mestre.precos.mensalidadePadrao;
    slider.min = Math.max(200, Math.floor(m * 0.5));
    slider.max = Math.ceil(m * 2);
    slider.step = 25;
    slider.value = m;
    setText('eqb_slider_val', fmtMoeda(m));
  }

  function initFluxoCaixaInputs() {
    const fcPanel = document.getElementById('sub-fluxo-caixa');
    if (!fcPanel) return;
    fcPanel.querySelectorAll('input').forEach((el) => {
      el.addEventListener('input', recalcular);
      el.addEventListener('change', recalcular);
    });
  }

  aplicarMascaras();
  initSubTabs();
  initSliderEquilibrio();
  initFluxoCaixaInputs();

  let carregou = false;
  if (storage) {
    const payload = storage.carregarMestre(form);
    if (payload) {
      carregou = true;
      setText(
        'storage_hint',
        'Dados restaurados de ' + storage.formatarDataSalva(payload.savedAt) + '.'
      );
    }
  }
  if (!carregou) preencherDefaults();

  form.addEventListener('input', () => {
    recalcular();
    syncSliderComMensalidade();
  });
  form.addEventListener('change', recalcular);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    return false;
  });

  document.getElementById('btn-calcular-gestao')?.addEventListener('click', () => {
    recalcular();
    syncSliderComMensalidade();
    panel.querySelector('.sub-tab[data-subtab="viabilidade"]')?.click();
  });

  document.getElementById('btn-copiar-gestao')?.addEventListener('click', () => {
    if (!ultimoResultado) return;
    const texto = textoAnaliseGestao(ultimoResultado.mestre, ultimoResultado.resultado);
    navigator.clipboard.writeText(texto).then(() => {
      const btn = document.getElementById('btn-copiar-gestao');
      btn.textContent = 'Copiado!';
      setTimeout(() => {
        btn.textContent = 'Copiar análise';
      }, 2000);
    });
  });

  document.getElementById('btn-pdf-gestao')?.addEventListener('click', () => {
    if (!ultimoResultado || !exporter) return;
    try {
      exporter.exportarPdfGestao(
        ultimoResultado.mestre,
        ultimoResultado.resultado,
        fmtMoeda
      );
    } catch (err) {
      console.error(err);
      alert('Não foi possível gerar o PDF. Atualize a página (Ctrl+F5) e tente de novo.');
    }
  });

  document.getElementById('btn-limpar-storage')?.addEventListener('click', () => {
    if (!storage) return;
    if (!confirm('Apagar dados salvos e voltar aos valores padrão?')) return;
    storage.limparMestre();
    preencherDefaults();
    recalcular();
    syncSliderComMensalidade();
    setText('storage_hint', 'Dados padrão restaurados.');
  });

  document.querySelector('[data-tab="gestao"]')?.addEventListener('click', recalcular);

  recalcular();
  syncSliderComMensalidade();
})();

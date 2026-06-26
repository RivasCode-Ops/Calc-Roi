(function () {
  const engine = window.ReforcoPricingEngine;
  const calcFmt = window.CalcEngine?.fmtMoeda;

  if (!engine) {
    console.error('ReforcoPricingEngine não carregou.');
    return;
  }

  function fmtMoeda(v) {
    if (calcFmt) return calcFmt(v);
    return (
      'R$ ' +
      Number(v).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function fmtPct(v) {
    return Number(v).toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  }

  const form = document.getElementById('form-reforco');
  const resultado = document.getElementById('reforco-resultado');
  if (!form || !resultado) return;

  const selSegmento = document.getElementById('reforco_segmento');
  const selModalidade = document.getElementById('reforco_modalidade');

  function popularSelects() {
    if (selSegmento) {
      selSegmento.innerHTML = engine
        .listarSegmentos()
        .map(
          (s) =>
            `<option value="${s.id}">${s.label} — R$ ${s.valorHoraBase}/h</option>`
        )
        .join('');
    }
    if (selModalidade) {
      selModalidade.innerHTML = engine
        .listarModalidades()
        .map((m) => {
          const pct = Math.round(m.fatorPorAluno * 100);
          return `<option value="${m.id}">${m.label} (${pct}% base/aluno)</option>`;
        })
        .join('');
    }
  }

  function lerEntrada() {
    return {
      segmentoId: selSegmento?.value,
      modalidadeId: selModalidade?.value,
      aulasPorSemana: parseInt(
        document.getElementById('reforco_aulas_semana')?.value,
        10
      ),
      duracaoMinutos: parseInt(
        document.getElementById('reforco_duracao')?.value,
        10
      ),
    };
  }

  function mostrarErro(msg) {
    resultado.className = 'result vermelho';
    resultado.style.display = 'block';
    document.getElementById('reforco_bola').className = 'bola vermelho';
    document.getElementById('reforco_rotulo').textContent = 'Revise os campos';
    document.getElementById('reforco_destaque').textContent = msg;
    document.getElementById('reforco_obs').innerHTML = '';
    resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderResultado(r) {
    document.getElementById('reforco_bola').className = 'bola verde';
    document.getElementById('reforco_rotulo').textContent = 'Mensalidade sugerida';
    document.getElementById('reforco_destaque').innerHTML =
      '<strong>' +
      fmtMoeda(r.mensalidadePorAluno) +
      '</strong> por aluno/mês · ' +
      r.modalidade +
      ' · ' +
      r.segmento;

    document.getElementById('reforco_valor_aula').textContent = fmtMoeda(r.valorPorAula);
    document.getElementById('reforco_aulas_mes').textContent =
      r.aulasPorMes + ' (' + r.aulasPorSemana + '/semana × ' + r.semanasPorMes + ' sem.)';
    document.getElementById('reforco_desconto').textContent =
      r.descontoPct > 0
        ? fmtPct(r.descontoPct) + '% — ' + r.faixaDesconto
        : 'Nenhum';
    document.getElementById('reforco_mensalidade').textContent = fmtMoeda(
      r.mensalidadePorAluno
    );
    document.getElementById('reforco_subtotal').textContent = fmtMoeda(r.subtotalMensal);

    const receitaRow = document.getElementById('reforco_receita_row');
    if (r.alunosReferencia > 1) {
      receitaRow.hidden = false;
      document.getElementById('reforco_receita_turma').textContent = fmtMoeda(
        r.receitaTurmaMensal
      );
      document.getElementById('reforco_receita_rot').textContent =
        'Receita turma (' + r.alunosReferencia + ' alunos ref.)';
    } else {
      receitaRow.hidden = true;
    }

    document.getElementById('reforco_obs').innerHTML =
      '<p class="cenarios-title">Regras aplicadas</p><ul class="obs-list">' +
      r.observacoes.map((o) => '<li>' + o + '</li>').join('') +
      '</ul>';

    resultado.className = 'result verde';
    resultado.style.display = 'block';
    resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function calcular() {
    try {
      const r = engine.calcularPrecoReforco(lerEntrada());
      if (!r.ok) {
        mostrarErro(r.erro || 'Verifique os campos informados.');
        return;
      }
      renderResultado(r);
    } catch (err) {
      console.error(err);
      mostrarErro('Erro ao calcular. Atualize a página (Ctrl+F5).');
    }
  }

  popularSelects();
  document.getElementById('btn-reforco-calcular')?.addEventListener('click', calcular);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calcular();
  });
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      calcular();
    }
  });
})();

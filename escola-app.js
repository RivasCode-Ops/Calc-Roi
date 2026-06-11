(function () {
  if (!window.CalcEngine || !window.EscolaEngine) return;

  const { fmtMoeda, aplicarMascaraMoeda, parseMoeda } = window.CalcEngine;
  const {
    lerEntradaEscola,
    validarEntradaEscola,
    calcularEscola,
    proximosDegraus,
    montarCenarios,
    textoAnaliseEscola,
  } = window.EscolaEngine;

  const form = document.getElementById('form-escola');
  const resultado = document.getElementById('resultado-escola');
  if (!form || !resultado) return;

  let ultimoPacote = null;

  document.querySelectorAll('#panel-escola .input-moeda').forEach((el) => {
    el.addEventListener('input', () => aplicarMascaraMoeda(el));
    el.addEventListener('blur', () => {
      const v = parseMoeda(el.value);
      if (v > 0 || el.value.trim()) el.value = fmtMoeda(v);
    });
  });

  function renderResultado(entrada, r, alertas, cenarios) {
    document.getElementById('esc_bola').className = 'bola ' + r.semaforo;
    document.getElementById('esc_rotulo').textContent = r.veredito;
    document.getElementById('esc_diag').textContent = r.diagnostico;

    document.getElementById('esc_turmas').textContent = r.turmas + ' grupos';
    document.getElementById('esc_horas').textContent =
      r.horasCargaTotal.toFixed(1) + ' h total (' + r.horasPorAluno.toFixed(1) + ' h/aluno)';
    document.getElementById('esc_prof').textContent = String(r.professoras);
    document.getElementById('esc_salas').textContent = String(r.salas);
    document.getElementById('esc_recep').textContent = String(r.recepcionistas);
    document.getElementById('esc_limpeza').textContent = String(r.equipeLimpeza);

    document.getElementById('esc_fat').textContent = fmtMoeda(r.faturamento);
    document.getElementById('esc_custos_prof').textContent = fmtMoeda(r.custoProfessoras);
    document.getElementById('esc_custos_fixos').textContent = fmtMoeda(r.custosFixos);
    document.getElementById('esc_custos').textContent = fmtMoeda(r.custosTotal);
    document.getElementById('esc_lucro').textContent =
      fmtMoeda(r.lucro) + ' (' + r.margemPct.toFixed(1) + '%)';
    document.getElementById('esc_folha').textContent = r.folhaPct.toFixed(1) + '% do faturamento';
    document.getElementById('esc_mensal_min').textContent = fmtMoeda(r.mensalidadeMinima) + '/aluno';

    document.getElementById('esc_cadeiras').textContent = String(r.estrutura.cadeiras);
    document.getElementById('esc_mesas').textContent = String(r.estrutura.mesas);
    document.getElementById('esc_quadros').textContent = String(r.estrutura.quadros);
    document.getElementById('esc_ac').textContent = String(r.estrutura.arCondicionado);

    document.getElementById('esc_degraus').innerHTML = alertas.map((a) => '<li>' + a + '</li>').join('');

    document.getElementById('esc_cenarios').innerHTML = cenarios
      .map(
        (c) => `
      <div class="cenario-card ${c.semaforo}${c.atual ? ' atual' : ''}" aria-label="${c.alunos} alunos">
        <div class="cenario-head">
          <span class="cenario-nome">${c.alunos} alunos${c.atual ? ' · seu cenário' : ''}</span>
          <span class="cenario-veredito">${c.veredito}</span>
        </div>
        <div class="cenario-lucro">${fmtMoeda(c.lucro)}</div>
        <div class="cenario-meta">${c.professoras} prof. · ${c.salas} salas</div>
      </div>`
      )
      .join('');

    resultado.className = 'result ' + r.semaforo;
    resultado.style.display = 'block';
    resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function mostrarErro(msg) {
    resultado.className = 'result vermelho';
    resultado.style.display = 'block';
    document.getElementById('esc_bola').className = 'bola vermelho';
    document.getElementById('esc_rotulo').textContent = 'Revise os campos';
    document.getElementById('esc_diag').textContent = msg;
  }

  function calcular() {
    try {
      document.querySelectorAll('#panel-escola .input-moeda').forEach((el) => {
        const v = parseMoeda(el.value);
        if (v > 0 || el.value.trim()) el.value = fmtMoeda(v);
      });

      const entrada = lerEntradaEscola(form);
      if (!validarEntradaEscola(entrada)) {
        mostrarErro('Faltam ou estão inválidos: ' + (entrada._faltando?.join(', ') || 'campos') + '.');
        return;
      }

      const r = calcularEscola(entrada);
      const alertas = proximosDegraus(entrada, r);
      const cenarios = montarCenarios(entrada);
      ultimoPacote = { entrada, r, alertas, cenarios };
      renderResultado(entrada, r, alertas, cenarios);
    } catch (err) {
      console.error(err);
      mostrarErro('Erro ao calcular. Atualize a página (Ctrl+F5).');
    }
  }

  document.getElementById('btn-calcular-escola')?.addEventListener('click', calcular);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calcular();
    return false;
  });

  document.getElementById('btn-copiar-escola')?.addEventListener('click', () => {
    if (!ultimoPacote) return;
    const texto = textoAnaliseEscola(
      ultimoPacote.entrada,
      ultimoPacote.r,
      ultimoPacote.alertas,
      ultimoPacote.cenarios
    );
    navigator.clipboard.writeText(texto).then(() => {
      const btn = document.getElementById('btn-copiar-escola');
      btn.textContent = 'Copiado!';
      setTimeout(() => {
        btn.textContent = 'Copiar análise';
      }, 2000);
    });
  });

  document.querySelector('[data-tab="escola"]')?.addEventListener('click', () => {
    if (resultado.style.display !== 'block') calcular();
  });
})();

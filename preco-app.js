(function () {

  if (!window.CalcEngine || !window.PrecoEngine) return;



  const { fmtMoeda, aplicarMascaraMoeda, parseMoeda } = window.CalcEngine;

  const { lerEntradaPreco, validarEntradaPreco, calcularPreco, textoAnalisePreco } =

    window.PrecoEngine;



  const form = document.getElementById('form-preco');

  const resultado = document.getElementById('resultado-preco');

  if (!form || !resultado) return;



  let ultimoPacote = null;



  document.querySelectorAll('#panel-preco .input-moeda').forEach((el) => {

    el.addEventListener('input', () => aplicarMascaraMoeda(el));

    el.addEventListener('blur', () => {

      const v = parseMoeda(el.value);

      if (v > 0 || el.value.trim()) el.value = fmtMoeda(v);

    });

  });



  function renderResultado(entrada, r) {

    document.getElementById('pre_bola').className = 'bola ' + r.semaforo;

    document.getElementById('pre_rotulo').textContent = r.veredito;

    document.getElementById('pre_diag').textContent = r.diagnostico;



    document.getElementById('pre_custo_encontro').textContent = fmtMoeda(r.custoPorEncontro);

    document.getElementById('pre_piso_aula').textContent = fmtMoeda(r.pisoPorAula);

    document.getElementById('pre_piso_mes').textContent = fmtMoeda(r.pisoMensalAluno);

    document.getElementById('pre_gap').textContent =

      r.gapPisoVsReal > 0 ? r.gapPisoVsReal.toFixed(1) + '× abaixo do custo real' : '—';



    document.getElementById('pre_custo_prof').textContent = fmtMoeda(r.custoProfessorMes);

    document.getElementById('pre_custo_real').textContent = fmtMoeda(r.custoRealPorAluno);

    document.getElementById('pre_minimo').textContent = fmtMoeda(r.precoMinimo);

    document.getElementById('pre_margem').textContent = r.margemEfetivaPct.toFixed(1) + '%';



    document.getElementById('pre_plano_12').textContent = fmtMoeda(r.planoAnual12x) + '/mês';

    document.getElementById('pre_plano_vista').textContent = fmtMoeda(r.planoAnualVista);

    document.getElementById('pre_plano_vista_det').textContent =

      '12 × ' + fmtMoeda(r.planoAnual12x) + ' − 10%';



    document.getElementById('pre_hora_rec').textContent =

      fmtMoeda(r.horaRecuperacaoMin) + ' – ' + fmtMoeda(r.horaRecuperacaoMax);

    document.getElementById('pre_pacote_10').textContent =
      '10h: ' + fmtMoeda(r.pacote10Min) + ' – ' + fmtMoeda(r.pacote10Max);
    document.getElementById('pre_pacote_20').textContent =
      '20h: ' + fmtMoeda(r.pacote20Min) + ' – ' + fmtMoeda(r.pacote20Max);



    if (entrada.mensalidadeReferencia > 0) {

      document.getElementById('pre_ref_row').hidden = false;

      document.getElementById('pre_ref_lucro').textContent =

        fmtMoeda(r.lucroReferencia) + ' (' + r.margemReferenciaPct.toFixed(1) + '%)';

    } else {

      document.getElementById('pre_ref_row').hidden = true;

    }



    resultado.className = 'result ' + r.semaforo;

    resultado.style.display = 'block';

    resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  }



  function mostrarErro(msg) {

    resultado.className = 'result vermelho';

    resultado.style.display = 'block';

    document.getElementById('pre_bola').className = 'bola vermelho';

    document.getElementById('pre_rotulo').textContent = 'Revise os campos';

    document.getElementById('pre_diag').textContent = msg;

  }



  function calcular() {

    try {

      document.querySelectorAll('#panel-preco .input-moeda').forEach((el) => {

        const v = parseMoeda(el.value);

        if (v > 0 || el.value.trim()) el.value = fmtMoeda(v);

      });



      const entrada = lerEntradaPreco(form);

      if (!validarEntradaPreco(entrada)) {

        mostrarErro('Faltam ou estão inválidos: ' + (entrada._faltando?.join(', ') || 'campos') + '.');

        return;

      }



      const r = calcularPreco(entrada);

      ultimoPacote = { entrada, r };

      renderResultado(entrada, r);

    } catch (err) {

      console.error(err);

      mostrarErro('Erro ao calcular. Atualize a página (Ctrl+F5).');

    }

  }



  document.getElementById('btn-calcular-preco')?.addEventListener('click', calcular);

  form.addEventListener('submit', (e) => {

    e.preventDefault();

    calcular();

    return false;

  });



  document.getElementById('btn-copiar-preco')?.addEventListener('click', () => {

    if (!ultimoPacote) return;

    const texto = textoAnalisePreco(ultimoPacote.entrada, ultimoPacote.r);

    navigator.clipboard.writeText(texto).then(() => {

      const btn = document.getElementById('btn-copiar-preco');

      btn.textContent = 'Copiado!';

      setTimeout(() => {

        btn.textContent = 'Copiar análise';

      }, 2000);

    });

  });



  document.querySelector('[data-tab="preco"]')?.addEventListener('click', () => {

    if (resultado.style.display !== 'block') calcular();

  });

})();



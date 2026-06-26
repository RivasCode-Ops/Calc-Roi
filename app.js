(function () {
  if (!window.CalcEngine) {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<p style="color:#e53935;text-align:center;margin:16px">Erro ao carregar a calculadora. Atualize com Ctrl+F5.</p>'
    );
    return;
  }

  const {
    calcularTodosCenarios,
    fmtMoeda,
    aplicarMascaraMoeda,
    parseMoeda,
    fmtPercentual,
    taxaAnualDeMensal,
    normalizarTaxaMensal,
    normalizarCamposMoeda,
    lerEntradaDoForm,
    textoAnalise,
    validarEntrada,
  } = window.CalcEngine;

  const form = document.getElementById('form-roi');
  const resultado = document.getElementById('resultado');
  const cenariosEl = document.getElementById('cenarios');
  const toggleAvancado = document.getElementById('toggle-avancado');
  const avancado = document.getElementById('avancado');
  const roiStorage = window.RoiStorage;
  const listaCenariosEl = document.getElementById('roi_cenarios_lista');
  const msgCenariosEl = document.getElementById('roi_cenarios_msg');
  const inputNomeCenario = document.getElementById('roi_cenario_nome');

  if (!form || !resultado) return;

  let ultimoPacote = null;

  function setMsgCenarios(texto, tipo) {
    if (!msgCenariosEl) return;
    msgCenariosEl.textContent = texto || '';
    msgCenariosEl.style.color = tipo === 'erro' ? '#e53935' : '#888';
  }

  function renderListaCenarios() {
    if (!listaCenariosEl || !roiStorage) return;
    const lista = roiStorage.listar();
    if (!lista.length) {
      listaCenariosEl.innerHTML =
        '<li class="cenarios-salvos-vazio">Nenhum cenário salvo ainda. Calcule e use &quot;Salvar cenário&quot;.</li>';
      return;
    }

    listaCenariosEl.innerHTML = lista
      .map((item) => {
        const res = item.resumo || {};
        const lucro =
          res.lucroMensal != null ? fmtMoeda(res.lucroMensal) + '/mês' : '—';
        const meta = [
          lucro,
          res.roiAnualPercentual != null ? res.roiAnualPercentual.toFixed(1) + '% a.a.' : null,
          res.vpl != null ? 'VPL ' + fmtMoeda(res.vpl) : null,
          res.veredito || null,
          roiStorage.formatarDataSalva(item.savedAt),
        ]
          .filter(Boolean)
          .join(' · ');
        const sem = res.semaforo || '';
        return `
        <li class="cenario-salvo-item ${sem}">
          <div class="cenario-salvo-info">
            <div class="cenario-salvo-nome">${escapeHtml(item.nome)}</div>
            <div class="cenario-salvo-meta">${escapeHtml(meta)}</div>
          </div>
          <div class="cenario-salvo-acoes">
            <button type="button" class="btn-mini" data-acao="carregar" data-id="${item.id}">Carregar</button>
            <button type="button" class="btn-mini danger" data-acao="excluir" data-id="${item.id}">Excluir</button>
          </div>
        </li>`;
      })
      .join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function carregarCenarioSalvo(id) {
    if (!roiStorage) return;
    const item = roiStorage.obter(id);
    if (!item) {
      setMsgCenarios('Cenário não encontrado.', 'erro');
      renderListaCenarios();
      return;
    }
    roiStorage.aplicarFormulario(form, item.formData);
    document.querySelectorAll('.input-moeda').forEach(formatarCampoMoeda);
    atualizarHintRendimento();
    if (inputNomeCenario) inputNomeCenario.value = item.nome;
    setMsgCenarios('Cenário "' + item.nome + '" carregado. Revise e clique em Analisar.', null);
    calcular();
  }

  function excluirCenarioSalvo(id) {
    if (!roiStorage) return;
    const item = roiStorage.obter(id);
    if (!item) {
      renderListaCenarios();
      return;
    }
    if (!window.confirm('Excluir o cenário "' + item.nome + '"?')) return;
    roiStorage.remover(id);
    setMsgCenarios('Cenário "' + item.nome + '" excluído.', null);
    renderListaCenarios();
  }

  function salvarCenarioAtual() {
    if (!roiStorage) return;
    if (!ultimoPacote) {
      setMsgCenarios('Calcule primeiro para salvar um cenário.', 'erro');
      return;
    }
    const nome = inputNomeCenario?.value || '';
    const res = roiStorage.salvar(nome, form, ultimoPacote.base);
    if (!res.ok) {
      setMsgCenarios(res.erro, 'erro');
      return;
    }
    setMsgCenarios('Cenário "' + res.item.nome + '" salvo.', null);
    if (inputNomeCenario) inputNomeCenario.value = '';
    renderListaCenarios();
  }

  function atualizarHintRendimento() {
    const hint = document.getElementById('hint_rendimento');
    if (!hint) return;
    const inv = parseMoeda(document.getElementById('investimento')?.value);
    const taxaMes = normalizarTaxaMensal(document.getElementById('selicMes')?.value);
    if (taxaMes <= 0) {
      hint.textContent =
        'Informe % ao mês (ex.: 0,75) ou % ao ano (ex.: 9) — o sistema ajusta e calcula o equivalente.';
      return;
    }
    const taxaAno = taxaAnualDeMensal(taxaMes);
    let texto = 'Equivale a ' + fmtPercentual(taxaAno) + '% a.a. (calculado automaticamente)';
    if (inv > 0) {
      const rfMes = inv * (taxaMes / 100);
      const rfAno = inv * (taxaAno / 100);
      texto += ' · rende ' + fmtMoeda(rfMes) + '/mês · ' + fmtMoeda(rfAno) + '/ano';
    }
    hint.textContent = texto;
  }

  function formatarCampoMoeda(el) {
    if (!el) return;
    const valor = parseMoeda(el.value);
    if (valor > 0 || el.value.trim()) el.value = fmtMoeda(valor);
  }

  document.querySelectorAll('.input-moeda').forEach((el) => {
    el.addEventListener('input', () => {
      aplicarMascaraMoeda(el);
      atualizarHintRendimento();
    });
    el.addEventListener('blur', () => formatarCampoMoeda(el));
  });

  document.getElementById('selicMes')?.addEventListener('input', atualizarHintRendimento);
  document.getElementById('selicMes')?.addEventListener('blur', atualizarHintRendimento);

  toggleAvancado?.addEventListener('click', () => {
    const aberto = avancado.hidden;
    avancado.hidden = !aberto;
    toggleAvancado.setAttribute('aria-expanded', String(aberto));
    toggleAvancado.textContent = aberto
      ? 'Ocultar opções avançadas'
      : 'Depreciação, pró-labore e cenários';
  });

  function renderCenarioCard(nome, r) {
    return `
    <div class="cenario-card ${r.semaforo}" aria-label="Cenário ${nome}">
      <div class="cenario-head">
        <span class="cenario-nome">${nome}</span>
        <span class="cenario-veredito">${r.veredito}</span>
      </div>
      <div class="cenario-lucro">${fmtMoeda(r.lucroMensal)}</div>
      <div class="cenario-meta">ROI ${r.roiMensalPercentual.toFixed(2)}% · ${r.clientes} clientes</div>
    </div>`;
  }

  function renderBase(r, taxaAnual) {
    document.getElementById('bola').className = 'bola ' + r.semaforo;
    document.getElementById('rotulo').textContent = r.veredito;

    document.getElementById('cmp_rf_ano').textContent = fmtMoeda(r.rendimentoPassivoAnual) + '/ano';
    const taxaMes = taxaAnual / 12;
    document.getElementById('cmp_rf_mes').textContent =
      fmtMoeda(r.rendimentoPassivoMensal) +
      '/mês · ' +
      fmtPercentual(taxaMes) +
      '% a.m. · ' +
      fmtPercentual(taxaAnual) +
      '% a.a.';
    document.getElementById('cmp_neg_ano').textContent = fmtMoeda(r.lucroAnual) + '/ano';
    document.getElementById('cmp_neg_mes').textContent =
      fmtMoeda(r.lucroMensal) + '/mês · ROI ' + r.roiAnualPercentual.toFixed(2) + '% a.a.';

    const diffAnual = r.diferencialRendaFixaAnual;
    document.getElementById('cmp_diff').textContent =
      (diffAnual >= 0 ? 'Negócio ganha ' : 'Aplicação ganha ') +
      fmtMoeda(Math.abs(diffAnual)) +
      ' a mais por ano';

    document.getElementById('r_fat').textContent = fmtMoeda(r.faturamentoMensal);
    document.getElementById('r_lucro').textContent = fmtMoeda(r.lucroMensal);
    document.getElementById('r_roi').textContent =
      r.roiMensalPercentual.toFixed(2) + '%/mês · ' + r.roiAnualPercentual.toFixed(2) + '%/ano';
    document.getElementById('r_pay').textContent =
      r.paybackMeses == null ? '—' : r.paybackMeses.toFixed(1) + ' meses';

    const meses = r.horizonteAnaliseMeses || 60;
    document.getElementById('r_vpl_rot').textContent =
      'VPL (' + meses + ' meses, taxa aplicação)';
    document.getElementById('r_vpl').textContent = fmtMoeda(r.vpl);

    if (r.tirMensalPercentual != null) {
      document.getElementById('r_tir').textContent =
        fmtPercentual(r.tirMensalPercentual) +
        '% a.m. · ' +
        fmtPercentual(r.tirAnualPercentual) +
        '% a.a. (efetiva)';
    } else {
      document.getElementById('r_tir').textContent = '—';
    }

    const diff = r.diferencialRendaFixa;
    document.getElementById('r_diff').textContent =
      (diff >= 0 ? '+ ' : '− ') + fmtMoeda(Math.abs(diff));

    const depRow = document.getElementById('r_dep_row');
    if (r.depreciacaoAnual > 0) {
      depRow.hidden = false;
      document.getElementById('r_dep').textContent =
        fmtMoeda(r.depreciacaoAnual) + '/ano (' + fmtMoeda(r.depreciacaoMensal) + '/mês)';
    } else {
      depRow.hidden = true;
    }

    const destaque = document.getElementById('destaque');
    destaque.className = 'destaque ' + r.semaforo;
    if (r.lucroMensal <= 0) {
      destaque.textContent =
        'O negócio opera no vermelho. Reveja custos, ticket, clientes ou pró-labore.';
    } else if (r.semaforo === 'verde') {
      destaque.innerHTML =
        'Lucro <strong>' +
        fmtMoeda(r.lucroMensal) +
        '</strong>/mês vs renda fixa <strong>' +
        fmtMoeda(r.rendimentoPassivoMensal) +
        '</strong>/mês — diferença <strong>' +
        fmtMoeda(diff) +
        '</strong> a favor do negócio.';
    } else if (r.semaforo === 'amarelo') {
      destaque.textContent =
        'Lucro positivo (' +
        fmtMoeda(r.lucroMensal) +
        '), mas o retorno ainda é baixo para o risco em relação à renda fixa.';
    } else {
      destaque.innerHTML =
        'Melhor aplicado: renda fixa renderia <strong>' +
        fmtMoeda(r.rendimentoPassivoMensal) +
        '</strong>/mês vs lucro <strong>' +
        fmtMoeda(r.lucroMensal) +
        '</strong>.';
    }

    resultado.className = 'result ' + r.semaforo;
    resultado.style.display = 'block';
  }

  function mostrarErro(mensagem) {
    resultado.className = 'result vermelho';
    resultado.style.display = 'block';
    document.getElementById('bola').className = 'bola vermelho';
    document.getElementById('rotulo').textContent = 'Revise os campos';
    document.getElementById('destaque').textContent = mensagem;
    cenariosEl.innerHTML = '';
    document.getElementById('feedback').style.display = 'none';
    atualizarHintRendimento();
    resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function calcular() {
    try {
      document.getElementById('fb_obrigado').style.display = 'none';
      document.querySelectorAll('.fb-btn').forEach((b) => b.classList.remove('selecionado'));

      normalizarCamposMoeda(form);
      document.querySelectorAll('.input-moeda').forEach(formatarCampoMoeda);

      const entrada = lerEntradaDoForm(form);
      if (!validarEntrada(entrada)) {
        const lista = entrada._faltando?.join(', ') || 'campos obrigatórios';
        mostrarErro('Faltam ou estão inválidos: ' + lista + '.');
        return;
      }

      document.getElementById('feedback').style.display = 'block';
      const todos = calcularTodosCenarios(entrada);
      const base = todos.base;
      ultimoPacote = { entrada, base, todos };

      renderBase(base, entrada.taxaRendaFixaAnual);
      cenariosEl.innerHTML = [
        renderCenarioCard('Pessimista (−25% clientes)', todos.pessimista),
        renderCenarioCard('Base', todos.base),
        renderCenarioCard('Otimista (+25% clientes)', todos.otimista),
      ].join('');
      atualizarHintRendimento();
      resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error(err);
      mostrarErro('Erro ao calcular. Atualize a página (Ctrl+F5) e tente de novo.');
    }
  }

  function preencherDaUrl() {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return false;

    const mapa = {
      investimento: 'investimento',
      clientes: 'clientes',
      ticket: 'ticket',
      custos: 'custos',
      selicMes: 'selicMes',
      selic: 'selicMes',
      prolabore: 'prolabore',
      equipamentos: 'equipamentos',
      vidaUtil: 'vidaUtil',
      horizonte: 'horizonte',
    };

    let preencheu = false;
    for (const [param, id] of Object.entries(mapa)) {
      const val = params.get(param);
      if (val == null || val === '') continue;
      const el = document.getElementById(id);
      if (!el) continue;
      el.value = decodeURIComponent(val.replace(/\+/g, ' '));
      preencheu = true;
    }

    document.querySelectorAll('.input-moeda').forEach(formatarCampoMoeda);
    atualizarHintRendimento();
    return preencheu;
  }

  document.getElementById('btn-calcular')?.addEventListener('click', calcular);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calcular();
    return false;
  });
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      calcular();
    }
  });

  document.getElementById('btn-copiar')?.addEventListener('click', () => {
    if (!ultimoPacote) return;
    const texto = textoAnalise(ultimoPacote.entrada, ultimoPacote.base);
    navigator.clipboard.writeText(texto).then(() => {
      const btn = document.getElementById('btn-copiar');
      btn.textContent = 'Copiado!';
      setTimeout(() => {
        btn.textContent = 'Copiar análise';
      }, 2000);
    });
  });

  document.getElementById('btn-salvar-cenario')?.addEventListener('click', salvarCenarioAtual);
  inputNomeCenario?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      salvarCenarioAtual();
    }
  });
  listaCenariosEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (btn.getAttribute('data-acao') === 'carregar') carregarCenarioSalvo(id);
    if (btn.getAttribute('data-acao') === 'excluir') excluirCenarioSalvo(id);
  });

  renderListaCenarios();

  window.feedback = function feedback(resp) {
    document.querySelectorAll('.fb-btn').forEach((b) => b.classList.remove('selecionado'));
    document.querySelector(`.fb-btn[data-resp="${resp}"]`)?.classList.add('selecionado');
    const obrigado = document.getElementById('fb_obrigado');
    obrigado.style.display = 'block';
    const msgs = {
      sim: 'Obrigado! Boa sorte no negócio.',
      nao: 'Obrigado! Cautela também é estratégia.',
      talvez: 'Obrigado! Compare os três cenários abaixo.',
    };
    obrigado.textContent = msgs[resp] || 'Obrigado!';
  };

  if (preencherDaUrl()) {
    history.replaceState(null, '', window.location.pathname);
    calcular();
  }
})();

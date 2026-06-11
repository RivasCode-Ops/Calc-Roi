const {
  calcularTodosCenarios,
  fmtMoeda,
  lerEntradaDoForm,
  textoAnalise,
  validarEntrada,
} = window.CalcEngine;

const form = document.getElementById('form-roi');
const resultado = document.getElementById('resultado');
const cenariosEl = document.getElementById('cenarios');
const toggleAvancado = document.getElementById('toggle-avancado');
const avancado = document.getElementById('avancado');

let ultimoPacote = null;

toggleAvancado?.addEventListener('click', () => {
  const aberto = avancado.hidden;
  avancado.hidden = !aberto;
  toggleAvancado.setAttribute('aria-expanded', String(aberto));
  toggleAvancado.textContent = aberto ? 'Ocultar opções avançadas' : 'Depreciação, pró-labore e cenários';
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
  document.getElementById('cmp_rf_mes').textContent =
    fmtMoeda(r.rendimentoPassivoMensal) + '/mês · ' + taxaAnual.toFixed(1) + '% a.a.';
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
      `Lucro <strong>${fmtMoeda(r.lucroMensal)}</strong>/mês vs renda fixa <strong>${fmtMoeda(r.rendimentoPassivoMensal)}</strong>/mês — diferença <strong>${fmtMoeda(diff)}</strong> a favor do negócio.`;
  } else if (r.semaforo === 'amarelo') {
    destaque.innerHTML =
      `Lucro positivo (${fmtMoeda(r.lucroMensal)}), mas o retorno ainda é baixo para o risco em relação à renda fixa.`;
  } else {
    destaque.innerHTML =
      `Melhor aplicado: renda fixa renderia <strong>${fmtMoeda(r.rendimentoPassivoMensal)}</strong>/mês vs lucro <strong>${fmtMoeda(r.lucroMensal)}</strong>.`;
  }

  resultado.className = 'result ' + r.semaforo;
  resultado.style.display = 'block';
}

function calcular() {
  document.getElementById('fb_obrigado').style.display = 'none';
  document.querySelectorAll('.fb-btn').forEach((b) => b.classList.remove('selecionado'));

  const entrada = lerEntradaDoForm(form);
  if (!validarEntrada(entrada)) {
    resultado.style.display = 'block';
    resultado.className = 'result vermelho';
    document.getElementById('bola').className = 'bola vermelho';
    document.getElementById('rotulo').textContent = 'Preencha os campos obrigatórios';
    document.getElementById('destaque').textContent =
      'Investimento, clientes, ticket, custos e taxa de renda fixa são obrigatórios.';
    cenariosEl.innerHTML = '';
    document.getElementById('feedback').style.display = 'none';
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
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  calcular();
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

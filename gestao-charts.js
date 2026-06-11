/** Gráficos Chart.js — cenários e ROI */

(function () {
  const charts = {};

  function destruir(id) {
    if (charts[id]) {
      charts[id].destroy();
      delete charts[id];
    }
  }

  function tema() {
    return {
      receita: 'rgba(0, 200, 83, 0.75)',
      custos: 'rgba(255, 179, 0, 0.75)',
      lucro: 'rgba(68, 138, 255, 0.85)',
      acumulado: 'rgba(0, 200, 83, 0.9)',
      investimento: 'rgba(255, 82, 82, 0.85)',
      grid: 'rgba(255,255,255,0.06)',
      texto: '#a0a0b0',
    };
  }

  function renderCenarios(canvas, cenarios) {
    if (!canvas || typeof Chart === 'undefined') return;
    destruir('cenarios');
    const c = tema();
    const labels = cenarios.map((x) => x.label + ' (' + x.alunos + ')');

    charts.cenarios = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Receita',
            data: cenarios.map((x) => x.receitaBruta),
            backgroundColor: c.receita,
          },
          {
            label: 'Custos',
            data: cenarios.map((x) => x.custosTotal),
            backgroundColor: c.custos,
          },
          {
            label: 'Lucro',
            data: cenarios.map((x) => x.lucroOperacional),
            backgroundColor: c.lucro,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: c.texto, boxWidth: 12 } },
          title: {
            display: true,
            text: 'Receita, custos e lucro por cenário',
            color: '#e1e1e6',
            font: { size: 13, weight: '600' },
          },
        },
        scales: {
          x: { ticks: { color: c.texto }, grid: { color: c.grid } },
          y: {
            ticks: {
              color: c.texto,
              callback: (v) =>
                'R$ ' + Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
            },
            grid: { color: c.grid },
          },
        },
      },
    });
  }

  function renderRoi(canvas, projecao) {
    if (!canvas || typeof Chart === 'undefined' || !projecao.length) return;
    destruir('roi');
    const c = tema();
    const labels = projecao.map((p) => 'M' + p.mes);

    charts.roi = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Lucro acumulado',
            data: projecao.map((p) => p.lucroAcumulado),
            borderColor: c.acumulado,
            backgroundColor: 'rgba(0, 200, 83, 0.1)',
            fill: true,
            tension: 0.2,
          },
          {
            label: 'Investimento inicial',
            data: projecao.map((p) => p.investimento),
            borderColor: c.investimento,
            borderDash: [6, 4],
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: c.texto, boxWidth: 12 } },
          title: {
            display: true,
            text: 'Retorno acumulado vs. investimento (24 meses)',
            color: '#e1e1e6',
            font: { size: 13, weight: '600' },
          },
        },
        scales: {
          x: { ticks: { color: c.texto, maxTicksLimit: 13 }, grid: { color: c.grid } },
          y: {
            ticks: {
              color: c.texto,
              callback: (v) =>
                'R$ ' + Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
            },
            grid: { color: c.grid },
          },
        },
      },
    });
  }

  window.GestaoCharts = { renderCenarios, renderRoi, destruir };
})();

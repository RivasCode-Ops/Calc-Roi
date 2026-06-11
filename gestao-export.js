/** Exportação PDF — relatório Picos do Saber */

function exportarPdfGestao(mestre, resultado, fmtMoeda) {
  if (!window.jspdf?.jsPDF) {
    alert('Biblioteca PDF não carregou. Atualize a página (Ctrl+F5).');
    return;
  }
  const { jsPDF } = window.jspdf;
  const r = resultado;
  const a = r.atual;
  const data = new Date().toLocaleString('pt-BR');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 18;
  const margem = 14;
  const largura = 182;

  function linha(texto, bold) {
    if (y > 275) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 10);
    const quebras = doc.splitTextToSize(texto, largura);
    doc.text(quebras, margem, y);
    y += quebras.length * 5 + (bold ? 2 : 1);
  }

  doc.setTextColor(30, 30, 30);
  linha('PICOS DO SABER — Plano de Gestao Escolar', true);
  linha('Gerado em ' + data);
  linha('');

  linha('RESUMO EXECUTIVO', true);
  linha(
    a.numAlunos +
      ' alunos | Lucro ' +
      fmtMoeda(a.lucroOperacional) +
      '/mes (' +
      a.margemPct.toFixed(1) +
      '%) | ' +
      a.veredito
  );
  if (r.roi.paybackMeses) linha('Payback: ' + r.roi.paybackMeses.toFixed(1) + ' meses');
  if (r.equilibrio) linha('Ponto de equilibrio: ' + r.equilibrio.alunos + ' alunos');
  linha('');

  linha('VIABILIDADE', true);
  linha('Receita: ' + fmtMoeda(a.receitaBruta));
  linha('Custos: ' + fmtMoeda(a.custosTotal));
  linha('Lucro operacional: ' + fmtMoeda(a.lucroOperacional));
  linha('');

  linha('CAPACIDADE', true);
  linha(
    a.turmas +
      ' turmas | ' +
      a.horasTurmasSemana.toFixed(1) +
      ' h/sem | ' +
      a.professorasNecessarias +
      ' professoras necessarias | ' +
      a.salas +
      ' salas'
  );
  linha('');

  linha('PRECIFICACAO', true);
  linha('Custo real/aluno: ' + fmtMoeda(a.custoPorAluno));
  linha('Mensalidade minima ideal: ' + fmtMoeda(a.mensalidadeIdeal));
  linha('Mensalidade cadastrada: ' + fmtMoeda(mestre.precos.mensalidadePadrao));
  linha('');

  linha('ROI', true);
  linha('Investimento: ' + fmtMoeda(r.totais.investimentoTotal));
  linha('ROI anual: ' + r.roi.roiAnualPct.toFixed(1) + '%');
  linha('');

  linha('CENARIOS', true);
  r.cenarios.forEach((c) => {
    linha(
      c.label +
        ' (' +
        c.alunos +
        ' al.): receita ' +
        fmtMoeda(c.receitaBruta) +
        ' | lucro ' +
        fmtMoeda(c.lucroOperacional)
    );
  });

  linha('');
  linha('Ferramenta interna — nao constitui recomendacao financeira.', false);

  const nome = 'picos-gestao-' + new Date().toISOString().slice(0, 10) + '.pdf';
  doc.save(nome);
}

window.GestaoExport = { exportarPdfGestao };

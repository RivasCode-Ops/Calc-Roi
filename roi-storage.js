/** Cenários ROI nomeados — localStorage */

const STORAGE_KEY = 'calc_roi_cenarios_v1';
const MAX_CENARIOS = 20;

function coletarFormulario(form) {
  const data = {};
  Array.from(form.elements).forEach((el) => {
    if (el.name && !el.disabled && el.type !== 'submit' && el.type !== 'button') {
      data[el.name] = el.value;
    }
  });
  return data;
}

function aplicarFormulario(form, data) {
  if (!data) return;
  Object.entries(data).forEach(([name, value]) => {
    const el = form.elements[name];
    if (el) el.value = value;
  });
}

function lerLista() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function gravarLista(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function formatarDataSalva(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizarNome(nome) {
  return String(nome || '').trim().slice(0, 60);
}

function resumoDeResultado(base) {
  if (!base) return null;
  return {
    lucroMensal: base.lucroMensal,
    semaforo: base.semaforo,
    veredito: base.veredito,
    roiAnualPercentual: base.roiAnualPercentual,
    vpl: base.vpl,
    tirAnualPercentual: base.tirAnualPercentual,
  };
}

function listar() {
  return lerLista().sort((a, b) => b.savedAt - a.savedAt);
}

function salvar(nome, form, base) {
  const label = normalizarNome(nome);
  if (!label) return { ok: false, erro: 'Informe um nome para o cenário.' };

  const lista = lerLista();
  const duplicado = lista.find((c) => c.nome.toLowerCase() === label.toLowerCase());
  if (duplicado) {
    return { ok: false, erro: 'Já existe um cenário com esse nome. Escolha outro ou exclua o anterior.' };
  }
  if (lista.length >= MAX_CENARIOS) {
    return { ok: false, erro: `Limite de ${MAX_CENARIOS} cenários salvos. Exclua um antes de salvar.` };
  }

  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nome: label,
    savedAt: Date.now(),
    formData: coletarFormulario(form),
    resumo: resumoDeResultado(base),
  };

  lista.push(item);
  gravarLista(lista);
  return { ok: true, item };
}

function obter(id) {
  return lerLista().find((c) => c.id === id) || null;
}

function remover(id) {
  const lista = lerLista().filter((c) => c.id !== id);
  gravarLista(lista);
  return lista;
}

window.RoiStorage = {
  STORAGE_KEY,
  MAX_CENARIOS,
  coletarFormulario,
  aplicarFormulario,
  listar,
  salvar,
  obter,
  remover,
  formatarDataSalva,
};

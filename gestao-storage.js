/** Persistência do Painel Mestre — localStorage */

const STORAGE_KEY = 'picos_gestao_mestre_v1';

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

function salvarMestre(form) {
  try {
    const payload = { data: coletarFormulario(form), savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.warn('Não foi possível salvar:', e);
    return false;
  }
}

function carregarMestre(form) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    aplicarFormulario(form, payload.data);
    return payload;
  } catch (e) {
    console.warn('Dados salvos inválidos:', e);
    return null;
  }
}

function limparMestre() {
  localStorage.removeItem(STORAGE_KEY);
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

window.GestaoStorage = {
  STORAGE_KEY,
  coletarFormulario,
  salvarMestre,
  carregarMestre,
  limparMestre,
  formatarDataSalva,
};

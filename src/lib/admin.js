const ENDPOINT = import.meta.env.VITE_ORDERS_ENDPOINT || '';
const PIN_KEY = 'cokoa_admin_pin';

export function getSavedPin() {
  try { return sessionStorage.getItem(PIN_KEY) || ''; } catch { return ''; }
}
export function savePin(pin) {
  try { sessionStorage.setItem(PIN_KEY, pin); } catch { /* noop */ }
}
export function clearPin() {
  try { sessionStorage.removeItem(PIN_KEY); } catch { /* noop */ }
}

async function post(action, payload) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, error: `Respuesta invalida del servidor (${res.status}).` };
    }
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : 'No se pudo conectar con el servidor.' };
  }
}

export async function login(pin) {
  if (!ENDPOINT) return { ok: false, error: 'El sitio no tiene configurado VITE_ORDERS_ENDPOINT.' };
  return post('login', { pin });
}

export async function fetchAdminCatalog(pin) {
  if (!ENDPOINT) return { ok: false, error: 'El sitio no tiene configurado VITE_ORDERS_ENDPOINT.' };
  try {
    const res = await fetch(`${ENDPOINT}?action=catalogo_admin&pin=${encodeURIComponent(pin)}`);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, error: `Respuesta invalida del servidor (${res.status}).` };
    }
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : 'No se pudo cargar el catalogo.' };
  }
}

export async function saveItem(pin, item) {
  return post('guardar_item', { pin, item });
}

export async function deleteItem(pin, id) {
  return post('eliminar_item', { pin, id });
}

/** Convierte un archivo de imagen a base64 y lo sube; devuelve la URL pública en Drive. */
export async function uploadImage(pin, file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return post('subir_imagen', { pin, filename: file.name, mimeType: file.type, base64 });
}

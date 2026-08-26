import { PRODUCTS as STATIC_PRODUCTS, BOXES as STATIC_BOXES, EXPERIENCES as STATIC_EXPERIENCES } from '../data/catalog';

const ENDPOINT = import.meta.env.VITE_ORDERS_ENDPOINT || '';
const CATALOG_CACHE_KEY = 'cokoa_live_catalog_v1';
const DRIVE_IMAGE_WIDTHS = [480, 720, 960];

const fallbackCatalog = () => ({
  products: STATIC_PRODUCTS,
  boxes: STATIC_BOXES,
  experiences: STATIC_EXPERIENCES,
  live: false,
});

function driveImageId(value) {
  const input = String(value || '').trim();
  if (!input) return '';

  try {
    const url = new URL(input);
    const isDriveHost = url.hostname === 'drive.google.com'
      || url.hostname === 'drive.usercontent.google.com'
      || url.hostname.endsWith('.googleusercontent.com');
    if (!isDriveHost) return '';

    const queryId = url.searchParams.get('id');
    const pathMatch = url.pathname.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    return queryId || (pathMatch && pathMatch[1]) || '';
  } catch {
    return '';
  }
}

/** Evita la redireccion de Drive y solicita un tamaño adecuado para las tarjetas. */
export function normalizeDriveImageUrl(value, width = 960) {
  const input = String(value || '').trim();
  if (!input) return '';
  const id = driveImageId(input);
  return id ? `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w${width}` : input;
}

export function driveImageSrcSet(value) {
  const id = driveImageId(value);
  if (!id) return undefined;
  return DRIVE_IMAGE_WIDTHS
    .map((width) => `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w${width} ${width}w`)
    .join(', ');
}

function isCatalog(value) {
  return value
    && Array.isArray(value.products)
    && Array.isArray(value.boxes)
    && Array.isArray(value.experiences);
}

/** Muestra el ultimo catalogo valido de inmediato mientras se actualiza en segundo plano. */
export function getInitialCatalog() {
  try {
    const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || 'null');
    return isCatalog(cached) ? cached : fallbackCatalog();
  } catch {
    return fallbackCatalog();
  }
}

function cacheCatalog(catalog) {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(catalog));
  } catch {
    // El sitio sigue funcionando aunque el navegador bloquee el almacenamiento.
  }
}

/**
 * Trae el catálogo en vivo desde la hoja "Catálogo" (el panel de control de Manu).
 * Si el Apps Script no está configurado, falla, o tarda demasiado, el sitio sigue
 * funcionando con el catálogo de respaldo (src/data/catalog.js) — nunca se cae.
 */
export async function fetchCatalog() {
  const fallback = getInitialCatalog();
  if (!ENDPOINT) return fallback;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(ENDPOINT + '?action=catalogo', { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    if (!data || !data.ok || !Array.isArray(data.items) || data.items.length === 0) return fallback;

    const products = [];
    const boxes = [];
    const experiences = [];
    data.items.forEach((item) => {
      const mapped = {
        id: item.id,
        name: item.name,
        desc: item.desc,
        price: item.price,
        unit: item.unit,
        image: normalizeDriveImageUrl(item.image || ''),
      };
      const cat = (item.category || '').toLowerCase();
      if (cat.startsWith('caja')) boxes.push(mapped);
      else if (cat.startsWith('experiencia')) experiences.push(mapped);
      else products.push(mapped);
    });

    // Si alguna categoría queda vacía (ej. Manu borró todas las cajas sin querer),
    // se rellena esa categoría con el respaldo para que el sitio nunca muestre una sección vacía.
    const catalog = {
      products: products.length ? products : fallback.products,
      boxes: boxes.length ? boxes : fallback.boxes,
      experiences: experiences.length ? experiences : fallback.experiences,
      live: true,
    };
    cacheCatalog(catalog);
    return catalog;
  } catch (err) {
    console.error('No se pudo cargar el catálogo en vivo, usando el de respaldo:', err);
    return fallback;
  }
}

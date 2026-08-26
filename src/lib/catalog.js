import { PRODUCTS as STATIC_PRODUCTS, BOXES as STATIC_BOXES, EXPERIENCES as STATIC_EXPERIENCES } from '../data/catalog';

const ENDPOINT = import.meta.env.VITE_ORDERS_ENDPOINT || '';

/** Usa la variante de Drive diseñada para incrustar imágenes en sitios externos. */
export function normalizeDriveImageUrl(value) {
  const input = String(value || '').trim();
  if (!input) return '';

  try {
    const url = new URL(input);
    const isDriveHost = url.hostname === 'drive.google.com'
      || url.hostname === 'drive.usercontent.google.com'
      || url.hostname.endsWith('.googleusercontent.com');
    if (!isDriveHost) return input;

    const queryId = url.searchParams.get('id');
    const pathMatch = url.pathname.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    const id = queryId || (pathMatch && pathMatch[1]);
    return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200` : input;
  } catch {
    return input;
  }
}

/**
 * Trae el catálogo en vivo desde la hoja "Catálogo" (el panel de control de Manu).
 * Si el Apps Script no está configurado, falla, o tarda demasiado, el sitio sigue
 * funcionando con el catálogo de respaldo (src/data/catalog.js) — nunca se cae.
 */
export async function fetchCatalog() {
  const fallback = { products: STATIC_PRODUCTS, boxes: STATIC_BOXES, experiences: STATIC_EXPERIENCES, live: false };
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
    return {
      products: products.length ? products : fallback.products,
      boxes: boxes.length ? boxes : fallback.boxes,
      experiences: experiences.length ? experiences : fallback.experiences,
      live: true,
    };
  } catch (err) {
    console.error('No se pudo cargar el catálogo en vivo, usando el de respaldo:', err);
    return fallback;
  }
}

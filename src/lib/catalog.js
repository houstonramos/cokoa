import { PRODUCTS as STATIC_PRODUCTS, BOXES as STATIC_BOXES, EXPERIENCES as STATIC_EXPERIENCES } from '../data/catalog';

const ENDPOINT = import.meta.env.VITE_ORDERS_ENDPOINT || '';
const CATALOG_CACHE_KEY = 'cokoa_live_catalog_v2';
const DRIVE_IMAGE_WIDTHS = [480, 720, 960, 1280];

export const DEFAULT_HERO_SETTINGS = {
  heroImage: '/hero.webp',
  heroPositionX: 50,
  heroPositionY: 50,
  heroZoom: 1,
};

export const DEFAULT_CATEGORIES = [
  { id: 'latas', name: 'Latas', order: 1, active: true },
  { id: 'postres', name: 'Postres', order: 2, active: true },
  { id: 'bebidas', name: 'Bebidas', order: 3, active: true },
  { id: 'chocolates', name: 'Chocolates', order: 4, active: true },
  { id: 'cosmeticos', name: 'Cosméticos', order: 5, active: true },
  { id: 'cajas', name: 'Cajas', order: 6, active: true },
  { id: 'experiencias', name: 'Experiencias', order: 7, active: true },
];

const STATIC_ITEMS = [
  ...STATIC_PRODUCTS.map((item) => ({ ...item, category: 'Latas' })),
  ...STATIC_BOXES.map((item) => ({ ...item, category: 'Cajas' })),
  ...STATIC_EXPERIENCES.map((item) => ({ ...item, category: 'Experiencias' })),
];

const fallbackCatalog = () => ({
  items: STATIC_ITEMS.map((item) => ({ ...item, stock: null, offerActive: false, offerPrice: 0, active: true })),
  categories: DEFAULT_CATEGORIES,
  settings: { ...DEFAULT_HERO_SETTINGS },
  live: false,
});

export function slugifyCategory(value) {
  return String(value || 'categoria')
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'categoria';
}

export function normalizeCategoryName(value) {
  const name = String(value || '').trim();
  const key = slugifyCategory(name);
  const known = {
    lata: 'Latas', latas: 'Latas',
    postre: 'Postres', postres: 'Postres',
    bebida: 'Bebidas', bebidas: 'Bebidas',
    chocolate: 'Chocolates', chocolates: 'Chocolates',
    cosmetico: 'Cosméticos', cosmeticos: 'Cosméticos',
    caja: 'Cajas', cajas: 'Cajas',
    experiencia: 'Experiencias', experiencias: 'Experiencias',
  };
  return known[key] || name || 'Postres';
}

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
  return id ? `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w${width}-rw` : input;
}

export function driveImageSrcSet(value) {
  const id = driveImageId(value);
  if (!id) return undefined;
  return DRIVE_IMAGE_WIDTHS
    .map((width) => `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w${width}-rw ${width}w`)
    .join(', ');
}

export function hasOffer(item) {
  const regular = Number(item && item.price) || 0;
  const offer = Number(item && item.offerPrice) || 0;
  return item && item.offerActive === true && offer > 0 && offer < regular;
}

export function itemPrice(item) {
  return hasOffer(item) ? Number(item.offerPrice) : Number(item.price) || 0;
}

export function isSoldOut(item) {
  return item && item.stock !== null && item.stock !== '' && Number(item.stock) <= 0;
}

function normalizeStock(value) {
  if (value === '' || value === null || typeof value === 'undefined') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
}

function asBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').trim().toLowerCase();
  if (['si', 'sí', 'true', '1'].includes(normalized)) return true;
  if (['no', 'false', '0'].includes(normalized)) return false;
  return fallback;
}

function mapItem(item) {
  return {
    id: String(item.id || '').trim(),
    category: normalizeCategoryName(item.category),
    name: String(item.name || '').trim(),
    desc: String(item.desc || '').trim(),
    price: Number(item.price) || 0,
    unit: String(item.unit || '').trim(),
    image: normalizeDriveImageUrl(item.image || item.rawImage || ''),
    rawImage: String(item.rawImage || item.image || '').trim(),
    active: item.active !== false,
    stock: normalizeStock(item.stock),
    offerActive: asBoolean(item.offerActive, false),
    offerPrice: Number(item.offerPrice) || 0,
  };
}

function mapCategories(values, items) {
  const source = Array.isArray(values) && values.length ? values : DEFAULT_CATEGORIES;
  const seen = new Set();
  const categories = source.map((category, index) => {
    const name = normalizeCategoryName(category.name || category.label || category.id || category);
    const id = slugifyCategory(category.id || name);
    seen.add(id);
    return {
      id,
      name,
      order: Number(category.order) || index + 1,
      active: category.active !== false,
    };
  });

  items.forEach((item) => {
    const id = slugifyCategory(item.category);
    if (!seen.has(id)) {
      categories.push({ id, name: item.category, order: categories.length + 1, active: true });
      seen.add(id);
    }
  });
  return categories.sort((a, b) => a.order - b.order);
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function normalizeHeroSettings(settings) {
  const value = settings && typeof settings === 'object' ? settings : {};
  return {
    heroImage: normalizeDriveImageUrl(value.heroImage || value.hero_image || DEFAULT_HERO_SETTINGS.heroImage, 1280),
    heroPositionX: clamp(value.heroPositionX ?? value.hero_position_x, 0, 100, DEFAULT_HERO_SETTINGS.heroPositionX),
    heroPositionY: clamp(value.heroPositionY ?? value.hero_position_y, 0, 100, DEFAULT_HERO_SETTINGS.heroPositionY),
    heroZoom: clamp(value.heroZoom ?? value.hero_zoom, 1, 1.8, DEFAULT_HERO_SETTINGS.heroZoom),
  };
}

function isCatalog(value) {
  return value
    && Array.isArray(value.items)
    && Array.isArray(value.categories)
    && value.settings;
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

/** Trae el catalogo, las categorias y la portada desde el panel de control. */
export async function fetchCatalog() {
  const fallback = getInitialCatalog();
  if (!ENDPOINT) return fallback;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(ENDPOINT + '?action=catalogo', { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    if (!data || !data.ok || !Array.isArray(data.items) || data.items.length === 0) return fallback;

    const items = data.items.map(mapItem).filter((item) => item.id && item.name && item.active !== false);
    const catalog = {
      items,
      categories: mapCategories(data.categories, items),
      settings: normalizeHeroSettings(data.settings),
      live: true,
    };
    cacheCatalog(catalog);
    return catalog;
  } catch (err) {
    console.error('No se pudo cargar el catálogo en vivo, usando el de respaldo:', err);
    return fallback;
  }
}

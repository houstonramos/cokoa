import { ORDERS_ENDPOINT } from './backend';

// Formato de moneda dominicana con separadores apropiados para cada idioma.
export const fmt = (n, locale = 'es') => 'RD$' + Number(n).toLocaleString(locale === 'en' ? 'en-US' : 'es-DO');

// Etiquetas legibles para el pedido
export const methodLabel = (method, zone) => {
  if (method === 'pickup') return 'Pickup en tienda';
  return zone ? `Delivery (${zone})` : 'Delivery';
};

const ENDPOINT = ORDERS_ENDPOINT;
const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';

/**
 * Envía el pedido al Apps Script (doPost).
 * Content-Type text/plain evita el preflight CORS: Apps Script no responde
 * a OPTIONS, pero acepta solicitudes "simples" y ContentService devuelve
 * la respuesta con CORS abierto.
 * Los errores de negocio (por ejemplo, inventario agotado) se devuelven al
 * carrito. Los errores de red conservan WhatsApp como respaldo.
 */
export async function submitOrder(payload) {
  const fallbackId = 'CW-' + Math.floor(1000 + Math.random() * 9000);
  if (!ENDPOINT) return { ok: false, orderId: fallbackId, offline: true };
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data && data.ok && data.orderId) return { ...data, ok: true };
    if (data && data.error) return { ok: false, orderId: null, error: data.error };
    return { ok: false, orderId: fallbackId, offline: true };
  } catch (err) {
    console.error('Error enviando pedido:', err);
    return { ok: false, orderId: fallbackId, offline: true };
  }
}

/** Construye el enlace wa.me con el resumen del pedido pre-armado. */
export function buildWhatsAppLink(order) {
  if (!WA_NUMBER) return null;
  const isEnglish = order.locale === 'en';
  const itemLabel = isEnglish ? 'Order' : 'Pedido';
  const lines = [
    `🍮 *${isEnglish ? 'New order' : 'Nuevo pedido'} ${order.orderId}* — Cokoa`,
    '',
    `*${isEnglish ? 'Customer' : 'Cliente'}:* ${order.name}`,
    `*${isEnglish ? 'Phone' : 'Teléfono'}:* ${order.phone}`,
    '',
    `*${itemLabel}:*`,
    ...order.items.map((i) => `• ${i.qty}× ${i.name} — ${fmt(i.price * i.qty, order.locale)}`),
    '',
    `Subtotal: ${fmt(order.subtotal, order.locale)}`,
    `${order.deliveryRowLabel}: ${order.deliveryFeeLabel}`,
    `*Total: ${fmt(order.total, order.locale)}*`,
    '',
    `*${isEnglish ? 'Delivery' : 'Entrega'}:* ${order.methodLabel || methodLabel(order.method, order.zone)}`,
  ];
  if (order.method === 'delivery' && order.address) lines.push(`*${isEnglish ? 'Address' : 'Dirección'}:* ${order.address}`);
  if (order.date) lines.push(`*${isEnglish ? 'Date' : 'Fecha'}:* ${order.date}`);
  lines.push(`*${isEnglish ? 'Payment' : 'Pago'}:* ${paymentLabel(order.payment, order.locale)}`);
  if (order.notes) lines.push(`*${isEnglish ? 'Notes' : 'Notas'}:* ${order.notes}`);

  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function paymentLabel(payment, locale) {
  if (locale !== 'en') return payment;
  return { transferencia: 'bank transfer', efectivo: 'cash', tarjeta: 'card' }[payment] || payment;
}

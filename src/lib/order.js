// Formato de moneda dominicana
export const fmt = (n) => 'RD$' + Number(n).toLocaleString('es-DO');

// Etiquetas legibles para el pedido
export const methodLabel = (method, zone) => {
  if (method === 'pickup') return 'Pickup en tienda';
  return zone === 'ciudad' ? 'Delivery (Bávaro · Punta Cana)' : 'Delivery (fuera de la ciudad, por agenda)';
};

const ENDPOINT = import.meta.env.VITE_ORDERS_ENDPOINT || '';
const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';

/**
 * Envía el pedido al Apps Script (doPost).
 * Content-Type text/plain evita el preflight CORS: Apps Script no responde
 * a OPTIONS, pero acepta solicitudes "simples" y ContentService devuelve
 * la respuesta con CORS abierto.
 * Devuelve { ok, orderId } — si el backend falla, ok:false y orderId local
 * de respaldo para que el pedido nunca se pierda (siempre queda WhatsApp).
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
    if (data && data.ok && data.orderId) return { ok: true, orderId: data.orderId };
    return { ok: false, orderId: fallbackId };
  } catch (err) {
    console.error('Error enviando pedido:', err);
    return { ok: false, orderId: fallbackId };
  }
}

/** Construye el enlace wa.me con el resumen del pedido pre-armado. */
export function buildWhatsAppLink(order) {
  if (!WA_NUMBER) return null;
  const lines = [
    `🍮 *Nuevo pedido ${order.orderId}* — Cokoa`,
    '',
    `*Cliente:* ${order.name}`,
    `*Teléfono:* ${order.phone}`,
    '',
    '*Pedido:*',
    ...order.items.map((i) => `• ${i.qty}× ${i.name} — ${fmt(i.price * i.qty)}`),
    '',
    `Subtotal: ${fmt(order.subtotal)}`,
    `${order.deliveryRowLabel}: ${order.deliveryFeeLabel}`,
    `*Total: ${fmt(order.total)}*`,
    '',
    `*Entrega:* ${methodLabel(order.method, order.zone)}`,
  ];
  if (order.method === 'delivery' && order.address) lines.push(`*Dirección:* ${order.address}`);
  if (order.date) lines.push(`*Fecha:* ${order.date}`);
  lines.push(`*Pago:* ${order.payment}`);
  if (order.notes) lines.push(`*Notas:* ${order.notes}`);

  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

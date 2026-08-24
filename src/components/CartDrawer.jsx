import { useState } from 'react';
import { fmt, methodLabel, submitOrder, buildWhatsAppLink } from '../lib/order';
import { DELIVERY_FEE_CIUDAD } from '../data/catalog';

export default function CartDrawer({ open, onClose, cart, changeQty, resetCart }) {
  const [step, setStep] = useState('cart'); // cart | checkout | done
  const [method, setMethod] = useState('delivery'); // delivery | pickup
  const [zone, setZone] = useState('ciudad'); // ciudad | fuera
  const [payment, setPayment] = useState('transferencia');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', date: '', notes: '' });
  const [orderId, setOrderId] = useState(null);
  const [waLink, setWaLink] = useState(null);
  const [sending, setSending] = useState(false);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const subtotal = cart.reduce((t, c) => t + c.price * c.qty, 0);
  const deliveryFee = method === 'delivery' && zone === 'ciudad' ? DELIVERY_FEE_CIUDAD : 0;
  const total = subtotal + deliveryFee;

  let deliveryRowLabel = 'Retiro en tienda';
  let deliveryFeeLabel = 'Gratis';
  let doneNote = 'Te contactaremos por WhatsApp para coordinar el retiro en tienda.';
  if (method === 'delivery') {
    if (zone === 'ciudad') {
      deliveryRowLabel = 'Delivery (Bávaro · Punta Cana)';
      deliveryFeeLabel = fmt(DELIVERY_FEE_CIUDAD);
      doneNote = 'Entrega el mismo día en Bávaro · Punta Cana. Te escribimos por WhatsApp para confirmar.';
    } else {
      deliveryRowLabel = 'Delivery (fuera de la ciudad)';
      deliveryFeeLabel = 'Por agenda';
      doneNote = 'Entrega por agenda: coordinaremos la fecha y el costo de envío contigo por WhatsApp.';
    }
  }

  const dateLabel = method === 'delivery' && zone === 'fuera' ? 'Fecha de entrega (por agenda) *' : 'Fecha deseada';

  const canPlace = () => {
    if (!form.name.trim() || !form.phone.trim()) return false;
    if (method === 'delivery' && !form.address.trim()) return false;
    if (method === 'delivery' && zone === 'fuera' && !form.date) return false;
    return true;
  };

  const place = async () => {
    if (!canPlace()) {
      alert(
        'Completa nombre, teléfono' +
          (method === 'delivery' ? ', dirección' : '') +
          (method === 'delivery' && zone === 'fuera' ? ' y fecha (entrega por agenda)' : '') +
          '.'
      );
      return;
    }
    setSending(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      items: cart.map((c) => ({ id: c.id, name: c.name, qty: c.qty, price: c.price, unit: c.unit })),
      subtotal,
      deliveryFee,
      total,
      method,
      zone: method === 'delivery' ? zone : '',
      address: method === 'delivery' ? form.address.trim() : '',
      date: form.date,
      notes: form.notes.trim(),
      payment,
      methodLabel: methodLabel(method, zone),
      deliveryFeeLabel,
    };
    const res = await submitOrder(payload);
    setSending(false);
    setOrderId(res.orderId);
    const link = buildWhatsAppLink({
      ...payload,
      orderId: res.orderId,
      deliveryRowLabel,
      deliveryFeeLabel,
    });
    setWaLink(link);
    setStep('done');
    if (link) window.open(link, '_blank', 'noopener');
  };

  const newOrder = () => {
    resetCart();
    setStep('cart');
    setOrderId(null);
    setWaLink(null);
    setForm({ name: '', phone: '', email: '', address: '', date: '', notes: '' });
    onClose();
  };

  const drawerTitle = step === 'cart' ? 'Tu carrito' : step === 'checkout' ? 'Finalizar pedido' : 'Confirmación';
  const choice = (active) => 'choice-btn' + (active ? ' active' : '');

  return (
    <>
      <div
        className="overlay"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />
      <aside
        className="drawer cw-hide-scroll"
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
        aria-hidden={!open}
      >
        <div className="drawer-head">
          <div className="drawer-title">{drawerTitle}</div>
          <button className="drawer-close" onClick={onClose} aria-label="Cerrar carrito">×</button>
        </div>

        {step === 'cart' && (
          <div className="cart-step">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-emoji">🍮</div>
                <p className="cart-empty-title">Tu carrito está vacío</p>
                <p className="cart-empty-sub">Agrega tus postres favoritos para empezar.</p>
                <button className="btn-dark" onClick={onClose}>Ver postres</button>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {cart.map((line) => (
                    <div className="cart-line" key={line.id}>
                      <div className="cart-line-info">
                        <div className="cart-line-name">{line.name}</div>
                        <div className="cart-line-unit">{fmt(line.price)} · {line.unit}</div>
                      </div>
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => changeQty(line.id, -1)} aria-label="Quitar uno">−</button>
                        <span className="qty-num">{line.qty}</span>
                        <button className="qty-btn" onClick={() => changeQty(line.id, 1)} aria-label="Agregar uno">+</button>
                      </div>
                      <div className="cart-line-total">{fmt(line.price * line.qty)}</div>
                    </div>
                  ))}
                </div>
                <div className="cart-foot">
                  <div className="cart-subtotal">
                    <span className="label">Subtotal</span>
                    <span className="value">{fmt(subtotal)}</span>
                  </div>
                  <button className="btn-wide" onClick={() => setStep('checkout')}>Proceder al pedido</button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'checkout' && (
          <div className="checkout">
            <div className="checkout-eyebrow">Datos de entrega</div>

            <label className="field-label" htmlFor="cw-name">Nombre completo</label>
            <input id="cw-name" className="field-input" value={form.name} onChange={setField('name')} placeholder="Tu nombre" />

            <label className="field-label" htmlFor="cw-phone">WhatsApp / Teléfono</label>
            <input id="cw-phone" className="field-input" value={form.phone} onChange={setField('phone')} placeholder="+1 (809) 000-0000" />

            <label className="field-label" htmlFor="cw-email">Email (recibe tu confirmación)</label>
            <input id="cw-email" className="field-input" type="email" value={form.email} onChange={setField('email')} placeholder="tucorreo@ejemplo.com" />

            <div className="field-group-label">Método</div>
            <div className="choice-grid-2">
              <button className={choice(method === 'delivery')} onClick={() => setMethod('delivery')}>Delivery</button>
              <button className={choice(method === 'pickup')} onClick={() => setMethod('pickup')}>Pickup en tienda</button>
            </div>

            {method === 'delivery' && (
              <div>
                <div className="field-group-label">Zona</div>
                <div className="choice-grid-2">
                  <button className={choice(zone === 'ciudad') + ' zone'} onClick={() => setZone('ciudad')}>
                    Bávaro · Punta Cana<br />
                    <span className="choice-sub">Mismo día · RD$150</span>
                  </button>
                  <button className={choice(zone === 'fuera') + ' zone'} onClick={() => setZone('fuera')}>
                    Fuera de la ciudad<br />
                    <span className="choice-sub">Por agenda</span>
                  </button>
                </div>
                <label className="field-label" htmlFor="cw-address">Dirección</label>
                <input id="cw-address" className="field-input" value={form.address} onChange={setField('address')} placeholder="Calle, número, sector, referencia" />
              </div>
            )}

            <label className="field-label" htmlFor="cw-date">{dateLabel}</label>
            <input id="cw-date" className="field-input" type="date" value={form.date} onChange={setField('date')} />

            <div className="field-group-label">Pago</div>
            <div className="choice-grid-3">
              <button className={choice(payment === 'transferencia') + ' pay'} onClick={() => setPayment('transferencia')}>Transferencia</button>
              <button className={choice(payment === 'efectivo') + ' pay'} onClick={() => setPayment('efectivo')}>Efectivo</button>
              <button className={choice(payment === 'tarjeta') + ' pay'} onClick={() => setPayment('tarjeta')}>Tarjeta</button>
            </div>

            <label className="field-label" htmlFor="cw-notes">Notas (opcional)</label>
            <textarea id="cw-notes" className="field-textarea" rows="2" value={form.notes} onChange={setField('notes')} placeholder="Alergias, dedicatoria, indicaciones…" />

            <div className="summary-card">
              <div className="summary-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="summary-row"><span>{deliveryRowLabel}</span><span>{deliveryFeeLabel}</span></div>
              <div className="summary-total">
                <span className="label">Total</span>
                <span className="value">{fmt(total)}</span>
              </div>
            </div>

            <button className="btn-confirm" onClick={place} disabled={sending}>
              {sending ? 'Enviando pedido…' : 'Confirmar pedido'}
            </button>
            <button className="btn-back" onClick={() => setStep('cart')}>← Volver al carrito</button>
          </div>
        )}

        {step === 'done' && (
          <div className="done">
            <div className="done-check">✓</div>
            <h3 className="done-title">¡Pedido recibido!</h3>
            <p className="done-text">
              Gracias, <strong>{form.name}</strong>. Tu pedido <strong>{orderId}</strong> por{' '}
              <strong>{fmt(total)}</strong> fue registrado.
            </p>
            <p className="done-note">{doneNote}</p>
            {waLink && (
              <a className="btn-whatsapp" href={waLink} target="_blank" rel="noopener noreferrer">
                Confirmar por WhatsApp
              </a>
            )}
            <button className="btn-dark" onClick={newOrder}>Hacer otro pedido</button>
          </div>
        )}
      </aside>
    </>
  );
}

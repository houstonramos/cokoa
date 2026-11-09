import { useEffect, useState } from 'react';
import { buildWhatsAppLink, fmt, submitOrder } from '../lib/order';

const CART_COPY = {
  es: {
    titles: { cart: 'Tu carrito', checkout: 'Finalizar pedido', done: 'Confirmación' },
    close: 'Cerrar carrito', empty: 'Tu carrito está vacío', emptySub: 'Agrega tus postres favoritos para empezar.', seeProducts: 'Ver productos',
    removeOne: 'Quitar uno', addOne: 'Agregar uno', subtotal: 'Subtotal', proceed: 'Proceder al pedido', deliveryDetails: 'Datos de entrega',
    fullName: 'Nombre completo', namePlaceholder: 'Tu nombre', phone: 'WhatsApp / Teléfono', email: 'Email (recibe tu confirmación)', emailPlaceholder: 'tucorreo@ejemplo.com',
    method: 'Método', delivery: 'Delivery', pickup: 'Pickup en tienda', zone: 'Zona', quote: 'Por cotizar', minimum: 'Pedido mínimo', address: 'Dirección',
    addressPlaceholder: 'Calle, número, sector, referencia', requiredDate: 'Fecha de entrega *', desiredDate: 'Fecha deseada', payment: 'Pago',
    transfer: 'Transferencia', cash: 'Efectivo', card: 'Tarjeta', notes: 'Notas (opcional)', notesPlaceholder: 'Alergias, dedicatoria, indicaciones…',
    free: 'Gratis', productsTotal: 'Total de productos', total: 'Total', quotePending: 'El costo del delivery se confirma por WhatsApp.',
    sending: 'Enviando pedido…', confirm: 'Confirmar pedido', back: '← Volver al carrito', received: '¡Pedido recibido!',
    thanks: 'Gracias', registered: 'fue registrado.', whatsapp: 'Confirmar por WhatsApp', another: 'Hacer otro pedido',
    pickupRow: 'Retiro en tienda', pickupNote: 'Te contactaremos por WhatsApp para coordinar el retiro en tienda.',
    quoteNote: (name) => `Coordinaremos el costo y la entrega en ${name} contigo por WhatsApp.`,
    deliveryNote: (eta, name) => `${eta || 'Coordinaremos la entrega'} en ${name}. Te escribimos por WhatsApp para confirmar.`,
    minimumAlert: (name, amount) => `El pedido mínimo para ${name} es ${amount}.`,
    requiredAlert: (delivery, date) => `Completa nombre, teléfono${delivery ? ', dirección' : ''}${date ? ' y fecha de entrega' : ''}.`,
  },
  en: {
    titles: { cart: 'Your cart', checkout: 'Complete order', done: 'Confirmation' },
    close: 'Close cart', empty: 'Your cart is empty', emptySub: 'Add your favorite products to get started.', seeProducts: 'View products',
    removeOne: 'Remove one', addOne: 'Add one', subtotal: 'Subtotal', proceed: 'Continue to checkout', deliveryDetails: 'Delivery details',
    fullName: 'Full name', namePlaceholder: 'Your name', phone: 'WhatsApp / Phone', email: 'Email (receive your confirmation)', emailPlaceholder: 'you@example.com',
    method: 'Method', delivery: 'Delivery', pickup: 'Store pickup', zone: 'Zone', quote: 'Rate upon request', minimum: 'Minimum order', address: 'Address',
    addressPlaceholder: 'Street, number, area and reference', requiredDate: 'Delivery date *', desiredDate: 'Preferred date', payment: 'Payment',
    transfer: 'Bank transfer', cash: 'Cash', card: 'Card', notes: 'Notes (optional)', notesPlaceholder: 'Allergies, dedication, special instructions…',
    free: 'Free', productsTotal: 'Products total', total: 'Total', quotePending: 'The delivery cost will be confirmed via WhatsApp.',
    sending: 'Sending order…', confirm: 'Place order', back: '← Back to cart', received: 'Order received!',
    thanks: 'Thank you', registered: 'has been registered.', whatsapp: 'Confirm via WhatsApp', another: 'Place another order',
    pickupRow: 'Store pickup', pickupNote: 'We will contact you via WhatsApp to coordinate store pickup.',
    quoteNote: (name) => `We will coordinate the cost and delivery to ${name} with you via WhatsApp.`,
    deliveryNote: (eta, name) => `${eta || 'We will coordinate delivery'} in ${name}. We will message you on WhatsApp to confirm.`,
    minimumAlert: (name, amount) => `The minimum order for ${name} is ${amount}.`,
    requiredAlert: (delivery, date) => `Complete your name and phone number${delivery ? ', address' : ''}${date ? ' and delivery date' : ''}.`,
  },
};

export default function CartDrawer({ open, onClose, cart, changeQty, resetCart, deliveryZones = [], locale = 'es' }) {
  const copy = CART_COPY[locale] || CART_COPY.es;
  const [step, setStep] = useState('cart');
  const [method, setMethod] = useState('delivery');
  const [zone, setZone] = useState('');
  const [payment, setPayment] = useState('transferencia');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', date: '', notes: '' });
  const [orderId, setOrderId] = useState(null);
  const [waLink, setWaLink] = useState(null);
  const [sending, setSending] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const activeZones = deliveryZones.filter((candidate) => candidate.active !== false);
  const selectedZone = activeZones.find((candidate) => candidate.id === zone) || activeZones[0] || null;

  useEffect(() => {
    if (selectedZone && zone !== selectedZone.id) setZone(selectedZone.id);
    if (!selectedZone && method === 'delivery') setMethod('pickup');
  }, [selectedZone, zone, method]);

  const setField = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const subtotal = cart.reduce((total, line) => total + line.price * line.qty, 0);
  const deliveryFee = method === 'delivery' && selectedZone && !selectedZone.quoteOnly ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;
  const minimumMissing = method === 'delivery' && selectedZone && selectedZone.minimum > 0 && subtotal < selectedZone.minimum;

  let deliveryRowLabel = copy.pickupRow;
  let deliveryFeeLabel = copy.free;
  let doneNote = copy.pickupNote;
  if (method === 'delivery' && selectedZone) {
    deliveryRowLabel = `Delivery (${selectedZone.name})`;
    deliveryFeeLabel = selectedZone.quoteOnly ? copy.quote : fmt(selectedZone.fee, locale);
    doneNote = selectedZone.quoteOnly ? copy.quoteNote(selectedZone.name) : copy.deliveryNote(selectedZone.eta, selectedZone.name);
  }

  const dateRequired = method === 'delivery' && selectedZone && selectedZone.requestDate;
  const dateLabel = dateRequired ? copy.requiredDate : copy.desiredDate;

  const canPlace = () => {
    if (!form.name.trim() || !form.phone.trim()) return false;
    if (method === 'delivery' && !selectedZone) return false;
    if (method === 'delivery' && !form.address.trim()) return false;
    if (dateRequired && !form.date) return false;
    return true;
  };

  const place = async () => {
    if (minimumMissing) {
      alert(copy.minimumAlert(selectedZone.name, fmt(selectedZone.minimum, locale)));
      return;
    }
    if (!canPlace()) {
      alert(copy.requiredAlert(method === 'delivery', dateRequired));
      return;
    }

    setSending(true);
    const payload = {
      locale,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      items: cart.map((line) => ({
        id: line.id,
        name: line.name,
        nameEs: line.nameEs,
        nameEn: line.nameEn,
        qty: line.qty,
        price: line.price,
        unit: line.unit,
        unitEs: line.unitEs,
        unitEn: line.unitEn,
      })),
      subtotal,
      deliveryFee,
      total,
      method,
      zone: method === 'delivery' && selectedZone ? selectedZone.id : '',
      address: method === 'delivery' ? form.address.trim() : '',
      date: form.date,
      notes: form.notes.trim(),
      payment,
      methodLabel: method === 'pickup' ? copy.pickup : `Delivery (${selectedZone.name})`,
      deliveryFeeLabel,
    };
    const response = await submitOrder(payload);
    setSending(false);
    if (!response.ok && response.error) {
      alert(response.error);
      return;
    }

    setOrderId(response.orderId);
    const finalOrder = {
      ...payload,
      orderId: response.orderId,
      deliveryFee: typeof response.deliveryFee === 'number' ? response.deliveryFee : payload.deliveryFee,
      deliveryFeeLabel: response.deliveryFeeLabel || payload.deliveryFeeLabel,
      deliveryRowLabel: response.methodLabel || deliveryRowLabel,
      methodLabel: response.methodLabel || payload.methodLabel,
      zone: response.zone || payload.zone,
      total: typeof response.total === 'number' ? response.total : payload.total,
    };
    setConfirmedOrder(finalOrder);
    const link = buildWhatsAppLink(finalOrder);
    setWaLink(link);
    setStep('done');
    if (link) window.open(link, '_blank', 'noopener');
  };

  const newOrder = () => {
    resetCart();
    setStep('cart');
    setOrderId(null);
    setWaLink(null);
    setConfirmedOrder(null);
    setForm({ name: '', phone: '', email: '', address: '', date: '', notes: '' });
    onClose();
  };

  const drawerTitle = copy.titles[step];
  const choice = (active) => 'choice-btn' + (active ? ' active' : '');

  return (
    <>
      <div className="overlay" style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }} onClick={onClose} />
      <aside className="drawer cw-hide-scroll" style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }} aria-hidden={!open}>
        <div className="drawer-head">
          <div className="drawer-title">{drawerTitle}</div>
          <button className="drawer-close" onClick={onClose} aria-label={copy.close}>×</button>
        </div>

        {step === 'cart' && (
          <div className="cart-step">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-emoji">🍮</div>
                <p className="cart-empty-title">{copy.empty}</p>
                <p className="cart-empty-sub">{copy.emptySub}</p>
                <button className="btn-dark" onClick={onClose}>{copy.seeProducts}</button>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {cart.map((line) => (
                    <div className="cart-line" key={line.id}>
                      <div className="cart-line-info">
                        <div className="cart-line-name">{line.name}</div>
                        <div className="cart-line-unit">{fmt(line.price, locale)} · {line.unit}</div>
                      </div>
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => changeQty(line.id, -1)} aria-label={copy.removeOne}>−</button>
                        <span className="qty-num">{line.qty}</span>
                        <button className="qty-btn" onClick={() => changeQty(line.id, 1)} aria-label={copy.addOne} disabled={line.stock !== null && line.qty >= line.stock}>+</button>
                      </div>
                      <div className="cart-line-total">{fmt(line.price * line.qty, locale)}</div>
                    </div>
                  ))}
                </div>
                <div className="cart-foot">
                  <div className="cart-subtotal"><span className="label">{copy.subtotal}</span><span className="value">{fmt(subtotal, locale)}</span></div>
                  <button className="btn-wide" onClick={() => setStep('checkout')}>{copy.proceed}</button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'checkout' && (
          <div className="checkout">
            <div className="checkout-eyebrow">{copy.deliveryDetails}</div>
            <label className="field-label" htmlFor="cw-name">{copy.fullName}</label>
            <input id="cw-name" className="field-input" value={form.name} onChange={setField('name')} placeholder={copy.namePlaceholder} />
            <label className="field-label" htmlFor="cw-phone">{copy.phone}</label>
            <input id="cw-phone" className="field-input" value={form.phone} onChange={setField('phone')} placeholder="+1 (829) 983-3543" />
            <label className="field-label" htmlFor="cw-email">{copy.email}</label>
            <input id="cw-email" className="field-input" type="email" value={form.email} onChange={setField('email')} placeholder={copy.emailPlaceholder} />

            <div className="field-group-label">{copy.method}</div>
            <div className="choice-grid-2">
              <button className={choice(method === 'delivery')} onClick={() => setMethod('delivery')} disabled={!activeZones.length}>{copy.delivery}</button>
              <button className={choice(method === 'pickup')} onClick={() => setMethod('pickup')}>{copy.pickup}</button>
            </div>

            {method === 'delivery' && selectedZone && (
              <div>
                <div className="field-group-label">{copy.zone}</div>
                <div className="choice-grid-delivery">
                  {activeZones.map((candidate) => (
                    <button key={candidate.id} className={choice(selectedZone.id === candidate.id) + ' zone'} onClick={() => setZone(candidate.id)}>
                      <strong>{candidate.name}</strong>
                      <span className="choice-sub">{[candidate.eta, candidate.quoteOnly ? copy.quote : fmt(candidate.fee, locale)].filter(Boolean).join(' · ')}</span>
                    </button>
                  ))}
                </div>
                {selectedZone.coverage && <p className="delivery-zone-coverage">{selectedZone.coverage}</p>}
                {selectedZone.minimum > 0 && <p className={`delivery-zone-minimum${minimumMissing ? ' is-missing' : ''}`}>{copy.minimum}: {fmt(selectedZone.minimum, locale)}</p>}
                <label className="field-label" htmlFor="cw-address">{copy.address}</label>
                <input id="cw-address" className="field-input" value={form.address} onChange={setField('address')} placeholder={copy.addressPlaceholder} />
              </div>
            )}

            <label className="field-label" htmlFor="cw-date">{dateLabel}</label>
            <input id="cw-date" className="field-input" type="date" value={form.date} onChange={setField('date')} />
            <div className="field-group-label">{copy.payment}</div>
            <div className="choice-grid-3">
              <button className={choice(payment === 'transferencia') + ' pay'} onClick={() => setPayment('transferencia')}>{copy.transfer}</button>
              <button className={choice(payment === 'efectivo') + ' pay'} onClick={() => setPayment('efectivo')}>{copy.cash}</button>
              <button className={choice(payment === 'tarjeta') + ' pay'} onClick={() => setPayment('tarjeta')}>{copy.card}</button>
            </div>
            <label className="field-label" htmlFor="cw-notes">{copy.notes}</label>
            <textarea id="cw-notes" className="field-textarea" rows="2" value={form.notes} onChange={setField('notes')} placeholder={copy.notesPlaceholder} />

            <div className="summary-card">
              <div className="summary-row"><span>{copy.subtotal}</span><span>{fmt(subtotal, locale)}</span></div>
              <div className="summary-row"><span>{deliveryRowLabel}</span><span>{deliveryFeeLabel}</span></div>
              <div className="summary-total"><span className="label">{selectedZone?.quoteOnly && method === 'delivery' ? copy.productsTotal : copy.total}</span><span className="value">{fmt(total, locale)}</span></div>
              {selectedZone?.quoteOnly && method === 'delivery' && <p className="summary-pending">{copy.quotePending}</p>}
            </div>

            <button className="btn-confirm" onClick={place} disabled={sending}>{sending ? copy.sending : copy.confirm}</button>
            <button className="btn-back" onClick={() => setStep('cart')}>{copy.back}</button>
          </div>
        )}

        {step === 'done' && (
          <div className="done">
            <div className="done-check">✓</div>
            <h3 className="done-title">{copy.received}</h3>
            <p className="done-text">{copy.thanks}, <strong>{form.name}</strong>. {locale === 'en' ? 'Your order' : 'Tu pedido'} <strong>{orderId}</strong> {locale === 'en' ? 'for' : 'por'} <strong>{fmt(confirmedOrder?.total ?? total, locale)}</strong> {copy.registered}</p>
            <p className="done-note">{doneNote}</p>
            {waLink && <a className="btn-whatsapp" href={waLink} target="_blank" rel="noopener noreferrer">{copy.whatsapp}</a>}
            <button className="btn-dark" onClick={newOrder}>{copy.another}</button>
          </div>
        )}
      </aside>
    </>
  );
}

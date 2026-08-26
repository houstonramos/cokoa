import { useState, useEffect } from 'react';
import { CONTACT } from './data/catalog';
import { driveImageSrcSet, fetchCatalog, getInitialCatalog } from './lib/catalog';
import { fmt } from './lib/order';
import CartDrawer from './components/CartDrawer';

export default function App() {
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  // Arranca con el catálogo de respaldo (nunca hay pantalla vacía) y lo reemplaza
  // en cuanto llega el catálogo en vivo desde la hoja "Catálogo" (el panel de Manu).
  const [catalog, setCatalog] = useState(getInitialCatalog);

  useEffect(() => {
    let active = true;
    fetchCatalog().then((data) => {
      if (active) setCatalog(data);
    });
    return () => { active = false; };
  }, []);

  const { products, boxes, experiences } = catalog;

  const addToCart = (item) => {
    setCart((prev) => {
      const i = prev.findIndex((c) => c.id === item.id);
      if (i >= 0) {
        const next = prev.slice();
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, unit: item.unit, qty: 1 }];
    });
    setOpen(true);
  };

  const changeQty = (id, d) =>
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: c.qty + d } : c)).filter((c) => c.qty > 0));

  const cartCount = cart.reduce((t, c) => t + c.qty, 0);

  return (
    <div className="page">
      <div className="announcement">
        Delivery en Bávaro · Punta Cana &nbsp;—&nbsp; fuera de la ciudad, entregas por agenda
      </div>

      <nav className="nav">
        <a href="#top" className="nav-brand">
          <img src="/logo.png" alt="Cokoa by Chef Manu Rossi" className="nav-logo" />
        </a>
        <div className="nav-right">
          <div className="nav-links">
            <a href="#postres">Postres</a>
            <a href="#cajas">Cajas</a>
            <a href="#experiencias">Experiencias</a>
            <a href="#contacto">Contacto</a>
          </div>
          <button className="btn-cart" onClick={() => setOpen(true)}>
            Carrito <span className="btn-cart-count">{cartCount}</span>
          </button>
        </div>
      </nav>

      <section id="top" className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">Postres en lata · 300ml</div>
          <h1 className="hero-title">
            Capas de sabor,<br />hechas para<br /><em>cualquier momento.</em>
          </h1>
          <p className="hero-lede">
            Cremosos artesanales, listos para abrir, compartir y disfrutar. Hechos con ingredientes
            seleccionados y mucho amor por Chef Manuela Rossi.
          </p>
          <div className="hero-ctas">
            <a href="#postres" className="btn-primary">Ordenar ahora</a>
            <a href="#experiencias" className="btn-outline">Ver experiencias</a>
          </div>
          <div className="hero-badges">
            <span>10 sabores</span><span className="dot">·</span>
            <span>Gluten-free disp.</span><span className="dot">·</span>
            <span>Conservar refrigerado</span>
          </div>
        </div>
        <div className="hero-photo">
          <img src="/hero.webp" alt="Lata de postre Cokoa" fetchPriority="high" decoding="async" />
        </div>
      </section>

      <section id="postres" className="postres">
        <div className="postres-header">
          <div className="section-eyebrow">Nuestra carta</div>
          <h2 className="section-title">Postres en Lata</h2>
          <div className="section-heart"><span></span>♥<span></span></div>
        </div>
        <div className="postres-grid">
          {products.map((item, index) => (
            <div className="product-card" key={item.id}>
              <div className="product-photo">
                <CatalogImage
                  item={item}
                  priority={index === 0}
                  sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) 42vw, 300px"
                />
                <div className="product-badge">300ML</div>
              </div>
              <div className="product-body">
                <h3 className="product-name">{item.name}</h3>
                <p className="product-desc">{item.desc}</p>
                <div className="product-foot">
                  <span className="product-price">{fmt(item.price)}</span>
                  <button className="btn-add" onClick={() => addToCart(item)} aria-label={`Agregar ${item.name}`}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="postres-note">Hechos con ingredientes seleccionados y mucho amor · Conservar refrigerado</p>
      </section>

      <section id="cajas" className="cajas">
        <div className="cajas-header">
          <div className="section-eyebrow">Para regalar</div>
          <h2 className="section-title">Cajas de Dulces &amp; Regalos</h2>
          <p className="cajas-lede">Selecciones curadas de nuestros postres en lata, listas para sorprender.</p>
        </div>
        <div className="cajas-grid">
          {boxes.map((box) => (
            <div className="box-card" key={box.id}>
              <div className="box-photo">
                <CatalogImage item={box} sizes="(max-width: 700px) calc(100vw - 40px), 330px" />
              </div>
              <div className="box-body">
                <h3 className="box-name">{box.name}</h3>
                <p className="box-desc">{box.desc}</p>
                <div className="box-foot">
                  <span className="box-price">{fmt(box.price)}</span>
                  <button className="btn-gold" onClick={() => addToCart(box)}>Agregar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="experiencias" className="experiencias">
        <div className="experiencias-header">
          <div className="section-eyebrow">Vive el sabor</div>
          <h2 className="section-title">Experiencias Inmersivas</h2>
          <p className="experiencias-lede">
            Reserva tu cupo y vive una experiencia diseñada para sentir, descubrir y disfrutar con todos los sentidos.
          </p>
        </div>
        <div className="experiencias-grid">
          {experiences.map((exp) => (
            <div className="exp-card" key={exp.id}>
              <div className="exp-photo">
                <CatalogImage item={exp} sizes="(max-width: 700px) calc(100vw - 40px), 520px" />
              </div>
              <div className="exp-body">
                <h3 className="exp-name">{exp.name}</h3>
                <p className="exp-desc">{exp.desc}</p>
                <div className="exp-foot">
                  <div>
                    <div className="exp-price">{fmt(exp.price)}</div>
                    <div className="exp-unit">por persona</div>
                  </div>
                  <button className="btn-reserve" onClick={() => addToCart(exp)}>Reservar cupo</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="experiencias-note">La fecha de tu reserva se coordina al finalizar el pedido.</p>
      </section>

      <section className="delivery-band">
        <div className="delivery-grid">
          <div>
            <div className="delivery-title">Bávaro · Punta Cana</div>
            <p className="delivery-desc">Delivery dentro de la ciudad, entrega el mismo día.</p>
          </div>
          <div className="delivery-mid">
            <div className="delivery-title">Fuera de la ciudad</div>
            <p className="delivery-desc">Entregas <strong>por agenda</strong> — coordinamos fecha contigo.</p>
          </div>
          <div>
            <div className="delivery-title">Pickup en tienda</div>
            <p className="delivery-desc">Retira tu pedido sin costo en nuestra tienda.</p>
          </div>
        </div>
      </section>

      <footer id="contacto" className="footer">
        <img src="/logo.png" alt="Cokoa by Chef Manu Rossi" className="footer-logo" />
        <div className="footer-links">
          <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noopener noreferrer">
            @{CONTACT.instagram}
          </a>
          <span className="dot">·</span>
          <span>{CONTACT.location}</span>
          <span className="dot">·</span>
          <a href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a>
        </div>
        <p className="footer-thanks">Gracias por apoyar lo artesanal ♥</p>
      </footer>

      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        cart={cart}
        changeQty={changeQty}
        resetCart={() => setCart([])}
      />
    </div>
  );
}

function CatalogImage({ item, priority = false, sizes }) {
  const [failed, setFailed] = useState(false);
  const image = item.image || '';

  useEffect(() => setFailed(false), [image]);

  if (!image || failed) return <div className="placeholder">{item.name}</div>;

  return (
    <img
      src={image}
      srcSet={driveImageSrcSet(image)}
      sizes={sizes}
      alt={item.name}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

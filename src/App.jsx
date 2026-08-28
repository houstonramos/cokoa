import { useEffect, useState } from 'react';
import { CONTACT } from './data/catalog';
import {
  driveImageSrcSet,
  fetchCatalog,
  getInitialCatalog,
  hasOffer,
  isSoldOut,
  itemPrice,
  slugifyCategory,
} from './lib/catalog';
import { fmt } from './lib/order';
import CartDrawer from './components/CartDrawer';

const CATEGORY_COPY = {
  latas: {
    eyebrow: 'Nuestra carta',
    title: 'Postres en lata & Petit Gâteau',
    lede: 'Sabores artesanales en distintos tamaños, preparados para disfrutar donde quieras.',
  },
  postres: {
    eyebrow: 'Repostería artesanal',
    title: 'Postres & Petit Gâteau',
    lede: 'Creaciones individuales, delicadas y listas para convertir cualquier momento en una celebración.',
  },
  bebidas: {
    eyebrow: 'Para refrescarte',
    title: 'Bebidas',
    lede: 'Bebidas de cacao, café, chai y matcha preparadas con el sello de Cokoa.',
  },
  chocolates: {
    eyebrow: 'Cacao de origen',
    title: 'Chocolates',
    lede: 'Tabletas de chocolates orgánicos dominicanos y otras expresiones del mejor cacao local.',
  },
  cosmeticos: {
    eyebrow: 'Cacao para cuidarte',
    title: 'Cosméticos de cacao',
    lede: 'Productos de cuidado personal elaborados a partir de los beneficios naturales del cacao.',
  },
  cajas: {
    eyebrow: 'Para regalar',
    title: 'Cajas de Dulces & Regalos',
    lede: 'Selecciones curadas de nuestros productos, listas para sorprender.',
  },
  experiencias: {
    eyebrow: 'Vive el sabor',
    title: 'Experiencias Inmersivas',
    lede: 'Encuentros diseñados para sentir, descubrir y disfrutar con todos los sentidos.',
  },
};

export default function App() {
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState(null);
  const [catalog, setCatalog] = useState(getInitialCatalog);

  useEffect(() => {
    let active = true;
    fetchCatalog().then((data) => {
      if (!active) return;
      setCatalog(data);
      setCart((current) => current
        .map((line) => {
          const item = data.items.find((candidate) => candidate.id === line.id);
          return item ? { ...line, price: itemPrice(item), stock: item.stock } : line;
        })
        .filter((line) => line.stock !== 0));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!cartNotice) return undefined;
    const timer = window.setTimeout(() => setCartNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [cartNotice]);

  const groups = catalog.categories
    .filter((category) => category.active !== false)
    .map((category) => ({
      ...category,
      items: catalog.items.filter((item) => slugifyCategory(item.category) === slugifyCategory(category.name)),
    }))
    .filter((group) => group.items.length > 0);

  const firstSection = groups[0] ? `#${slugifyCategory(groups[0].name)}` : '#catalogo';

  const addToCart = (item) => {
    if (isSoldOut(item)) return;
    const currentLine = cart.find((line) => line.id === item.id);
    if (item.stock !== null && (currentLine?.qty || 0) >= item.stock) {
      setCartNotice({ id: `${item.id}-${Date.now()}`, name: item.name, status: 'limit' });
      return;
    }
    const price = itemPrice(item);
    setCart((prev) => {
      const index = prev.findIndex((line) => line.id === item.id);
      if (index >= 0) {
        if (item.stock !== null && prev[index].qty >= item.stock) return prev;
        const next = prev.slice();
        next[index] = { ...next[index], qty: next[index].qty + 1, price, stock: item.stock };
        return next;
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        price,
        originalPrice: item.price,
        unit: item.unit,
        stock: item.stock,
        qty: 1,
      }];
    });
    setCartNotice({ id: `${item.id}-${Date.now()}`, name: item.name, status: 'added' });
  };

  const changeQty = (id, delta) => setCart((prev) => prev
    .map((line) => {
      if (line.id !== id) return line;
      const nextQty = line.qty + delta;
      const cappedQty = line.stock === null ? nextQty : Math.min(nextQty, line.stock);
      return { ...line, qty: cappedQty };
    })
    .filter((line) => line.qty > 0));

  const cartCount = cart.reduce((total, line) => total + line.qty, 0);

  return (
    <div className="page">
      <div className="announcement">
        <span className="announcement-desktop">
          Delivery en Bávaro · Punta Cana &nbsp;—&nbsp; fuera de la ciudad, entregas por agenda
        </span>
        <span className="announcement-mobile">Delivery Bávaro · Punta Cana · Otras zonas por agenda</span>
      </div>

      <nav className="nav">
        <a href="#top" className="nav-brand">
          <img src="/logo.png" alt="Cokoa by Chef Manu Rossi" className="nav-logo" />
        </a>
        <div className="nav-right">
          <div className="nav-links cw-hide-scroll">
            {groups.map((group) => (
              <a key={group.id} href={`#${slugifyCategory(group.name)}`}>{group.name}</a>
            ))}
            <a href="#contacto">Contacto</a>
          </div>
          <button
            className={`btn-cart${cartNotice?.status === 'added' ? ' is-updated' : ''}`}
            onClick={() => { setOpen(true); setCartNotice(null); }}
          >
            Carrito <span className="btn-cart-count">{cartCount}</span>
          </button>
        </div>
      </nav>

      <section id="top" className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">Postres en lata & Petit Gâteau</div>
          <h1 className="hero-title">
            Capas de sabor,<br />hechas para<br /><em>cualquier momento.</em>
          </h1>
          <p className="hero-lede">
            Cremosos artesanales, listos para abrir, compartir y disfrutar. Hechos con ingredientes
            seleccionados y mucho amor por Chef Manuela Rossi.
          </p>
          <div className="hero-ctas">
            <a href={firstSection} className="btn-primary">Ordenar ahora</a>
            <a href="#experiencias" className="btn-outline">Ver experiencias</a>
          </div>
          <div className="hero-badges">
            <span>Hecho artesanalmente</span><span className="dot">·</span>
            <span>Gluten-free disp.</span><span className="dot">·</span>
            <span>Conservar refrigerado</span>
          </div>
        </div>
        <div className="hero-photo">
          <CatalogImage
            item={{ name: 'Selección Cokoa', image: catalog.settings.heroImage }}
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            imageStyle={{
              objectPosition: `${catalog.settings.heroPositionX}% ${catalog.settings.heroPositionY}%`,
              transform: `scale(${catalog.settings.heroZoom})`,
            }}
          />
        </div>
      </section>

      <main id="catalogo">
        {groups.map((group, groupIndex) => (
          <CatalogSection
            key={group.id}
            group={group}
            groupIndex={groupIndex}
            cart={cart}
            addToCart={addToCart}
            changeQty={changeQty}
          />
        ))}
      </main>

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

      {cartNotice && (
        <div className={`cart-notice cart-notice-${cartNotice.status}`} role="status" aria-live="polite">
          <div className="cart-notice-copy">
            <strong>{cartNotice.status === 'added' ? 'Agregado al carrito' : 'Cantidad máxima alcanzada'}</strong>
            <span>{cartNotice.name}</span>
          </div>
          {cartNotice.status === 'added' && (
            <button onClick={() => { setOpen(true); setCartNotice(null); }}>
              Ver carrito · {cartCount}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CatalogSection({ group, groupIndex, cart, addToCart, changeQty }) {
  const slug = slugifyCategory(group.name);
  const copy = CATEGORY_COPY[slug] || {
    eyebrow: 'Colección Cokoa',
    title: group.name,
    lede: 'Descubre nuestra selección artesanal preparada con ingredientes elegidos cuidadosamente.',
  };
  const theme = groupIndex % 2 ? ' catalog-section-alt' : '';

  return (
    <section id={slug} className={`catalog-section${theme}`}>
      <div className="catalog-header">
        <div className="section-eyebrow">{copy.eyebrow}</div>
        <h2 className="section-title">{copy.title}</h2>
        <p className="catalog-lede">{copy.lede}</p>
        <div className="section-heart"><span></span>♥<span></span></div>
      </div>
      <div className="postres-grid">
        {group.items.map((item, index) => (
          <ProductCard
            key={item.id}
            item={item}
            priority={groupIndex === 0 && index === 0}
            quantity={cart.find((line) => line.id === item.id)?.qty || 0}
            addToCart={addToCart}
            changeQty={changeQty}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ item, priority, quantity, addToCart, changeQty }) {
  const soldOut = isSoldOut(item);
  const offered = hasOffer(item);
  const unit = displayUnit(item.unit);
  const reachedStockLimit = item.stock !== null && quantity >= item.stock;

  return (
    <article className={`product-card${soldOut ? ' product-card-soldout' : ''}${quantity > 0 ? ' product-card-selected' : ''}`}>
      <div className="product-photo">
        <CatalogImage
          item={item}
          priority={priority}
          sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) 42vw, 300px"
        />
        <div className="product-flags">
          {offered && <span className="product-offer-badge">Oferta</span>}
          {unit && <span className="product-badge">{unit}</span>}
        </div>
        {soldOut && <div className="product-soldout-overlay">Agotado</div>}
      </div>
      <div className="product-body">
        <h3 className="product-name">{item.name}</h3>
        <p className="product-desc">{item.desc}</p>
        <div className="product-foot">
          <div className="product-prices">
            {offered && <span className="product-price-old">{fmt(item.price)}</span>}
            <span className="product-price">{fmt(itemPrice(item))}</span>
          </div>
          {quantity > 0 ? (
            <div className="product-quantity" aria-label={`${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} de ${item.name} en el carrito`}>
              <button onClick={() => changeQty(item.id, -1)} aria-label={`Quitar una unidad de ${item.name}`}>−</button>
              <span><strong>{quantity}</strong><small>en carrito</small></span>
              <button
                onClick={() => addToCart(item)}
                aria-label={`Agregar otra unidad de ${item.name}`}
                disabled={reachedStockLimit}
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="btn-add"
              onClick={() => addToCart(item)}
              aria-label={soldOut ? `${item.name} agotado` : `Agregar ${item.name}`}
              disabled={soldOut}
            >
              {soldOut ? '×' : '+'}
            </button>
          )}
        </div>
        {item.stock !== null && !soldOut && item.stock <= 5 && (
          <p className="product-low-stock">Solo quedan {item.stock}</p>
        )}
      </div>
    </article>
  );
}

function displayUnit(value) {
  return String(value || '')
    .trim()
    .replace(/^lata\s+/i, '')
    .replace(/(\d)\s*ml\b/i, '$1 ml')
    .toUpperCase();
}

function CatalogImage({ item, priority = false, sizes, imageStyle }) {
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
      style={imageStyle}
      onError={() => setFailed(true)}
    />
  );
}

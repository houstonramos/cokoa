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
import {
  getProductEnglish,
  localizeCategory,
  localizeDeliveryZone,
  localizeItem,
} from './lib/i18n';
import CartDrawer from './components/CartDrawer';

const CATEGORY_COPY = {
  es: {
    latas: { eyebrow: 'Nuestra carta', title: 'Postres en lata & Petit Gâteau', lede: 'Sabores artesanales en distintos tamaños, preparados para disfrutar donde quieras.' },
    postres: { eyebrow: 'Repostería artesanal', title: 'Postres & Petit Gâteau', lede: 'Creaciones individuales, delicadas y listas para convertir cualquier momento en una celebración.' },
    bebidas: { eyebrow: 'Para refrescarte', title: 'Bebidas', lede: 'Bebidas de cacao, café, chai y matcha preparadas con el sello de Cokoa.' },
    chocolates: { eyebrow: 'Cacao de origen', title: 'Chocolates', lede: 'Tabletas de chocolates orgánicos dominicanos y otras expresiones del mejor cacao local.' },
    cosmeticos: { eyebrow: 'Cacao para cuidarte', title: 'Cosméticos de cacao', lede: 'Productos de cuidado personal elaborados a partir de los beneficios naturales del cacao.' },
    cajas: { eyebrow: 'Para regalar', title: 'Cajas de Dulces & Regalos', lede: 'Selecciones curadas de nuestros productos, listas para sorprender.' },
    experiencias: { eyebrow: 'Vive el sabor', title: 'Experiencias Inmersivas', lede: 'Encuentros diseñados para sentir, descubrir y disfrutar con todos los sentidos.' },
    'tabletas-de-chocolates-organicos-dominicanos': { eyebrow: 'Cacao dominicano', title: 'Tabletas de Chocolate Orgánico', lede: 'Combinaciones artesanales que celebran el carácter y la riqueza del cacao dominicano.' },
  },
  en: {
    latas: { eyebrow: 'Our menu', title: 'Desserts in Cans & Petit Gâteau', lede: 'Handcrafted flavors in different sizes, prepared for you to enjoy wherever you are.' },
    postres: { eyebrow: 'Artisan pastry', title: 'Desserts & Petit Gâteau', lede: 'Delicate individual creations ready to turn any moment into a celebration.' },
    bebidas: { eyebrow: 'Refresh yourself', title: 'Drinks', lede: 'Cacao, coffee, chai and matcha drinks prepared with the distinctive Cokoa touch.' },
    chocolates: { eyebrow: 'Origin cacao', title: 'Chocolates', lede: 'Dominican organic chocolate bars and other expressions of the finest local cacao.' },
    cosmeticos: { eyebrow: 'Cacao self-care', title: 'Cacao Cosmetics', lede: 'Personal care products crafted from the natural benefits of cacao.' },
    cajas: { eyebrow: 'Made for gifting', title: 'Sweets & Gift Boxes', lede: 'Curated selections of our products, ready to surprise someone special.' },
    experiencias: { eyebrow: 'Experience the flavor', title: 'Immersive Experiences', lede: 'Encounters designed to feel, discover and enjoy with all your senses.' },
    'tabletas-de-chocolates-organicos-dominicanos': { eyebrow: 'Dominican cacao', title: 'Dominican Organic Chocolate Bars', lede: 'Handcrafted combinations that celebrate the character and richness of Dominican cacao.' },
  },
};

const PUBLIC_COPY = {
  es: {
    contact: 'Contacto', cart: 'Carrito', heroEyebrow: 'Postres en lata & Petit Gâteau',
    heroTitle: <>Capas de sabor,<br />hechas para<br /><em>cualquier momento.</em></>,
    heroLede: 'Cremosos artesanales, listos para abrir, compartir y disfrutar. Hechos con ingredientes seleccionados y mucho amor por Chef Manuela Rossi.',
    orderNow: 'Ordenar ahora', seeExperiences: 'Ver experiencias', handmade: 'Hecho artesanalmente', glutenFree: 'Gluten-free disp.', refrigerated: 'Conservar refrigerado',
    pickupAvailable: 'Pickup disponible en tienda', deliveryIn: 'Delivery en', deliveryZones: 'Delivery disponible en {count} zonas', rates: 'consulta la tarifa de tu zona al ordenar',
    mobileDelivery: 'Delivery disponible · Consulta zonas y tarifas', quoteRate: 'Tarifa por cotizar', availableDelivery: 'Delivery disponible.', minimumOrder: 'Pedido mínimo',
    pickup: 'Pickup en tienda', pickupDesc: 'Retira tu pedido sin costo en nuestra tienda.', thanks: 'Gracias por apoyar lo artesanal ♥',
    offer: 'Oferta', soldOut: 'Agotado', inCart: 'en carrito', onlyLeft: 'Solo quedan', unit: 'unidad', units: 'unidades',
    add: 'Agregar', removeOne: 'Quitar una unidad de', addAnother: 'Agregar otra unidad de', maxReached: 'Cantidad máxima alcanzada', added: 'Agregado al carrito', viewCart: 'Ver carrito',
    collection: 'Colección Cokoa', collectionLede: 'Descubre nuestra selección artesanal preparada con ingredientes elegidos cuidadosamente.',
  },
  en: {
    contact: 'Contact', cart: 'Cart', heroEyebrow: 'Desserts in Cans & Petit Gâteau',
    heroTitle: <>Layers of flavor,<br />made for<br /><em>every moment.</em></>,
    heroLede: 'Handcrafted creamy desserts, ready to open, share and enjoy. Made with carefully selected ingredients and plenty of love by Chef Manuela Rossi.',
    orderNow: 'Order now', seeExperiences: 'View experiences', handmade: 'Handcrafted', glutenFree: 'Gluten-free available', refrigerated: 'Keep refrigerated',
    pickupAvailable: 'Store pickup available', deliveryIn: 'Delivery in', deliveryZones: 'Delivery available in {count} zones', rates: 'check your zone rate when ordering',
    mobileDelivery: 'Delivery available · View zones and rates', quoteRate: 'Rate upon request', availableDelivery: 'Delivery available.', minimumOrder: 'Minimum order',
    pickup: 'Store pickup', pickupDesc: 'Pick up your order at our store at no additional cost.', thanks: 'Thank you for supporting handcrafted products ♥',
    offer: 'Sale', soldOut: 'Sold out', inCart: 'in cart', onlyLeft: 'Only', unit: 'item', units: 'items',
    add: 'Add', removeOne: 'Remove one unit of', addAnother: 'Add another unit of', maxReached: 'Maximum quantity reached', added: 'Added to cart', viewCart: 'View cart',
    collection: 'Cokoa collection', collectionLede: 'Discover our handcrafted selection, prepared with carefully chosen ingredients.',
  },
};

export default function App({ locale = 'es' }) {
  const copy = PUBLIC_COPY[locale] || PUBLIC_COPY.es;
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
      display: localizeCategory(category, locale),
      items: catalog.items.filter((item) => slugifyCategory(item.category) === slugifyCategory(category.name)),
    }))
    .filter((group) => group.items.length > 0);

  const firstSection = groups[0] ? `#${slugifyCategory(groups[0].name)}` : '#catalogo';
  const deliveryZones = (catalog.deliveryZones || [])
    .filter((zone) => zone.active !== false)
    .map((zone) => localizeDeliveryZone(zone, locale));
  const deliverySummary = deliveryZones.length === 0
    ? copy.pickupAvailable
    : deliveryZones.length === 1
      ? `${copy.deliveryIn} ${deliveryZones[0].name}`
      : copy.deliveryZones.replace('{count}', deliveryZones.length);
  const deliveryAnnouncement = deliveryZones.length
    ? `${deliverySummary} — ${copy.rates}`
    : deliverySummary;

  const addToCart = (item) => {
    if (isSoldOut(item)) return;
    const translatedItem = localizeItem(item, locale);
    const englishItem = getProductEnglish(item);
    const currentLine = cart.find((line) => line.id === item.id);
    if (item.stock !== null && (currentLine?.qty || 0) >= item.stock) {
      setCartNotice({ id: `${item.id}-${Date.now()}`, name: translatedItem.name, status: 'limit' });
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
        name: translatedItem.name,
        nameEs: item.name,
        nameEn: englishItem.name,
        price,
        originalPrice: item.price,
        unit: translatedItem.unit,
        unitEs: item.unit,
        unitEn: englishItem.unit,
        stock: item.stock,
        qty: 1,
      }];
    });
    setCartNotice({ id: `${item.id}-${Date.now()}`, name: translatedItem.name, status: 'added' });
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
          {deliveryAnnouncement}
        </span>
        <span className="announcement-mobile">
          {deliveryZones.length ? copy.mobileDelivery : deliverySummary}
        </span>
      </div>

      <nav className="nav">
        <a href="#top" className="nav-brand">
          <img src="/logo.png" alt="Cokoa by Chef Manu Rossi" className="nav-logo" />
        </a>
        <div className="nav-right">
          <div className="nav-links cw-hide-scroll">
            {groups.map((group) => (
              <a key={group.id} href={`#${slugifyCategory(group.name)}`}>{group.display.name}</a>
            ))}
            <a href="#contacto">{copy.contact}</a>
          </div>
          <div className="language-switch" aria-label={locale === 'en' ? 'Language' : 'Idioma'}>
            <a href="/" className={locale === 'es' ? 'active' : ''} lang="es" aria-current={locale === 'es' ? 'page' : undefined}>ES</a>
            <span>/</span>
            <a href="/en" className={locale === 'en' ? 'active' : ''} lang="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</a>
          </div>
          <button
            className={`btn-cart${cartNotice?.status === 'added' ? ' is-updated' : ''}`}
            onClick={() => { setOpen(true); setCartNotice(null); }}
          >
            {copy.cart} <span className="btn-cart-count">{cartCount}</span>
          </button>
        </div>
      </nav>

      <section id="top" className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">{copy.heroEyebrow}</div>
          <h1 className="hero-title">
            {copy.heroTitle}
          </h1>
          <p className="hero-lede">{copy.heroLede}</p>
          <div className="hero-ctas">
            <a href={firstSection} className="btn-primary">{copy.orderNow}</a>
            <a href="#experiencias" className="btn-outline">{copy.seeExperiences}</a>
          </div>
          <div className="hero-badges">
            <span>{copy.handmade}</span><span className="dot">·</span>
            <span>{copy.glutenFree}</span><span className="dot">·</span>
            <span>{copy.refrigerated}</span>
          </div>
        </div>
        <div className="hero-photo">
          <CatalogImage
            item={{ name: locale === 'en' ? 'Cokoa selection' : 'Selección Cokoa', image: catalog.settings.heroImage }}
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
            locale={locale}
            copy={copy}
          />
        ))}
      </main>

      <section className="delivery-band">
        <div className="delivery-grid">
          {deliveryZones.map((zone) => (
            <div className="delivery-option" key={zone.id}>
              <div className="delivery-title">{zone.name}</div>
              <p className="delivery-price">{zone.quoteOnly ? copy.quoteRate : fmt(zone.fee, locale)}</p>
              <p className="delivery-desc">
                {zone.coverage || copy.availableDelivery}
                {zone.eta && <><br /><strong>{zone.eta}</strong></>}
                {zone.minimum > 0 && <><br />{copy.minimumOrder}: {fmt(zone.minimum, locale)}</>}
              </p>
            </div>
          ))}
          <div>
            <div className="delivery-title">{copy.pickup}</div>
            <p className="delivery-desc">{copy.pickupDesc}</p>
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
        <p className="footer-thanks">{copy.thanks}</p>
      </footer>

      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        cart={cart}
        changeQty={changeQty}
        resetCart={() => setCart([])}
        deliveryZones={deliveryZones}
        locale={locale}
      />

      {cartNotice && (
        <div className={`cart-notice cart-notice-${cartNotice.status}`} role="status" aria-live="polite">
          <div className="cart-notice-copy">
            <strong>{cartNotice.status === 'added' ? copy.added : copy.maxReached}</strong>
            <span>{cartNotice.name}</span>
          </div>
          {cartNotice.status === 'added' && (
            <button onClick={() => { setOpen(true); setCartNotice(null); }}>
              {copy.viewCart} · {cartCount}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CatalogSection({ group, groupIndex, cart, addToCart, changeQty, locale, copy: publicCopy }) {
  const slug = slugifyCategory(group.name);
  const copy = CATEGORY_COPY[locale][slug] || {
    eyebrow: publicCopy.collection,
    title: group.display.name,
    lede: publicCopy.collectionLede,
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
            locale={locale}
            copy={publicCopy}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ item, priority, quantity, addToCart, changeQty, locale, copy }) {
  const displayItem = localizeItem(item, locale);
  const soldOut = isSoldOut(item);
  const offered = hasOffer(item);
  const unit = displayUnit(displayItem.unit);
  const reachedStockLimit = item.stock !== null && quantity >= item.stock;

  return (
    <article className={`product-card${soldOut ? ' product-card-soldout' : ''}${quantity > 0 ? ' product-card-selected' : ''}`}>
      <div className="product-photo">
        <CatalogImage
          item={displayItem}
          priority={priority}
          sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) 42vw, 300px"
        />
        <div className="product-flags">
          {offered && <span className="product-offer-badge">{copy.offer}</span>}
          {unit && <span className="product-badge">{unit}</span>}
        </div>
        {soldOut && <div className="product-soldout-overlay">{copy.soldOut}</div>}
      </div>
      <div className="product-body">
        <h3 className="product-name">{displayItem.name}</h3>
        <p className="product-desc">{displayItem.desc}</p>
        <div className="product-foot">
          <div className="product-prices">
            {offered && <span className="product-price-old">{fmt(item.price, locale)}</span>}
            <span className="product-price">{fmt(itemPrice(item), locale)}</span>
          </div>
          {quantity > 0 ? (
            <div className="product-quantity" aria-label={`${quantity} ${quantity === 1 ? copy.unit : copy.units} ${locale === 'en' ? 'of' : 'de'} ${displayItem.name} ${copy.inCart}`}>
              <button onClick={() => changeQty(item.id, -1)} aria-label={`${copy.removeOne} ${displayItem.name}`}>−</button>
              <span><strong>{quantity}</strong><small>{copy.inCart}</small></span>
              <button
                onClick={() => addToCart(item)}
                aria-label={`${copy.addAnother} ${displayItem.name}`}
                disabled={reachedStockLimit}
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="btn-add"
              onClick={() => addToCart(item)}
              aria-label={soldOut ? `${displayItem.name} ${copy.soldOut}` : `${copy.add} ${displayItem.name}`}
              disabled={soldOut}
            >
              {soldOut ? '×' : '+'}
            </button>
          )}
        </div>
        {item.stock !== null && !soldOut && item.stock <= 5 && (
          <p className="product-low-stock">{locale === 'en' ? `${copy.onlyLeft} ${item.stock} left` : `${copy.onlyLeft} ${item.stock}`}</p>
        )}
      </div>
    </article>
  );
}

function displayUnit(value) {
  return String(value || '')
    .trim()
    .replace(/^lata\s+/i, '')
    .replace(/^can\s+/i, '')
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

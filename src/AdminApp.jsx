import { useEffect, useRef, useState } from 'react';
import {
  clearPin,
  deleteDeliveryZone,
  deleteItem,
  fetchAdminCatalog,
  getSavedPin,
  login,
  saveCategory,
  saveDeliveryZone,
  saveItem,
  savePin,
  saveSettings,
  uploadImage,
} from './lib/admin';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_DELIVERY_ZONES,
  DEFAULT_HERO_SETTINGS,
  hasOffer,
  normalizeCategoryName,
  normalizeDriveImageUrl,
  normalizeDeliveryZones,
  normalizeHeroSettings,
  slugifyCategory,
} from './lib/catalog';

const emptyItem = (category = 'Latas') => ({
  id: '',
  category,
  name: '',
  desc: '',
  price: '',
  unit: '',
  image: '',
  rawImage: '',
  active: true,
  stock: '',
  offerActive: false,
  offerPrice: '',
});

const emptyDeliveryZone = (order) => ({
  _key: `delivery-${Date.now()}-${order}`,
  id: '',
  name: '',
  coverage: '',
  fee: '',
  minimum: '',
  eta: '',
  requestDate: false,
  quoteOnly: false,
  order,
  active: true,
});

function normalizeAdminDeliveryZones(values) {
  return normalizeDeliveryZones(values, true).map((zone, index) => ({
    ...zone,
    _key: zone.id || `delivery-${index}`,
    minimum: zone.minimum || '',
  }));
}

function fmt(n) {
  return 'RD$' + Number(n || 0).toLocaleString('es-DO');
}

function normalizeAdminItem(item) {
  return {
    ...emptyItem(normalizeCategoryName(item.category)),
    ...item,
    category: normalizeCategoryName(item.category),
    stock: item.stock === null || typeof item.stock === 'undefined' ? '' : item.stock,
    offerActive: item.offerActive === true,
    offerPrice: item.offerPrice || '',
  };
}

function normalizeCategories(values, items) {
  const source = Array.isArray(values) && values.length ? values : DEFAULT_CATEGORIES;
  const categories = source.map((category, index) => ({
    id: slugifyCategory(category.id || category.name || category),
    name: normalizeCategoryName(category.name || category),
    order: Number(category.order) || index + 1,
    active: category.active !== false,
  }));
  const seen = new Set(categories.map((category) => category.id));
  items.forEach((item) => {
    const id = slugifyCategory(item.category);
    if (!seen.has(id)) {
      categories.push({ id, name: item.category, order: categories.length + 1, active: true });
      seen.add(id);
    }
  });
  return categories.sort((a, b) => a.order - b.order);
}

export default function AdminApp() {
  const [pin, setPin] = useState(getSavedPin());
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [checking, setChecking] = useState(true);

  const [items, setItems] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState({ ...DEFAULT_HERO_SETTINGS });
  const [deliveryZones, setDeliveryZones] = useState(() => normalizeAdminDeliveryZones(DEFAULT_DELIVERY_ZONES));
  const [newCategory, setNewCategory] = useState('');
  const [loadError, setLoadError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroSaving, setHeroSaving] = useState(false);
  const [savingDeliveryId, setSavingDeliveryId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!pin) { setChecking(false); return; }
    login(pin).then((res) => {
      setAuthed(!!res.ok);
      setChecking(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authed) loadCatalog();
  }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCatalog = async () => {
    setLoadError('');
    const res = await fetchAdminCatalog(pin);
    if (!res.ok) {
      setLoadError(res.error || 'No se pudo cargar el catálogo.');
      return;
    }
    const nextItems = (Array.isArray(res.items) ? res.items : []).map(normalizeAdminItem);
    setItems(nextItems);
    setCategories(normalizeCategories(res.categories, nextItems));
    setSettings(normalizeHeroSettings(res.settings));
    setDeliveryZones(normalizeAdminDeliveryZones(res.deliveryZones));
  };

  const doLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    const res = await login(pinInput);
    if (res.ok) {
      savePin(pinInput);
      setPin(pinInput);
      setAuthed(true);
    } else {
      setLoginError(res.error || 'Clave incorrecta. Verifica con tu soporte técnico.');
    }
  };

  const logout = () => {
    clearPin();
    setAuthed(false);
    setPin('');
    setPinInput('');
    setItems(null);
  };

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const updateItem = (index, patch) => setItems((previous) => (previous || [])
    .map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));

  const addNew = (category) => setItems((previous) => [{ ...emptyItem(category) }, ...(previous || [])]);

  const addCategory = async (event) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((category) => slugifyCategory(category.name) === slugifyCategory(name))) {
      showToast('Esa categoría ya existe.');
      return;
    }
    const category = { id: slugifyCategory(name), name, order: categories.length + 1, active: true };
    const res = await saveCategory(pin, category);
    if (!res.ok) {
      showToast('No se pudo crear la categoría: ' + (res.error || 'intenta de nuevo'));
      return;
    }
    setCategories((previous) => [...previous, category]);
    setNewCategory('');
    showToast('Categoría agregada.');
  };

  const remove = async (index) => {
    const item = items[index];
    if (!window.confirm(`¿Eliminar "${item.name || 'este producto'}" definitivamente?`)) return;
    if (item.id) {
      const res = await deleteItem(pin, item.id);
      if (!res.ok) {
        showToast('No se pudo eliminar: ' + (res.error || 'intenta de nuevo'));
        return;
      }
    }
    setItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    showToast('Producto eliminado.');
  };

  const save = async (index) => {
    const item = items[index];
    if (!item.name.trim() || !item.price) {
      showToast('Falta el nombre o el precio.');
      return;
    }
    if (item.offerActive && (!item.offerPrice || Number(item.offerPrice) >= Number(item.price))) {
      showToast('El precio de oferta debe ser menor que el precio regular.');
      return;
    }
    setSavingId(index);
    const res = await saveItem(pin, item);
    setSavingId(null);
    if (res.ok) {
      updateItem(index, { id: res.id });
      showToast('Guardado correctamente.');
    } else {
      showToast('Error al guardar: ' + (res.error || 'intenta de nuevo'));
    }
  };

  const onImagePick = async (index, file) => {
    if (!file) return;
    const itemBeforeUpload = items[index];
    updateItem(index, { uploading: true });
    try {
      const res = await uploadImage(pin, file);
      if (!res.ok) {
        updateItem(index, { uploading: false });
        showToast('No se pudo subir la foto: ' + (res.error || 'intenta de nuevo'));
        return;
      }

      const displayUrl = normalizeDriveImageUrl(res.url);
      const itemWithImage = { ...itemBeforeUpload, image: displayUrl, rawImage: res.url, uploading: false };
      updateItem(index, { image: displayUrl, rawImage: res.url, uploading: false });

      if (itemBeforeUpload.name && itemBeforeUpload.name.trim() && itemBeforeUpload.price) {
        setSavingId(index);
        const saveRes = await saveItem(pin, itemWithImage);
        setSavingId(null);
        if (saveRes.ok) {
          updateItem(index, { id: saveRes.id });
          showToast('Foto subida y guardada.');
          return;
        }
        showToast('Foto subida, pero no se pudo guardar: ' + (saveRes.error || 'pulsa Guardar'));
        return;
      }

      showToast('Foto subida. Completa nombre y precio, luego pulsa Guardar.');
    } catch (error) {
      updateItem(index, { uploading: false });
      showToast('No se pudo subir la foto: ' + (error && error.message ? error.message : 'intenta de nuevo'));
    }
  };

  const onHeroImagePick = async (file) => {
    if (!file) return;
    setHeroUploading(true);
    try {
      const upload = await uploadImage(pin, file);
      if (!upload.ok) {
        showToast('No se pudo subir la portada: ' + (upload.error || 'intenta de nuevo'));
        return;
      }
      const nextSettings = { ...settings, heroImage: upload.url };
      const saved = await saveSettings(pin, nextSettings);
      if (!saved.ok) {
        showToast('La imagen subió, pero no se pudo guardar como portada.');
        return;
      }
      setSettings(normalizeHeroSettings(saved.settings || nextSettings));
      showToast('Portada actualizada. Ajusta el encuadre si lo necesitas.');
    } catch (error) {
      showToast('No se pudo actualizar la portada: ' + (error && error.message ? error.message : 'intenta de nuevo'));
    } finally {
      setHeroUploading(false);
    }
  };

  const saveHeroFraming = async () => {
    setHeroSaving(true);
    const saved = await saveSettings(pin, settings);
    setHeroSaving(false);
    if (!saved.ok) {
      showToast('No se pudo guardar el encuadre: ' + (saved.error || 'intenta de nuevo'));
      return;
    }
    setSettings(normalizeHeroSettings(saved.settings || settings));
    showToast('Encuadre de portada guardado.');
  };

  const updateDeliveryZone = (index, patch) => setDeliveryZones((previous) => previous
    .map((zone, zoneIndex) => (zoneIndex === index ? { ...zone, ...patch } : zone)));

  const addDeliveryZone = () => setDeliveryZones((previous) => [
    ...previous,
    emptyDeliveryZone(previous.length + 1),
  ]);

  const saveDelivery = async (index) => {
    const zone = deliveryZones[index];
    if (!zone.name.trim()) {
      showToast('Escribe el nombre de la zona.');
      return;
    }
    setSavingDeliveryId(zone._key);
    const res = await saveDeliveryZone(pin, zone);
    setSavingDeliveryId(null);
    if (!res.ok) {
      showToast('No se pudo guardar la zona: ' + (res.error || 'intenta de nuevo'));
      return;
    }
    const saved = normalizeAdminDeliveryZones([res.zone])[0];
    setDeliveryZones((previous) => previous
      .map((current, zoneIndex) => (zoneIndex === index ? { ...saved, _key: saved.id } : current))
      .sort((a, b) => Number(a.order) - Number(b.order)));
    showToast('Zona de delivery guardada.');
  };

  const removeDelivery = async (index) => {
    const zone = deliveryZones[index];
    if (!window.confirm(`¿Eliminar la zona "${zone.name || 'sin nombre'}"?`)) return;
    if (zone.id) {
      const res = await deleteDeliveryZone(pin, zone.id);
      if (!res.ok) {
        showToast('No se pudo eliminar la zona: ' + (res.error || 'intenta de nuevo'));
        return;
      }
    }
    setDeliveryZones((previous) => previous.filter((_, zoneIndex) => zoneIndex !== index));
    showToast('Zona eliminada.');
  };

  if (checking) return <div className="admin-shell"><p className="admin-loading">Cargando…</p></div>;

  if (!authed) {
    return (
      <div className="admin-shell admin-login-shell">
        <form className="admin-login-card" onSubmit={doLogin}>
          <img src="/logo.png" alt="Cokoa" className="admin-login-logo" />
          <h1>Panel de Cokoa</h1>
          <p className="admin-login-sub">Ingresa tu clave para administrar tu tienda.</p>
          <input
            type="password"
            inputMode="numeric"
            placeholder="Clave"
            value={pinInput}
            onChange={(event) => setPinInput(event.target.value)}
            autoFocus
          />
          {loginError && <p className="admin-error">{loginError}</p>}
          <button type="submit" className="btn-dark">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <img src="/logo.png" alt="Cokoa" className="admin-header-logo" />
        <div className="admin-header-right">
          <a href="/" className="admin-link">Ver sitio →</a>
          <button className="admin-link admin-logout" onClick={logout}>Salir</button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-hero-editor">
          <div className="admin-hero-preview">
            <img
              src={normalizeDriveImageUrl(settings.heroImage, 1280)}
              alt="Portada actual"
              style={{
                objectPosition: `${settings.heroPositionX}% ${settings.heroPositionY}%`,
                transform: `scale(${settings.heroZoom})`,
              }}
            />
            {heroUploading && <div className="admin-photo-uploading">Subiendo portada…</div>}
            <ImagePicker
              className="admin-hero-photo-btn"
              label="Cambiar portada"
              onPick={onHeroImagePick}
            />
          </div>
          <div className="admin-hero-copy">
            <span>Imagen principal</span>
            <h1>Portada de la tienda</h1>
            <p>Cámbiala y ajusta el recorte sin modificar la foto original.</p>
            <div className="admin-hero-crop">
              <label>
                <span>Horizontal <b>{Math.round(settings.heroPositionX)}%</b></span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.heroPositionX}
                  onChange={(event) => setSettings((current) => ({ ...current, heroPositionX: Number(event.target.value) }))}
                />
              </label>
              <label>
                <span>Vertical <b>{Math.round(settings.heroPositionY)}%</b></span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.heroPositionY}
                  onChange={(event) => setSettings((current) => ({ ...current, heroPositionY: Number(event.target.value) }))}
                />
              </label>
              <label>
                <span>Zoom <b>{Math.round(settings.heroZoom * 100)}%</b></span>
                <input
                  type="range"
                  min="100"
                  max="180"
                  value={Math.round(settings.heroZoom * 100)}
                  onChange={(event) => setSettings((current) => ({ ...current, heroZoom: Number(event.target.value) / 100 }))}
                />
              </label>
              <div className="admin-hero-crop-actions">
                <button
                  type="button"
                  className="admin-hero-reset"
                  onClick={() => setSettings((current) => ({ ...current, heroPositionX: 50, heroPositionY: 50, heroZoom: 1 }))}
                >
                  Centrar
                </button>
                <button type="button" className="admin-hero-save" onClick={saveHeroFraming} disabled={heroSaving}>
                  {heroSaving ? 'Guardando…' : 'Guardar encuadre'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-delivery-manager">
          <div className="admin-delivery-heading">
            <div>
              <span className="admin-section-kicker">Configuración del checkout</span>
              <h2>Zonas de delivery</h2>
              <p>Crea las zonas, define sus tarifas y decide cuáles aparecen para el cliente.</p>
            </div>
            <button type="button" className="btn-outline-small" onClick={addDeliveryZone}>+ Nueva zona</button>
          </div>

          <div className="admin-delivery-grid">
            {deliveryZones.map((zone, index) => (
              <article className={`admin-delivery-card${zone.active === false ? ' is-inactive' : ''}`} key={zone._key}>
                <div className="admin-delivery-card-head">
                  <span>Zona {index + 1}</span>
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      checked={zone.active !== false}
                      onChange={(event) => updateDeliveryZone(index, { active: event.target.checked })}
                    />
                    Visible
                  </label>
                </div>

                <label className="admin-delivery-field admin-delivery-name">
                  <span>Nombre de la zona</span>
                  <input
                    value={zone.name}
                    onChange={(event) => updateDeliveryZone(index, { name: event.target.value })}
                    placeholder="Ej. Cap Cana"
                  />
                </label>

                <label className="admin-delivery-field">
                  <span>Sectores o cobertura</span>
                  <textarea
                    rows={2}
                    value={zone.coverage}
                    onChange={(event) => updateDeliveryZone(index, { coverage: event.target.value })}
                    placeholder="Describe los sectores incluidos"
                  />
                </label>

                <div className="admin-delivery-row">
                  <label className="admin-delivery-field">
                    <span>Tarifa (RD$)</span>
                    <input
                      type="number"
                      min="0"
                      value={zone.fee}
                      disabled={zone.quoteOnly}
                      onChange={(event) => updateDeliveryZone(index, { fee: event.target.value })}
                      placeholder="0"
                    />
                  </label>
                  <label className="admin-delivery-field">
                    <span>Pedido mínimo</span>
                    <input
                      type="number"
                      min="0"
                      value={zone.minimum}
                      onChange={(event) => updateDeliveryZone(index, { minimum: event.target.value })}
                      placeholder="Sin mínimo"
                    />
                  </label>
                </div>

                <div className="admin-delivery-row">
                  <label className="admin-delivery-field">
                    <span>Tiempo estimado</span>
                    <input
                      value={zone.eta}
                      onChange={(event) => updateDeliveryZone(index, { eta: event.target.value })}
                      placeholder="Ej. Mismo día"
                    />
                  </label>
                  <label className="admin-delivery-field admin-delivery-order">
                    <span>Orden</span>
                    <input
                      type="number"
                      min="1"
                      value={zone.order}
                      onChange={(event) => updateDeliveryZone(index, { order: event.target.value })}
                    />
                  </label>
                </div>

                <div className="admin-delivery-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={zone.quoteOnly === true}
                      onChange={(event) => updateDeliveryZone(index, { quoteOnly: event.target.checked })}
                    />
                    Precio por cotizar
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={zone.requestDate === true}
                      onChange={(event) => updateDeliveryZone(index, { requestDate: event.target.checked })}
                    />
                    Solicitar fecha
                  </label>
                </div>

                <div className="admin-card-actions">
                  <button
                    type="button"
                    className="btn-dark admin-save"
                    onClick={() => saveDelivery(index)}
                    disabled={savingDeliveryId === zone._key}
                  >
                    {savingDeliveryId === zone._key ? 'Guardando…' : 'Guardar zona'}
                  </button>
                  <button type="button" className="admin-delete" onClick={() => removeDelivery(index)}>Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-category-manager">
          <div>
            <span className="admin-section-kicker">Organización de la tienda</span>
            <h2>Categorías</h2>
            <p>Las categorías con productos visibles aparecerán automáticamente en el menú del sitio.</p>
          </div>
          <div className="admin-category-controls">
            <div className="admin-category-chips">
              {categories.map((category) => <span key={category.id}>{category.name}</span>)}
            </div>
            <form className="admin-category-form" onSubmit={addCategory}>
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="Nueva categoría"
              />
              <button type="submit" className="btn-outline-small">Agregar</button>
            </form>
          </div>
        </section>

        <div className="admin-title-row">
          <div>
            <span className="admin-section-kicker">Productos, inventario y ofertas</span>
            <h1>Tu catálogo</h1>
          </div>
          <div className="admin-add-buttons">
            {categories.map((category) => (
              <button key={category.id} className="btn-outline-small" onClick={() => addNew(category.name)}>
                + {category.name}
              </button>
            ))}
          </div>
        </div>

        {loadError && <p className="admin-error">{loadError}</p>}
        {items === null && !loadError && <p className="admin-loading">Cargando tu catálogo…</p>}
        {items && items.length === 0 && <p className="admin-empty">Aún no tienes productos. Agrega uno arriba.</p>}

        <datalist id="cokoa-units">
          <option value="lata 250ml" />
          <option value="lata 300ml" />
          <option value="lata 500ml" />
          <option value="porción" />
          <option value="unidad" />
          <option value="por persona" />
          <option value="caja de regalo" />
        </datalist>

        <div className="admin-grid">
          {items && items.map((item, index) => {
            const soldOut = item.stock !== '' && Number(item.stock) <= 0;
            return (
              <article
                className={`admin-card${item.active === false ? ' admin-card-inactive' : ''}${soldOut ? ' admin-card-soldout' : ''}`}
                key={item.id || `new-${index}`}
              >
                <div className="admin-card-photo">
                  {item.image ? (
                    <img src={normalizeDriveImageUrl(item.image)} alt={item.name} loading="lazy" decoding="async" />
                  ) : (
                    <div className="admin-photo-empty">Sin foto</div>
                  )}
                  <div className="admin-card-statuses">
                    {soldOut && <span className="admin-soldout-badge">Agotado</span>}
                    {hasOffer(item) && <span className="admin-offer-badge">Oferta</span>}
                  </div>
                  {item.uploading && <div className="admin-photo-uploading">Subiendo…</div>}
                  <ImagePicker onPick={(file) => onImagePick(index, file)} />
                </div>
                <div className="admin-card-body">
                  <select value={item.category} onChange={(event) => updateItem(index, { category: event.target.value })}>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                  <input
                    className="admin-input-name"
                    placeholder="Nombre"
                    value={item.name}
                    onChange={(event) => updateItem(index, { name: event.target.value })}
                  />
                  <textarea
                    placeholder="Descripción"
                    rows={2}
                    value={item.desc}
                    onChange={(event) => updateItem(index, { desc: event.target.value })}
                  />
                  <div className="admin-row-2">
                    <div>
                      <label>Precio regular (RD$)</label>
                      <input type="number" min="0" value={item.price} onChange={(event) => updateItem(index, { price: event.target.value })} />
                    </div>
                    <div>
                      <label>Unidad o tamaño</label>
                      <input list="cokoa-units" value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value })} placeholder="Ej. lata 250ml" />
                    </div>
                  </div>
                  <div className="admin-commerce-row">
                    <div className="admin-stock-box">
                      <label>Inventario</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.stock}
                        onChange={(event) => updateItem(index, { stock: event.target.value })}
                        placeholder="Sin límite"
                      />
                      <small>Vacío = sin límite · 0 = agotado</small>
                    </div>
                    <div className={`admin-offer-box${item.offerActive ? ' active' : ''}`}>
                      <label className="admin-offer-toggle">
                        <input
                          type="checkbox"
                          checked={item.offerActive === true}
                          onChange={(event) => updateItem(index, { offerActive: event.target.checked })}
                        />
                        En oferta
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.offerPrice}
                        onChange={(event) => updateItem(index, { offerPrice: event.target.value })}
                        placeholder="Precio oferta"
                        disabled={!item.offerActive}
                      />
                    </div>
                  </div>
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      checked={item.active !== false}
                      onChange={(event) => updateItem(index, { active: event.target.checked })}
                    />
                    Visible en el sitio {item.price ? `· ${hasOffer(item) ? fmt(item.offerPrice) : fmt(item.price)}` : ''}
                  </label>
                  <div className="admin-card-actions">
                    <button className="btn-dark admin-save" onClick={() => save(index)} disabled={savingId === index}>
                      {savingId === index ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button className="admin-delete" onClick={() => remove(index)}>Eliminar</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

function ImagePicker({ onPick, label = 'Cambiar foto', className = 'admin-photo-btn' }) {
  const ref = useRef(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current && ref.current.click()}>
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files && event.target.files[0];
          event.target.value = '';
          onPick(file);
        }}
      />
    </>
  );
}

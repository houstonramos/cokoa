import { useState, useEffect, useRef } from 'react';
import { getSavedPin, savePin, clearPin, login, fetchAdminCatalog, saveItem, deleteItem, uploadImage } from './lib/admin';

const CATEGORIES = ['Postre', 'Caja', 'Experiencia'];
const emptyItem = () => ({ id: '', category: 'Postre', name: '', desc: '', price: '', unit: 'lata 300ml', image: '', rawImage: '', active: true });

function fmt(n) {
  return 'RD$' + Number(n || 0).toLocaleString('es-DO');
}

export default function AdminApp() {
  const [pin, setPin] = useState(getSavedPin());
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [checking, setChecking] = useState(true);

  const [items, setItems] = useState(null); // null = cargando
  const [loadError, setLoadError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState('');

  // Al entrar, si ya había un PIN guardado en esta sesión, intenta usarlo directo.
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
    if (res.ok) setItems(Array.isArray(res.items) ? res.items : []);
    else setLoadError(res.error || 'No se pudo cargar el catálogo.');
  };

  const doLogin = async (e) => {
    e.preventDefault();
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

  const logout = () => { clearPin(); setAuthed(false); setPin(''); setPinInput(''); setItems(null); };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const updateItem = (idx, patch) => setItems((prev) => (prev || []).map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addNew = (category) => setItems((prev) => [{ ...emptyItem(), category }, ...(prev || [])]);

  const remove = async (idx) => {
    const item = items[idx];
    if (!window.confirm(`¿Eliminar "${item.name || 'este producto'}" definitivamente?`)) return;
    if (item.id) await deleteItem(pin, item.id);
    setItems((prev) => prev.filter((_, i) => i !== idx));
    showToast('Producto eliminado.');
  };

  const save = async (idx) => {
    const item = items[idx];
    if (!item.name.trim() || !item.price) {
      showToast('Falta el nombre o el precio.');
      return;
    }
    setSavingId(idx);
    const res = await saveItem(pin, item);
    setSavingId(null);
    if (res.ok) {
      updateItem(idx, { id: res.id });
      showToast('Guardado ✓');
    } else {
      showToast('Error al guardar: ' + (res.error || 'intenta de nuevo'));
    }
  };

  const onImagePick = async (idx, file) => {
    if (!file) return;
    const itemBeforeUpload = items[idx];
    updateItem(idx, { uploading: true });
    try {
      const res = await uploadImage(pin, file);
      if (!res.ok) {
        updateItem(idx, { uploading: false });
        showToast('No se pudo subir la foto: ' + (res.error || 'intenta de nuevo'));
        return;
      }

      const itemWithImage = { ...itemBeforeUpload, image: res.url, rawImage: res.url, uploading: false };
      updateItem(idx, { image: res.url, rawImage: res.url, uploading: false });

      // Persist the photo immediately when the card has enough data to be saved.
      if (itemBeforeUpload.name && itemBeforeUpload.name.trim() && itemBeforeUpload.price) {
        setSavingId(idx);
        const saveRes = await saveItem(pin, itemWithImage);
        setSavingId(null);
        if (saveRes.ok) {
          updateItem(idx, { id: saveRes.id });
          showToast('Foto subida y guardada ✓');
          return;
        }
        showToast('Foto subida, pero no se pudo guardar: ' + (saveRes.error || 'pulsa Guardar'));
        return;
      }

      showToast('Foto subida ✓ — completa nombre y precio, luego pulsa Guardar.');
    } catch (err) {
      updateItem(idx, { uploading: false });
      showToast('No se pudo subir la foto: ' + (err && err.message ? err.message : 'intenta de nuevo'));
    }
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
            onChange={(e) => setPinInput(e.target.value)}
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
        <div className="admin-title-row">
          <h1>Tu catálogo</h1>
          <div className="admin-add-buttons">
            {CATEGORIES.map((c) => (
              <button key={c} className="btn-outline-small" onClick={() => addNew(c)}>+ {c}</button>
            ))}
          </div>
        </div>

        {loadError && <p className="admin-error">{loadError}</p>}
        {items === null && !loadError && <p className="admin-loading">Cargando tu catálogo…</p>}

        {items && items.length === 0 && <p className="admin-empty">Aún no tienes productos. Agrega uno arriba.</p>}

        <div className="admin-grid">
          {items && items.map((item, idx) => (
            <div className={'admin-card' + (item.active === false ? ' admin-card-inactive' : '')} key={idx}>
              <div className="admin-card-photo">
                {item.image ? <img src={item.image} alt={item.name} /> : <div className="admin-photo-empty">Sin foto</div>}
                {item.uploading && <div className="admin-photo-uploading">Subiendo…</div>}
                <ImagePicker onPick={(file) => onImagePick(idx, file)} />
              </div>
              <div className="admin-card-body">
                <select value={item.category} onChange={(e) => updateItem(idx, { category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  className="admin-input-name"
                  placeholder="Nombre"
                  value={item.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                />
                <textarea
                  placeholder="Descripción"
                  rows={2}
                  value={item.desc}
                  onChange={(e) => updateItem(idx, { desc: e.target.value })}
                />
                <div className="admin-row-2">
                  <div>
                    <label>Precio (RD$)</label>
                    <input type="number" value={item.price} onChange={(e) => updateItem(idx, { price: e.target.value })} />
                  </div>
                  <div>
                    <label>Unidad</label>
                    <input value={item.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} />
                  </div>
                </div>
                <label className="admin-toggle">
                  <input type="checkbox" checked={item.active !== false} onChange={(e) => updateItem(idx, { active: e.target.checked })} />
                  Visible en el sitio {item.price ? `· ${fmt(item.price)}` : ''}
                </label>
                <div className="admin-card-actions">
                  <button className="btn-dark admin-save" onClick={() => save(idx)} disabled={savingId === idx}>
                    {savingId === idx ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button className="admin-delete" onClick={() => remove(idx)}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

function ImagePicker({ onPick }) {
  const ref = useRef(null);
  return (
    <>
      <button type="button" className="admin-photo-btn" onClick={() => ref.current && ref.current.click()}>
        📷 Cambiar foto
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files && e.target.files[0];
          e.target.value = '';
          onPick(file);
        }}
      />
    </>
  );
}

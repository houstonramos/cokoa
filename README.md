# Cokoa by Chef Manu Rossi

Sitio web de pedidos: landing + catálogo + carrito + checkout, con backend de pedidos en Google Sheets, correos automáticos y continuación por WhatsApp.

**Stack:** Vite + React (frontend) · Google Apps Script + Google Sheets (backend) · WhatsApp (wa.me) para seguimiento.

---

## Estructura

```
chocolate-world/
├── src/
│   ├── App.jsx                  # Landing completa (nav, hero, postres, cajas, experiencias, footer)
│   ├── components/CartDrawer.jsx # Carrito lateral + checkout + confirmación
│   ├── data/catalog.js          # ← EDITAR AQUÍ productos, precios y contacto
│   ├── lib/order.js             # Envío a Apps Script + enlace WhatsApp
│   └── index.css                # Estilos (paleta crema/chocolate/dorado)
├── apps-script/Code.gs          # Backend: pegar en Google Apps Script
├── public/hero.webp             # Foto del hero
├── .env.example                 # Variables de entorno de ejemplo
└── index.html
```

---

## Paso 1 — Crear la Google Sheet + Apps Script

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva. Nómbrala, p. ej., **"Cokoa — Pedidos"**.
2. En el menú: **Extensiones → Apps Script**.
3. Borra el contenido de `Código.gs` y pega **todo** el contenido de `apps-script/Code.gs` de este proyecto.
4. Edita el bloque `CONFIG` al inicio:
   - `BUSINESS_EMAIL`: el correo donde quieres recibir la alerta de cada pedido.
5. Guarda (💾).

> No necesitas crear la pestaña "Pedidos" ni los encabezados: el script la crea sola con el primer pedido.

### Probar antes de publicar

En el editor de Apps Script, selecciona la función **`testPedido`** en el desplegable y presiona **Ejecutar**. La primera vez pedirá permisos (acepta: son para escribir en tu hoja y enviar correos desde tu cuenta). Verifica que:
- Apareció la pestaña "Pedidos" con una fila `CW-1001`.
- Llegó el correo de alerta a `BUSINESS_EMAIL`.

Borra la fila de prueba cuando quieras.

## Paso 2 — Publicar como Web App

1. En Apps Script: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Configuración:
   - **Ejecutar como:** *Yo* (tu cuenta).
   - **Quién tiene acceso:** *Cualquier persona*. ← imprescindible, si no el sitio no podrá enviar pedidos.
4. **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
5. Verifica: abre esa URL en el navegador — debe responder `{"ok":true,"service":"Cokoa Pedidos","status":"activo"}`.

> ⚠️ Si después modificas el código del script, debes ir a **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva** para que los cambios se publiquen. Editar y guardar no basta.

## Paso 3 — Configurar el frontend

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edita `.env`:
   ```
   VITE_ORDERS_ENDPOINT=https://script.google.com/macros/s/TU_ID/exec
   VITE_WHATSAPP_NUMBER=18091234567
   ```
   - `VITE_WHATSAPP_NUMBER`: formato internacional **sin** `+`, espacios ni guiones.
3. Actualiza el teléfono e Instagram reales en `src/data/catalog.js` (objeto `CONTACT`).

## Paso 4 — Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173, agrega productos, completa el checkout y confirma. Verifica:
- Nueva fila en la Sheet con estado **"Nuevo"**.
- Correo de alerta interna (+ correo al cliente si puso email).
- Se abre WhatsApp con el resumen del pedido pre-armado.

## Paso 5 — Desplegar en Vercel

1. Sube el proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com): **Add New → Project → importa el repo**. Vercel detecta Vite automáticamente.
3. En **Settings → Environment Variables**, agrega:
   - `VITE_ORDERS_ENDPOINT`
   - `VITE_WHATSAPP_NUMBER`
4. **Deploy**. Listo: tu sitio queda en `tu-proyecto.vercel.app` (puedes conectar dominio propio en Settings → Domains).

> Si cambias una variable de entorno en Vercel, haz **Redeploy** para que tome efecto (las variables `VITE_*` se inyectan en build, no en runtime).

---

## Cómo funciona el flujo de un pedido

1. Cliente confirma en el checkout → el frontend hace `POST` (JSON como `text/plain`, lo que evita el bloqueo CORS de Apps Script) al Web App.
2. Apps Script: genera ID secuencial (`CW-1001`, `CW-1002`…), agrega la fila a "Pedidos" con estado **"Nuevo"**, envía alerta interna y confirmación al cliente (si dejó email), y devuelve `{ok, orderId}`.
3. El frontend muestra la confirmación con el ID real y abre WhatsApp (`wa.me`) con el resumen pre-armado para que el negocio continúe la conversación.
4. **Resiliencia:** si el backend falla o no está configurado, el pedido no se pierde — se genera un ID local y el resumen igual sale por WhatsApp.

## Operación diaria (para el negocio)

- La columna **Estado** empieza en "Nuevo". Se recomienda crear una lista desplegable en la Sheet (Datos → Validación de datos) con: `Nuevo → Confirmado → En preparación → Entregado → Cancelado`.
- Los correos salen desde la cuenta de Google dueña del script. Límite de MailApp en cuentas gratuitas: ~100 correos/día (suficiente para ~50 pedidos/día).

## Panel de control de Manu — /admin

El sitio incluye un panel de administración con contraseña en **tudominio.com/admin**,
donde Manu edita productos, precios y fotos con una interfaz normal (formularios,
botones, subida de imagen) — no toca Google Sheets directamente.

**Por debajo, sigue siendo el mismo Apps Script y la misma pestaña "Catálogo"** como
respaldo/base de datos: el panel solo le pone una cara amigable. Si el panel llegara a
fallar por cualquier razón, la hoja de cálculo sigue siendo editable directamente como
alternativa de emergencia (ver "Editar sin el panel" más abajo).

**Configuración antes de entregar:**
1. En `apps-script/Code.gs`, cambia `CONFIG.ADMIN_PIN` (por defecto `'1234'`) por una
   clave real. Vuelve a publicar el script (Implementar → Nueva versión).
2. Comparte con Manu: la URL `tudominio.com/admin` + la clave.

**Qué puede hacer Manu desde el panel:**
- Editar nombre, descripción, precio y unidad de cada producto.
- Subir una foto directamente desde su computadora o celular (se guarda sola en una
  carpeta de Google Drive llamada "Cokoa - Fotos de productos", sin que ella tenga que
  tocar Drive).
- Activar/desactivar un producto sin borrarlo.
- Agregar productos nuevos o eliminar los que ya no vende.
- Todo con botones de Guardar — sin fórmulas, sin código, sin Sheets.

**Seguridad:** la clave del panel es una protección básica (evita que un visitante
cualquiera edite el catálogo), no seguridad de nivel bancario — adecuada para el riesgo
real de un catálogo de postres. No la compartas fuera del equipo del negocio.

### Editar sin el panel (respaldo)

La pestaña "Catálogo" de la Google Sheet sigue funcionando exactamente igual que antes:
editar celdas directamente también actualiza el sitio. Columnas: `ID` (no tocar),
`Categoría`, `Nombre`, `Descripción`, `Precio`, `Unidad`, `Foto (enlace de Drive)`,
`Activo`. Para fotos: subir a Drive → Compartir → "Cualquier persona con el enlace" →
pegar el enlace en la columna.

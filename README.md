# Cokoa by Chef Manu Rossi

Sitio web de pedidos: landing + catálogo + carrito + checkout, con backend de pedidos en Google Sheets, correos automáticos y continuación por WhatsApp.

La tienda pública es bilingüe: español en `/` e inglés en `/en`. El selector `ES | EN`
mantiene separados los enlaces de cada idioma sin añadir una librería de routing.

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

Antes de probar la subida de fotos, ejecuta también la función **`authorizeServices`** desde
el editor y acepta el permiso de Google Drive. La aplicación web debe estar publicada con
**Ejecutar como: Yo** (la cuenta dueña del Sheet); si se publica como "usuario que accede",
un visitante anónimo no tendrá permiso para usar DriveApp.

Borra la fila de prueba cuando quieras.

## Paso 2 — Publicar como Web App

1. En Apps Script: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Configuración:
   - **Ejecutar como:** *Yo* (la cuenta empresarial de Cokoa).
   - **Quién tiene acceso:** *Cualquier persona*. ← imprescindible, si no el sitio no podrá enviar pedidos.
4. **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
5. Verifica: abre esa URL en el navegador — debe responder `{"ok":true,"service":"Cokoa Pedidos","status":"activo"}`.

> ⚠️ Si después modificas el código del script, debes ir a **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva** para que los cambios se publiquen. Editar y guardar no basta.

> La cuenta que crea la implementación es el remitente real de los correos. Compartir o transferir el proyecto no migra una implementación existente: crea una nueva desde la cuenta empresarial y actualiza `VITE_COKOA_ORDERS_ENDPOINT`.

## Paso 3 — Configurar el frontend

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edita `.env`:
   ```
   VITE_COKOA_ORDERS_ENDPOINT=https://script.google.com/macros/s/TU_ID/exec
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

## Paso 5 — Desplegar en Netlify

1. Sube el proyecto a un repositorio de GitHub.
2. En Netlify: **Add new project → Import an existing project**. Netlify detecta Vite automáticamente.
3. En **Settings → Environment Variables**, agrega:
   - `VITE_COKOA_ORDERS_ENDPOINT`
   - `VITE_WHATSAPP_NUMBER`
4. **Deploy**. Listo: tu sitio queda en `tu-proyecto.netlify.app` (puedes conectar dominio propio en Domain management).

> Si cambias una variable de entorno en Netlify, haz **Retry deploy** para que tome efecto (las variables `VITE_*` se inyectan en build, no en runtime).

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
- Editar el nombre, la descripción y la unidad que verá el cliente en inglés.
- Subir una foto directamente desde su computadora o celular (se guarda sola en una
  carpeta de Google Drive llamada "Cokoa - Fotos de productos", sin que ella tenga que
  tocar Drive).
- Activar/desactivar un producto sin borrarlo.
- Agregar productos nuevos o eliminar los que ya no vende.
- Crear, editar, ordenar, activar y eliminar zonas de delivery.
- Editar en inglés las categorías y los textos visibles de cada zona de delivery.
- Definir por zona la tarifa, pedido mínimo, cobertura, tiempo estimado y si el precio se cotiza por WhatsApp.
- Todo con botones de Guardar — sin fórmulas, sin código, sin Sheets.

**Seguridad:** la clave del panel es una protección básica (evita que un visitante
cualquiera edite el catálogo), no seguridad de nivel bancario — adecuada para el riesgo
real de un catálogo de postres. No la compartas fuera del equipo del negocio.

### Editar sin el panel (respaldo)

La pestaña "Catálogo" de la Google Sheet sigue funcionando exactamente igual que antes:
editar celdas directamente también actualiza el sitio. Columnas: `ID` (no tocar),
`Categoría`, `Nombre`, `Descripción`, `Precio`, `Unidad`, `Foto (enlace de Drive)`,
`Activo`, `Nombre (EN)`, `Descripción (EN)` y `Unidad (EN)`. Para fotos: subir a Drive → Compartir → "Cualquier persona con el enlace" →
pegar el enlace en la columna.

### Idioma inglés

- `/` permanece como la versión oficial en español.
- `/en` muestra navegación, catálogo, carrito, checkout, delivery y confirmación en inglés.
- Los productos publicados al crear esta función tienen una traducción inglesa inicial.
- Para productos futuros, el panel ofrece campos ingleses. Si se dejan vacíos, el sitio
  usa el texto español como respaldo para que el producto nunca desaparezca.
- El correo de confirmación al comprador se envía en el idioma con el que realizó el pedido.
- La alerta interna que recibe Cokoa permanece en español.
- Después de cambiar `apps-script/Code.gs`, se debe publicar una nueva versión del Web App.

### Configurar el delivery

La sección **Zonas de delivery** de `/admin` permite que Cokoa gestione sus propias
zonas sin modificar el sitio ni el Apps Script. La primera vez, el backend crea la
pestaña `Delivery` con la configuración actual como punto de partida.

Cada zona admite:
- Nombre y descripción de sectores o cobertura.
- Tarifa fija y pedido mínimo opcional.
- Tiempo estimado.
- Opción **Precio por cotizar** para coordinar el importe por WhatsApp.
- Opción **Solicitar fecha** para entregas por agenda.
- Orden y visibilidad en la tienda.

El checkout usa solo las zonas activas. Antes de registrar el pedido, Apps Script vuelve
a consultar la pestaña `Delivery`, aplica la tarifa vigente y valida el pedido mínimo;
por tanto, el importe no depende únicamente de lo que envíe el navegador.

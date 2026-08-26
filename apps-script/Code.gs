/**
 * Cokoa — Backend de pedidos (Google Apps Script)
 *
 * Recibe pedidos vía doPost, registra en la hoja "Pedidos",
 * genera un ID de pedido secuencial y envía correos de confirmación.
 *
 * INSTRUCCIONES DE CONFIGURACIÓN: ver README.md del proyecto.
 */

// ====== CONFIGURACIÓN — edita estos valores ======
const CONFIG = {
  SHEET_NAME: 'Pedidos',
  BUSINESS_EMAIL: 'pedidos@tunegocio.com', // correo donde llegan las alertas internas
  BUSINESS_NAME: 'Cokoa by Chef Manu Rossi',
  ORDER_PREFIX: 'CK-',
  ADMIN_PIN: '1234', // ← CAMBIA ESTE PIN antes de entregar. Es la clave del panel de administración.
  DRIVE_FOLDER_NAME: 'Cokoa - Fotos de productos',
};
// =================================================

const HEADERS = [
  'ID Pedido', 'Fecha/Hora', 'Estado', 'Nombre', 'Teléfono', 'Email',
  'Items', 'Subtotal', 'Delivery', 'Total', 'Método de entrega', 'Zona',
  'Dirección', 'Fecha entrega', 'Forma de pago', 'Notas',
];

function doPost(e) {
  const body = JSON.parse(e.postData.contents);

  // Acciones del panel de administración (requieren PIN correcto).
  if (body.action === 'login') return handleLogin_(body);
  if (body.action === 'guardar_item') return handleGuardarItem_(body);
  if (body.action === 'eliminar_item') return handleEliminarItem_(body);
  if (body.action === 'subir_imagen') return handleSubirImagen_(body);

  // Sin "action": es un pedido normal del checkout (compatibilidad con el sitio actual).
  return handlePedido_(body);
}

function handlePedido_(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000); // evita IDs duplicados si llegan 2 pedidos a la vez
  try {
    const sheet = getOrCreateSheet_();
    const orderId = nextOrderId_(sheet);
    const now = new Date();

    const itemsText = (data.items || [])
      .map(function (i) { return i.qty + 'x ' + i.name + ' (RD$' + i.price + ')'; })
      .join(' | ');

    sheet.appendRow([
      orderId,
      Utilities.formatDate(now, 'America/Santo_Domingo', 'yyyy-MM-dd HH:mm:ss'),
      'Nuevo',
      data.name || '',
      "'" + (data.phone || ''), // apóstrofe fuerza texto: conserva el "+" del número
      data.email || '',
      itemsText,
      data.subtotal || 0,
      data.deliveryFee || 0,
      data.total || 0,
      data.methodLabel || data.method || '',
      data.zone || '',
      data.address || '',
      data.date || '',
      data.payment || '',
      data.notes || '',
    ]);

    sendBusinessAlert_(orderId, data, itemsText);
    if (data.email) sendCustomerConfirmation_(orderId, data);

    return jsonResponse_({ ok: true, orderId: orderId });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Todas las acciones de administración pasan por aquí primero. */
function checkPin_(body) {
  return body && body.pin === CONFIG.ADMIN_PIN;
}

function handleLogin_(body) {
  return jsonResponse_({ ok: checkPin_(body) });
}

function handleGuardarItem_(body) {
  if (!checkPin_(body)) return jsonResponse_({ ok: false, error: 'PIN incorrecto' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getOrCreateCatalogSheet_();
    const item = body.item || {};
    let id = String(item.id || '').trim();
    if (!id) id = slugify_(item.name) + '-' + Math.floor(Math.random() * 900 + 100);

    const row = [
      id,
      item.category || 'Postre',
      item.name || '',
      item.desc || '',
      Number(item.price) || 0,
      item.unit || '',
      item.image || '',
      item.active === false ? 'No' : 'Sí',
    ];

    const lastRow = sheet.getLastRow();
    let targetRow = -1;
    if (lastRow >= 2) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === id) { targetRow = i + 2; break; }
      }
    }
    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, CATALOG_HEADERS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    return jsonResponse_({ ok: true, id: id });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function handleEliminarItem_(body) {
  if (!checkPin_(body)) return jsonResponse_({ ok: false, error: 'PIN incorrecto' });
  try {
    const sheet = getOrCreateCatalogSheet_();
    const id = String(body.id || '').trim();
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === id) { sheet.deleteRow(i + 2); break; }
      }
    }
    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

/** Recibe una foto en base64 desde el panel, la guarda en Drive y devuelve la URL pública. */
function handleSubirImagen_(body) {
  if (!checkPin_(body)) return jsonResponse_({ ok: false, error: 'PIN incorrecto' });
  try {
    const folder = getOrCreatePhotosFolder_();
    const bytes = Utilities.base64Decode(body.base64);
    const blob = Utilities.newBlob(bytes, body.mimeType || 'image/jpeg', body.filename || 'foto.jpg');
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const url = 'https://drive.google.com/uc?export=view&id=' + file.getId();
    return jsonResponse_({ ok: true, url: url });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function getOrCreatePhotosFolder_() {
  const it = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
}

function slugify_(text) {
  return String(text || 'item')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

/**
 * GET — tres usos:
 *  1) /exec                          → ping de salud.
 *  2) /exec?action=catalogo          → catálogo público (solo productos activos) para el sitio.
 *  3) /exec?action=catalogo_admin&pin=... → catálogo completo (incluye inactivos) para el panel.
 */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'catalogo') {
    return jsonResponse_({ ok: true, items: readCatalog_(false) });
  }
  if (p.action === 'catalogo_admin') {
    if (p.pin !== CONFIG.ADMIN_PIN) return jsonResponse_({ ok: false, error: 'PIN incorrecto' });
    return jsonResponse_({ ok: true, items: readCatalog_(true) });
  }
  return jsonResponse_({ ok: true, service: 'Cokoa Pedidos', status: 'activo' });
}

// ---------- Catálogo (panel de Manu) ----------

const CATALOG_SHEET_NAME = 'Catálogo';
const CATALOG_HEADERS = [
  'ID', 'Categoría', 'Nombre', 'Descripción', 'Precio', 'Unidad', 'Foto (enlace de Drive)', 'Activo',
];

/** Semilla inicial: el catálogo actual del sitio, para que Manu lo encuentre ya cargado. */
const CATALOG_SEED = [
  ['baileys', 'Postre', 'Baileys', 'Crema de Baileys, chocolate y bizcocho de cacao.', 450, 'lata 300ml', '', 'Sí'],
  ['chinola', 'Postre', 'Chinola', 'Crema de chinola con crocante de chocolate.', 450, 'lata 300ml', '', 'Sí'],
  ['pistacho', 'Postre', 'Pistacho y Frambuesa', 'Crema de pistacho con frambuesa y crocante de chocolate.', 450, 'lata 300ml', '', 'Sí'],
  ['pannacotta', 'Postre', 'Panna Cotta', 'Panna cotta cremosa con coulis de frutos rojos y galleta de vainilla.', 450, 'lata 300ml', '', 'Sí'],
  ['dulceleche', 'Postre', 'Dulce de Leche y Café', 'Dulce de leche, crema de café y bizcocho de chocolate.', 450, 'lata 300ml', '', 'Sí'],
  ['carrot', 'Postre', 'Carrot Cake', 'Bizcocho de zanahoria gluten free con crema de queso.', 450, 'lata 300ml', '', 'Sí'],
  ['tresleches', 'Postre', 'Tres Leches', 'Bizcocho tres leches con crema suave.', 450, 'lata 300ml', '', 'Sí'],
  ['avellanas', 'Postre', 'Chocolate y Avellanas', 'Mousse de chocolate y crema de avellanas.', 450, 'lata 300ml', '', 'Sí'],
  ['oreo', 'Postre', 'Oreo', 'Crema de vainilla con galleta Oreo y trozos crujientes.', 450, 'lata 300ml', '', 'Sí'],
  ['chocolate', 'Postre', 'Chocolate', 'Mousse de chocolate y bizcocho de cacao húmedo.', 450, 'lata 300ml', '', 'Sí'],
  ['box4', 'Caja', 'Caja Descubre', '4 postres en lata a elección del chef.', 1700, 'caja de regalo', '', 'Sí'],
  ['box6', 'Caja', 'Caja Comparte', '6 postres en lata surtidos, ideal para regalar.', 2450, 'caja de regalo', '', 'Sí'],
  ['box9', 'Caja', 'Caja Celebra', '9 postres en lata + tarjeta personalizada.', 3500, 'caja de regalo', '', 'Sí'],
  ['dominicana', 'Experiencia', 'Experiencia Dominicana', 'Café premium dominicano, dulces típicos y prepara tu propio chocolate caliente.', 1800, 'por persona', '', 'Sí'],
  ['immersive', 'Experiencia', 'Cokoa Immersive Experience', 'Una propuesta inmersiva donde la gastronomía, la creatividad y los sabores te llevan a un viaje único.', 2500, 'por persona', '', 'Sí'],
];

function getOrCreateCatalogSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CATALOG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CATALOG_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CATALOG_HEADERS);
    sheet.getRange(1, 1, 1, CATALOG_HEADERS.length)
      .setFontWeight('bold').setBackground('#3A2718').setFontColor('#EFE3CC');
    sheet.setFrozenRows(1);
    sheet.getRange(2, 1, CATALOG_SEED.length, CATALOG_HEADERS.length).setValues(CATALOG_SEED);
    sheet.autoResizeColumns(1, CATALOG_HEADERS.length);
  }
  return sheet;
}

/** Convierte un enlace para compartir de Google Drive en una URL de imagen directa. */
function driveLinkToImageUrl_(link) {
  if (!link) return '';
  const trimmed = String(link).trim();
  if (!trimmed) return '';
  const m = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m) return 'https://drive.google.com/uc?export=view&id=' + m[1];
  return trimmed; // ya es una URL de imagen directa (ej. subida a otro sitio)
}

function readCatalog_(includeInactive) {
  const sheet = getOrCreateCatalogSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, CATALOG_HEADERS.length).getValues();
  return rows
    .filter(function (r) {
      if (!r[0]) return false;
      if (includeInactive) return true;
      return String(r[7]).trim().toLowerCase() !== 'no';
    })
    .map(function (r) {
      return {
        id: String(r[0]).trim(),
        category: String(r[1]).trim(), // Postre | Caja | Experiencia
        name: String(r[2]).trim(),
        desc: String(r[3]).trim(),
        price: Number(r[4]) || 0,
        unit: String(r[5]).trim(),
        image: driveLinkToImageUrl_(r[6]),
        rawImage: String(r[6] || ''),
        active: String(r[7]).trim().toLowerCase() !== 'no',
      };
    });
}

// ---------- helpers ----------

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#3A2718').setFontColor('#EFE3CC');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** ID secuencial: CW-1001, CW-1002... basado en el último ID registrado. */
function nextOrderId_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return CONFIG.ORDER_PREFIX + '1001';
  const lastId = String(sheet.getRange(lastRow, 1).getValue());
  const num = parseInt(lastId.replace(CONFIG.ORDER_PREFIX, ''), 10);
  return CONFIG.ORDER_PREFIX + (isNaN(num) ? '1001' : num + 1);
}

function fmtRD_(n) {
  return 'RD$' + Number(n || 0).toLocaleString('es-DO');
}

function orderSummaryHtml_(orderId, data) {
  const rows = (data.items || [])
    .map(function (i) {
      return '<tr><td style="padding:6px 12px;">' + i.qty + '× ' + i.name +
        '</td><td style="padding:6px 12px; text-align:right;">' + fmtRD_(i.price * i.qty) + '</td></tr>';
    })
    .join('');

  return (
    '<div style="font-family:sans-serif; max-width:520px; margin:auto; border:1px solid #E7D8BB; border-radius:12px; overflow:hidden;">' +
    '<div style="background:#3A2718; color:#EFE3CC; padding:18px 24px;">' +
    '<div style="font-size:20px; letter-spacing:3px;">COKOA</div>' +
    '<div style="font-size:11px; letter-spacing:2px; color:#A9823C;">BY CHEF MANU ROSSI</div>' +
    '</div>' +
    '<div style="padding:24px; color:#3A2718;">' +
    '<p style="margin:0 0 6px;">Pedido <strong>' + orderId + '</strong></p>' +
    '<table style="width:100%; border-collapse:collapse; margin:12px 0; background:#FBF5E8; border-radius:8px;">' + rows + '</table>' +
    '<p style="margin:4px 0;">Subtotal: <strong>' + fmtRD_(data.subtotal) + '</strong></p>' +
    '<p style="margin:4px 0;">Entrega: ' + (data.methodLabel || '') + ' — ' + (data.deliveryFeeLabel || fmtRD_(data.deliveryFee)) + '</p>' +
    '<p style="margin:4px 0; font-size:18px;">Total: <strong>' + fmtRD_(data.total) + '</strong></p>' +
    (data.address ? '<p style="margin:4px 0;">Dirección: ' + data.address + '</p>' : '') +
    (data.date ? '<p style="margin:4px 0;">Fecha: ' + data.date + '</p>' : '') +
    '<p style="margin:4px 0;">Pago: ' + (data.payment || '') + '</p>' +
    (data.notes ? '<p style="margin:4px 0;">Notas: ' + data.notes + '</p>' : '') +
    '</div></div>'
  );
}

function sendCustomerConfirmation_(orderId, data) {
  try {
    MailApp.sendEmail({
      to: data.email,
      subject: '¡Pedido recibido! ' + orderId + ' — ' + CONFIG.BUSINESS_NAME,
      htmlBody:
        '<p style="font-family:sans-serif;">Hola ' + (data.name || '') + ', ¡gracias por tu pedido! 🍮</p>' +
        orderSummaryHtml_(orderId, data) +
        '<p style="font-family:sans-serif; color:#8A7458; font-size:13px;">Te contactaremos por WhatsApp para coordinar la entrega. Gracias por apoyar lo artesanal ♥</p>',
    });
  } catch (err) {
    console.error('Error enviando correo al cliente: ' + err);
  }
}

function sendBusinessAlert_(orderId, data, itemsText) {
  try {
    MailApp.sendEmail({
      to: CONFIG.BUSINESS_EMAIL,
      subject: '🔔 Nuevo pedido ' + orderId + ' — ' + fmtRD_(data.total) + ' — ' + (data.name || ''),
      htmlBody:
        '<p style="font-family:sans-serif;"><strong>Nuevo pedido recibido.</strong></p>' +
        '<p style="font-family:sans-serif;">Cliente: <strong>' + (data.name || '') + '</strong><br>' +
        'Teléfono: <strong>' + (data.phone || '') + '</strong><br>' +
        (data.email ? 'Email: ' + data.email + '<br>' : '') + '</p>' +
        orderSummaryHtml_(orderId, data) +
        '<p style="font-family:sans-serif; font-size:13px; color:#8A7458;">El pedido quedó registrado en la hoja "' + CONFIG.SHEET_NAME + '" con estado <strong>Nuevo</strong>.</p>',
    });
  } catch (err) {
    console.error('Error enviando alerta interna: ' + err);
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Prueba manual: ejecuta esta función desde el editor para simular un pedido. */
function testPedido() {
  const fake = {
    postData: {
      contents: JSON.stringify({
        name: 'Cliente de Prueba',
        phone: '+1 809 555 0000',
        email: '', // pon tu correo aquí para probar el email al cliente
        items: [
          { id: 'baileys', name: 'Baileys', qty: 2, price: 450, unit: 'lata 300ml' },
          { id: 'box4', name: 'Caja Descubre', qty: 1, price: 1700, unit: 'caja de regalo' },
        ],
        subtotal: 2600,
        deliveryFee: 150,
        total: 2750,
        method: 'delivery',
        zone: 'ciudad',
        methodLabel: 'Delivery (Bávaro · Punta Cana)',
        deliveryFeeLabel: 'RD$150',
        address: 'Calle de Prueba #1, Bávaro',
        date: '2026-08-05',
        payment: 'transferencia',
        notes: 'Pedido de prueba — ignorar',
      }),
    },
  };
  const result = doPost(fake);
  Logger.log(result.getContent());
}

/**
 * Autorizacion inicial: ejecuta esta funcion una vez desde el editor de Apps
 * Script y acepta los permisos de Sheets, Drive y correo antes de publicar.
 */
function authorizeServices() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  getOrCreatePhotosFolder_().getName();
  MailApp.getRemainingDailyQuota();
  Logger.log('Servicios autorizados correctamente.');
}

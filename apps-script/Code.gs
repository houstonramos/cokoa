/**
 * Cokoa - backend de pedidos y panel de administracion.
 *
 * Recibe pedidos, controla inventario, administra catalogo/categorias/portada,
 * guarda fotos en Drive y envia confirmaciones por correo.
 */

// ====== CONFIGURACION - edita estos valores en Google Apps Script ======
const CONFIG = {
  SHEET_NAME: 'Pedidos',
  BUSINESS_EMAIL: 'cokoabychefmanurossi@gmail.com',
  BUSINESS_NAME: 'Cokoa by Chef Manu Rossi',
  ORDER_PREFIX: 'CK-',
  ADMIN_PIN: '1234',
  DRIVE_FOLDER_NAME: 'Cokoa - Fotos de productos',
};
// ======================================================================

const HEADERS = [
  'ID Pedido', 'Fecha/Hora', 'Estado', 'Nombre', 'Teléfono', 'Email',
  'Items', 'Subtotal', 'Delivery', 'Total', 'Método de entrega', 'Zona',
  'Dirección', 'Fecha entrega', 'Forma de pago', 'Notas',
];

const CATALOG_SHEET_NAME = 'Catálogo';
const CATALOG_HEADERS = [
  'ID', 'Categoría', 'Nombre', 'Descripción', 'Precio', 'Unidad',
  'Foto (enlace de Drive)', 'Activo', 'Inventario', 'En oferta', 'Precio oferta',
];

const CATALOG_SEED = [
  ['baileys', 'Latas', 'Baileys', 'Crema de Baileys, chocolate y bizcocho de cacao.', 450, 'lata 300ml', '', 'Sí', '', 'No', ''],
  ['chinola', 'Latas', 'Chinola', 'Crema de chinola con crocante de chocolate.', 450, 'lata 300ml', '', 'Sí', '', 'No', ''],
  ['pistacho', 'Latas', 'Pistacho y Frambuesa', 'Crema de pistacho con frambuesa y crocante de chocolate.', 450, 'lata 300ml', '', 'Sí', '', 'No', ''],
  ['pannacotta', 'Latas', 'Panna Cotta', 'Panna cotta cremosa con coulis de frutos rojos y galleta de vainilla.', 450, 'lata 300ml', '', 'Sí', '', 'No', ''],
  ['dulceleche', 'Latas', 'Dulce de Leche y Café', 'Dulce de leche, crema de café y bizcocho de chocolate.', 450, 'lata 300ml', '', 'Sí', '', 'No', ''],
  ['carrot', 'Latas', 'Carrot Cake', 'Bizcocho de zanahoria gluten free con crema de queso.', 450, 'lata 300ml', '', 'Sí', '', 'No', ''],
  ['tresleches', 'Latas', 'Tres Leches', 'Bizcocho tres leches con crema suave.', 450, 'lata 300ml', '', 'Sí', '', 'No', ''],
  ['avellanas', 'Latas', 'Chocolate y Avellanas', 'Mousse de chocolate y crema de avellanas.', 450, 'lata 300ml', '', 'Sí', '', 'No', ''],
  ['oreo', 'Latas', 'Oreo', 'Crema de vainilla con galleta Oreo y trozos crujientes.', 450, 'lata 300ml', '', 'Sí', '', 'No', ''],
  ['chocolate', 'Latas', 'Chocolate', 'Mousse de chocolate y bizcocho de cacao húmedo.', 450, 'lata 300ml', '', 'Sí', '', 'No', ''],
  ['box4', 'Cajas', 'Caja Descubre', '4 postres en lata a elección del chef.', 1700, 'caja de regalo', '', 'Sí', '', 'No', ''],
  ['box6', 'Cajas', 'Caja Comparte', '6 postres en lata surtidos, ideal para regalar.', 2450, 'caja de regalo', '', 'Sí', '', 'No', ''],
  ['box9', 'Cajas', 'Caja Celebra', '9 postres en lata + tarjeta personalizada.', 3500, 'caja de regalo', '', 'Sí', '', 'No', ''],
  ['dominicana', 'Experiencias', 'Experiencia Dominicana', 'Café premium dominicano, dulces típicos y prepara tu propio chocolate caliente.', 1800, 'por persona', '', 'Sí', '', 'No', ''],
  ['immersive', 'Experiencias', 'Cokoa Immersive Experience', 'Una propuesta inmersiva donde la gastronomía, la creatividad y los sabores te llevan a un viaje único.', 2500, 'por persona', '', 'Sí', '', 'No', ''],
];

const CATEGORY_SHEET_NAME = 'Categorías';
const CATEGORY_HEADERS = ['ID', 'Nombre', 'Orden', 'Activo'];
const CATEGORY_SEED = [
  ['latas', 'Latas', 1, 'Sí'],
  ['postres', 'Postres', 2, 'Sí'],
  ['bebidas', 'Bebidas', 3, 'Sí'],
  ['chocolates', 'Chocolates', 4, 'Sí'],
  ['cosmeticos', 'Cosméticos', 5, 'Sí'],
  ['cajas', 'Cajas', 6, 'Sí'],
  ['experiencias', 'Experiencias', 7, 'Sí'],
];

const SETTINGS_SHEET_NAME = 'Configuración';
const SETTINGS_HEADERS = ['Clave', 'Valor'];
const SETTINGS_SEED = [
  ['hero_image', '/hero.webp'],
  ['hero_position_x', 50],
  ['hero_position_y', 50],
  ['hero_zoom', 1],
];

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'login') return handleLogin_(body);
    if (body.action === 'guardar_item') return handleGuardarItem_(body);
    if (body.action === 'eliminar_item') return handleEliminarItem_(body);
    if (body.action === 'subir_imagen') return handleSubirImagen_(body);
    if (body.action === 'guardar_categoria') return handleGuardarCategoria_(body);
    if (body.action === 'guardar_configuracion') return handleGuardarConfiguracion_(body);
    return handlePedido_(body);
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'catalogo') {
    return jsonResponse_({
      ok: true,
      items: readCatalog_(false),
      categories: readCategories_(false),
      settings: readSettings_(),
    });
  }
  if (p.action === 'catalogo_admin') {
    if (p.pin !== CONFIG.ADMIN_PIN) return jsonResponse_({ ok: false, error: 'PIN incorrecto' });
    return jsonResponse_({
      ok: true,
      items: readCatalog_(true),
      categories: readCategories_(true),
      settings: readSettings_(),
    });
  }
  return jsonResponse_({ ok: true, service: 'Cokoa Pedidos', status: 'activo' });
}

function handlePedido_(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const reservation = prepareStockReservation_(data.items || []);
    if (!reservation.ok) return jsonResponse_({ ok: false, error: reservation.error });

    const sheet = getOrCreateSheet_();
    const orderId = nextOrderId_(sheet);
    const now = new Date();
    const itemsText = (data.items || [])
      .map(function (item) { return item.qty + 'x ' + item.name + ' (RD$' + item.price + ')'; })
      .join(' | ');

    sheet.appendRow([
      orderId,
      Utilities.formatDate(now, 'America/Santo_Domingo', 'yyyy-MM-dd HH:mm:ss'),
      'Nuevo',
      data.name || '',
      "'" + (data.phone || ''),
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

    applyStockReservation_(reservation);
    sendBusinessAlert_(orderId, data, itemsText);
    if (data.email) sendCustomerConfirmation_(orderId, data);
    return jsonResponse_({ ok: true, orderId: orderId });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Blank inventory is unlimited; a numeric value is controlled stock. */
function prepareStockReservation_(items) {
  const requested = {};
  (items || []).forEach(function (item) {
    const id = String(item.id || '').trim();
    const qty = Math.max(0, Math.floor(Number(item.qty) || 0));
    if (id && qty) requested[id] = (requested[id] || 0) + qty;
  });

  const ids = Object.keys(requested);
  if (!ids.length) return { ok: false, error: 'El carrito está vacío.' };

  const sheet = getOrCreateCatalogSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, sheet: sheet, updates: [] };
  const rows = sheet.getRange(2, 1, lastRow - 1, CATALOG_HEADERS.length).getValues();
  const updates = [];

  rows.forEach(function (row, index) {
    const id = String(row[0] || '').trim();
    if (!requested[id]) return;
    const rawStock = row[8];
    if (rawStock === '' || rawStock === null) return;
    const stock = Math.max(0, Math.floor(Number(rawStock) || 0));
    if (requested[id] > stock) {
      updates.push({
        error: stock === 0
          ? String(row[2] || 'Un producto') + ' está agotado. Retíralo del carrito para continuar.'
          : 'Solo quedan ' + stock + ' unidades de ' + String(row[2] || 'este producto') + '.',
      });
      return;
    }
    updates.push({ row: index + 2, stock: stock - requested[id] });
  });

  const failed = updates.find(function (update) { return update.error; });
  if (failed) return { ok: false, error: failed.error };
  return { ok: true, sheet: sheet, updates: updates };
}

function applyStockReservation_(reservation) {
  (reservation.updates || []).forEach(function (update) {
    reservation.sheet.getRange(update.row, 9).setValue(update.stock);
  });
}

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

    let stock = '';
    if (item.stock !== '' && item.stock !== null && typeof item.stock !== 'undefined') {
      stock = Math.max(0, Math.floor(Number(item.stock) || 0));
    }
    const offerActive = item.offerActive === true;
    const offerPrice = offerActive ? Math.max(0, Number(item.offerPrice) || 0) : '';
    const row = [
      id,
      item.category || 'Postres',
      item.name || '',
      item.desc || '',
      Number(item.price) || 0,
      item.unit || '',
      item.rawImage || item.image || '',
      item.active === false ? 'No' : 'Sí',
      stock,
      offerActive ? 'Sí' : 'No',
      offerPrice,
    ];

    const lastRow = sheet.getLastRow();
    let targetRow = -1;
    if (lastRow >= 2) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === id) { targetRow = i + 2; break; }
      }
    }
    if (targetRow > 0) sheet.getRange(targetRow, 1, 1, CATALOG_HEADERS.length).setValues([row]);
    else sheet.appendRow(row);
    return jsonResponse_({ ok: true, id: id });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function handleEliminarItem_(body) {
  if (!checkPin_(body)) return jsonResponse_({ ok: false, error: 'PIN incorrecto' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
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
  } finally {
    lock.releaseLock();
  }
}

function handleGuardarCategoria_(body) {
  if (!checkPin_(body)) return jsonResponse_({ ok: false, error: 'PIN incorrecto' });
  const category = body.category || {};
  const name = String(category.name || '').trim();
  if (!name) return jsonResponse_({ ok: false, error: 'La categoría necesita un nombre.' });
  const id = String(category.id || slugify_(name)).trim();
  const sheet = getOrCreateCategorySheet_();
  const lastRow = sheet.getLastRow();
  let targetRow = -1;
  if (lastRow >= 2) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === id) { targetRow = i + 2; break; }
    }
  }
  const row = [id, name, Number(category.order) || lastRow, category.active === false ? 'No' : 'Sí'];
  if (targetRow > 0) sheet.getRange(targetRow, 1, 1, CATEGORY_HEADERS.length).setValues([row]);
  else sheet.appendRow(row);
  return jsonResponse_({ ok: true, category: { id: id, name: name } });
}

function handleGuardarConfiguracion_(body) {
  if (!checkPin_(body)) return jsonResponse_({ ok: false, error: 'PIN incorrecto' });
  const settings = body.settings || {};
  if (settings.heroImage) upsertSetting_('hero_image', settings.heroImage);
  if (Object.prototype.hasOwnProperty.call(settings, 'heroPositionX')) {
    upsertSetting_('hero_position_x', clampNumber_(settings.heroPositionX, 0, 100, 50));
  }
  if (Object.prototype.hasOwnProperty.call(settings, 'heroPositionY')) {
    upsertSetting_('hero_position_y', clampNumber_(settings.heroPositionY, 0, 100, 50));
  }
  if (Object.prototype.hasOwnProperty.call(settings, 'heroZoom')) {
    upsertSetting_('hero_zoom', clampNumber_(settings.heroZoom, 1, 1.8, 1));
  }
  return jsonResponse_({ ok: true, settings: readSettings_() });
}

/** Recibe una foto en base64, la guarda en Drive y devuelve la URL pública. */
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
  const iterator = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  if (iterator.hasNext()) return iterator.next();
  return DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
}

function slugify_(text) {
  return String(text || 'item')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

function prepareDataSheet_(name, headers, seed) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (seed && seed.length) sheet.getRange(2, 1, seed.length, headers.length).setValues(seed);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold').setBackground('#3A2718').setFontColor('#EFE3CC');
  return sheet;
}

function getOrCreateCatalogSheet_() {
  return prepareDataSheet_(CATALOG_SHEET_NAME, CATALOG_HEADERS, CATALOG_SEED);
}

function getOrCreateCategorySheet_() {
  return prepareDataSheet_(CATEGORY_SHEET_NAME, CATEGORY_HEADERS, CATEGORY_SEED);
}

function getOrCreateSettingsSheet_() {
  return prepareDataSheet_(SETTINGS_SHEET_NAME, SETTINGS_HEADERS, SETTINGS_SEED);
}

function driveLinkToImageUrl_(link) {
  if (!link) return '';
  const trimmed = String(link).trim();
  if (!trimmed) return '';
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (match) return 'https://drive.google.com/uc?export=view&id=' + match[1];
  return trimmed;
}

function readCatalog_(includeInactive) {
  const sheet = getOrCreateCatalogSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, CATALOG_HEADERS.length).getValues();
  return rows
    .filter(function (row) {
      if (!row[0]) return false;
      return includeInactive || String(row[7]).trim().toLowerCase() !== 'no';
    })
    .map(function (row) {
      const stock = row[8] === '' || row[8] === null ? null : Math.max(0, Math.floor(Number(row[8]) || 0));
      return {
        id: String(row[0]).trim(),
        category: String(row[1]).trim(),
        name: String(row[2]).trim(),
        desc: String(row[3]).trim(),
        price: Number(row[4]) || 0,
        unit: String(row[5]).trim(),
        image: driveLinkToImageUrl_(row[6]),
        rawImage: String(row[6] || ''),
        active: String(row[7]).trim().toLowerCase() !== 'no',
        stock: stock,
        offerActive: String(row[9]).trim().toLowerCase() === 'sí' || String(row[9]).trim().toLowerCase() === 'si',
        offerPrice: Number(row[10]) || 0,
      };
    });
}

function readCategories_(includeInactive) {
  const sheet = getOrCreateCategorySheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, CATEGORY_HEADERS.length).getValues()
    .filter(function (row) {
      if (!row[0] || !row[1]) return false;
      return includeInactive || String(row[3]).trim().toLowerCase() !== 'no';
    })
    .map(function (row) {
      return {
        id: String(row[0]).trim(),
        name: String(row[1]).trim(),
        order: Number(row[2]) || 999,
        active: String(row[3]).trim().toLowerCase() !== 'no',
      };
    })
    .sort(function (a, b) { return a.order - b.order; });
}

function readSettings_() {
  const sheet = getOrCreateSettingsSheet_();
  const lastRow = sheet.getLastRow();
  const settings = { heroImage: '/hero.webp', heroPositionX: 50, heroPositionY: 50, heroZoom: 1 };
  if (lastRow < 2) return settings;
  const rows = sheet.getRange(2, 1, lastRow - 1, SETTINGS_HEADERS.length).getValues();
  rows.forEach(function (row) {
    const key = String(row[0]).trim();
    if (key === 'hero_image' && row[1]) settings.heroImage = driveLinkToImageUrl_(row[1]);
    if (key === 'hero_position_x') settings.heroPositionX = clampNumber_(row[1], 0, 100, 50);
    if (key === 'hero_position_y') settings.heroPositionY = clampNumber_(row[1], 0, 100, 50);
    if (key === 'hero_zoom') settings.heroZoom = clampNumber_(row[1], 1, 1.8, 1);
  });
  return settings;
}

function clampNumber_(value, min, max, fallback) {
  const number = Number(value);
  return isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function upsertSetting_(key, value) {
  const sheet = getOrCreateSettingsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]).trim() === key) {
        sheet.getRange(i + 2, 2).setValue(value);
        return;
      }
    }
  }
  sheet.appendRow([key, value]);
}

function getOrCreateSheet_() {
  return prepareDataSheet_(CONFIG.SHEET_NAME, HEADERS, []);
}

function nextOrderId_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return CONFIG.ORDER_PREFIX + '1001';
  const lastId = String(sheet.getRange(lastRow, 1).getValue());
  const number = parseInt(lastId.replace(CONFIG.ORDER_PREFIX, ''), 10);
  return CONFIG.ORDER_PREFIX + (isNaN(number) ? '1001' : number + 1);
}

function fmtRD_(number) {
  return 'RD$' + Number(number || 0).toLocaleString('es-DO');
}

function orderSummaryHtml_(orderId, data) {
  const rows = (data.items || [])
    .map(function (item) {
      return '<tr><td style="padding:6px 12px;">' + item.qty + '× ' + item.name +
        '</td><td style="padding:6px 12px; text-align:right;">' + fmtRD_(item.price * item.qty) + '</td></tr>';
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

function jsonResponse_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}

function testPedido() {
  const fake = {
    postData: {
      contents: JSON.stringify({
        name: 'Cliente de Prueba',
        phone: '+1 809 555 0000',
        email: '',
        items: [{ id: 'baileys', name: 'Baileys', qty: 1, price: 450, unit: 'lata 300ml' }],
        subtotal: 450,
        deliveryFee: 150,
        total: 600,
        method: 'delivery',
        zone: 'ciudad',
        methodLabel: 'Delivery (Bávaro · Punta Cana)',
        deliveryFeeLabel: 'RD$150',
        address: 'Calle de Prueba #1, Bávaro',
        date: '2026-08-27',
        payment: 'transferencia',
        notes: 'Pedido de prueba - ignorar',
      }),
    },
  };
  Logger.log(doPost(fake).getContent());
}

function authorizeServices() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  getOrCreatePhotosFolder_().getName();
  MailApp.getRemainingDailyQuota();
  Logger.log('Servicios autorizados correctamente.');
}

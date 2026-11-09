export const SUPPORTED_LOCALES = ['es', 'en'];

const PRODUCT_ENGLISH = {
  baileys: {
    name: 'Baileys Vanilla Cream & Biscuit',
    desc: 'Smooth vanilla cream with notes of Baileys and crunchy biscuit pieces. Creamy, sweet and elegant.',
  },
  chinola: {
    name: 'Delicate Passion Fruit Cream',
    desc: 'A silky texture with vibrant tropical acidity. Light and elegant.',
  },
  pistacho: {
    name: 'Pistachio & Red Berry Cream',
    desc: 'Delicate, silky pistachio cream with an exquisite red berry compote for the perfect balance of sweetness and acidity.',
  },
  pannacotta: {
    name: 'Panna Cotta Signature by Cokoa MR',
    desc: 'A silky panna cotta with a red berry coulis base and a delicate crunch on top. Elegant and creamy.',
  },
  dulceleche: {
    name: 'Dulce de Leche & Coffee Cream',
    desc: 'Paired with an aromatic coffee biscuit. An elegant dessert full of character.',
  },
  carrot: {
    name: 'Carrot Cake',
    desc: 'Layers of carrot cake and smooth cream cheese frosting in a convenient individual serving. Creamy, fresh and delicious.',
  },
  tresleches: {
    name: 'Tres Leches',
    desc: 'Light, moist and perfectly balanced, with a creamy finish.',
  },
  avellanas: {
    name: 'Hazelnut Cream',
    desc: 'A silky hazelnut cream over a soft sponge cake. Elegant and irresistible.',
  },
  oreo: {
    name: 'Oreo Cookies & Cream',
    desc: 'Layers of silky cream and crushed Oreo cookies. A delicious contrast of crunchy and creamy textures.',
  },
  chocolate: {
    name: 'Chocolate',
    desc: 'Chocolate mousse and moist cacao sponge cake.',
  },
  box4: {
    name: 'Discovery Box',
    desc: 'Four desserts in cans selected by the chef.',
    unit: 'gift box',
  },
  box6: {
    name: 'Sharing Box',
    desc: 'Six assorted desserts in cans, perfect for gifting.',
    unit: 'gift box',
  },
  box9: {
    name: 'Celebration Box',
    desc: 'Nine desserts in cans plus a personalized card.',
    unit: 'gift box',
  },
  dominicana: {
    name: 'Dominican Experience',
    desc: 'Premium Dominican coffee, traditional sweets and the opportunity to prepare your own hot chocolate.',
    unit: 'per person',
  },
  immersive: {
    name: 'Cokoa Immersive Experience',
    desc: 'An immersive experience where chocolate making, creativity and flavor take you on a unique journey, including a chocolate bar workshop, mamajuana, coffee and more.',
    unit: 'per person',
  },
  'trilogia-de-alfajores-de-dulce-de-leche-494': {
    name: 'Dulce de Leche Alfajor Trilogy',
    desc: 'Handmade cornstarch alfajores filled with creamy dulce de leche and finished with coconut. A soft texture that melts in your mouth.',
  },
  'banoffee-114': {
    name: 'Banoffee',
    desc: 'Layers of smooth cream, caramel, fresh banana and crunchy chocolate.',
  },
  'yuzu-matcha-rubi-chocolate-829': {
    name: 'Yuzu, Matcha & Ruby Chocolate',
    desc: 'Yuzu lemon cream, light matcha mousse, ruby chocolate and raspberry cream with vanilla crumble.',
  },
  'tiramisu-signature-by-cokoa-mr-934': {
    name: 'Tiramisu Signature by Cokoa MR',
    desc: 'A silky cream over soft sponge cake. An elegant and irresistible dessert.',
  },
  'dubai-pistachio-crunch-by-cokoa-mr-278': {
    name: 'Dubai Pistachio Crunch by Cokoa MR',
    desc: 'Roasted pistachio with a crunchy texture and sweet notes, inspired by the elegance and luxury of Dubai.',
  },
  'crumble-de-manzana-con-nuez-tostada-167': {
    name: 'Apple Crumble with Roasted Walnuts',
    desc: 'Caramelized apples with a crunchy walnut topping. Sweet, warm and perfect to enjoy.',
  },
  'red-velvet-136': {
    name: 'Red Velvet',
    desc: 'Layers of Red Velvet cake with Philadelphia cream cheese frosting.',
  },
  '5-sabores-quisqueya-117': {
    name: 'Five Flavors of Quisqueya',
    desc: 'A Dominican classic reimagined with a special touch. Crunchy, aromatic and full of flavor, with sweet coconut and warm, lightly spiced ginger.',
  },
  'brownies-de-chocolate-992': {
    name: 'Chocolate Brownies',
    desc: 'Dense and moist, with deep chocolate flavor and a smooth finish.',
  },
  'cheesecake-de-lotus-233': {
    name: 'Lotus Cheesecake',
    desc: 'Silky cheesecake over a crunchy Biscoff cookie base with rich notes of spiced caramel. Pure indulgence.',
  },
  'flan-caramel-520': {
    name: 'Caramel Flan',
    desc: 'The timeless classic, perfected: smooth, sweet flan with irresistible caramel.',
  },
  'new-york-cheesecake-200': {
    name: 'New York Cheesecake',
    desc: 'Dense and silky cheesecake over a golden cookie crust. An elegant classic.',
  },
  'iced-chai-latte-300-ml-876': {
    name: 'Iced Chai Latte | 300 ml',
    desc: 'Spiced chai tea with milk and ice, creamy, aromatic and perfectly balanced.',
  },
  'iced-cacao-tea-300-ml-319': {
    name: 'Iced Cacao Tea | 300 ml',
    desc: 'Cold cacao infusion served over ice. Light, refreshing and naturally aromatic.',
  },
  'iced-matcha-latte-300-ml-768': {
    name: 'Iced Matcha Latte | 300 ml',
    desc: 'A refreshing blend of Japanese matcha, milk and ice. Smooth, creamy and energizing.',
  },
  'iced-coconut-matcha-vanilla-foam-300-ml-167': {
    name: 'Iced Coconut Matcha & Vanilla Foam | 300 ml',
    desc: 'Fine matcha infused with chilled coconut water and ice for a light, tropical and naturally energizing drink.',
  },
  'cinnamon-latte-285': {
    name: 'Cinnamon Latte',
    desc: 'Smooth espresso with creamy milk and aromatic cinnamon, creating a warm, sweet and comforting drink.',
  },
  'spicy-citrus-dark-85-tajin-90gr-332': {
    name: 'Spicy Citrus Dark 85% (Tajin) | 90 g',
    desc: 'An intense 85% dark chocolate bar enhanced with Tajin for the perfect balance of spice, citrus and sweetness.',
  },
  'la-rubi-petalos-de-rosas-y-frambuesas-edicion-premium-90gr-728': {
    name: 'La Rubi with Rose Petals & Raspberries | Premium Edition 90 g',
    desc: 'Naturally pink chocolate with fruity notes and a smooth, sophisticated flavor that surprises from the first bite.',
  },
  'coffee-love-bar-70-90gr-739': {
    name: 'Coffee & Love Bar 70% | 90 g',
    desc: 'A delicious coffee-infused chocolate bar combining rich aromas with a balanced and sophisticated profile.',
  },
  'lemon-raspberry-kick-90-gr-222': {
    name: 'Lemon Raspberry Kick | 90 g',
    desc: 'A vibrant blend of lemon and raspberry with a subtle spicy touch of pepper.',
  },
  'rose-ocean-sal-70-dark-chocolate-401': {
    name: 'Rose & Ocean Salt 70% Dark Chocolate',
    desc: '70% dark chocolate with rose petals and sea salt flakes. An elegant combination of floral and intense notes.',
  },
  'crunchy-nibs-milk-chocolate-90gr-147': {
    name: 'Crunchy Nibs Milk Chocolate | 90 g',
    desc: 'Creamy milk chocolate with roasted cacao nibs for the perfect balance of sweetness and character.',
  },
  'pineapple-dark-70-90g-636': {
    name: 'Pineapple Dark 70% | 90 g',
    desc: '70% dark chocolate with tropical pineapple notes that add freshness and vibrant contrast.',
  },
  'raisin-dark-70-90g-673': {
    name: 'Raisin Dark 70% | 90 g',
    desc: '70% dark chocolate with sweet raisin notes that add depth and a naturally balanced contrast.',
  },
  'pistachio-dark-70-90gr-811': {
    name: 'Pistachio Dark 70% | 90 g',
    desc: '70% dark chocolate with selected pistachios for a smooth, roasted and elegant touch.',
  },
  'roasted-almond-dark-70-90gr-671': {
    name: 'Roasted Almond Dark 70% | 90 g',
    desc: 'Dark chocolate with roasted almonds that enhance its flavor with warm and elegant notes.',
  },
  'yuzu-mango-white-chocolate-limited-edition-844': {
    name: 'Yuzu & Mango White Chocolate | Limited Edition',
    desc: 'Premium white chocolate with delicate Japanese yuzu citrus and mango notes. Creamy, fresh and sophisticated.',
  },
  'cielo-de-jerez-limited-edition-351': {
    name: 'Cielo de Jerez | Limited Edition',
    desc: 'A contemporary interpretation of Andalusia: delicate tocinillo del cielo meets tropical passion fruit, aromatic sherry and warm spiced crumble.',
  },
  'l-olive-421': {
    name: "L'Olive | Limited Edition",
    desc: 'An elegant composition of creamy 70% chocolate, aromatic Cointreau and natural vanilla over a soft almond sponge made with olive oil.',
  },
  'frambuesa-perla-de-rubi-autor-bar-90gr-471': {
    name: 'Raspberry & Ruby Pearl Signature Bar | 90 g',
    desc: 'An elegant, vibrant chocolate bar where intense cacao meets delicate raspberry acidity and the sophisticated crunch of ruby pearls.',
  },
  'dulce-de-leche-caramelo-sea-salt-90-gr-287': {
    name: 'Dulce de Leche, Caramel & Sea Salt | 90 g',
    desc: 'Rich chocolate with dulce de leche and caramel, enhanced by sea salt from Bani and the elegant crunch of macadamia.',
  },
  'chocolate-blanco-nibs-de-cacao-178': {
    name: 'White Chocolate & Cacao Nibs',
    desc: 'Smooth, creamy white chocolate paired with the intense flavor and crunchy texture of roasted cacao nibs.',
  },
  '70-dark-chocolate-with-cacao-nibs-90-gr-352': {
    name: '70% Dark Chocolate with Cacao Nibs | 90 g',
    desc: 'Intense 70% dark chocolate with roasted cacao nibs for a sophisticated balance of deep aroma, crunchy texture and a delicate bittersweet finish.',
  },
  'lotus-biscoff-255': {
    name: 'Lotus Biscoff',
    desc: 'Irresistibly smooth Lotus cream with crushed Lotus cookies and the unmistakable caramelized flavor of Biscoff.',
  },
};

const CATEGORY_ENGLISH = {
  latas: 'Desserts in Cans',
  postres: 'Desserts',
  bebidas: 'Drinks',
  chocolates: 'Chocolates',
  cosmeticos: 'Cacao Cosmetics',
  cajas: 'Gift Boxes',
  experiencias: 'Experiences',
  'tabletas-de-chocolates-organicos-dominicanos': 'Dominican Organic Chocolate Bars',
};

const DELIVERY_ENGLISH = {
  ciudad: {
    name: 'Bavaro · Punta Cana',
    coverage: 'Delivery within the city.',
    eta: 'Same day',
  },
  fuera: {
    name: 'Outside the city',
    coverage: 'We coordinate delivery with you via WhatsApp.',
    eta: 'By appointment',
  },
};

export function localeFromPath(pathname = window.location.pathname) {
  return pathname.replace(/\/+$/, '') === '/en' ? 'en' : 'es';
}

export function getProductEnglish(item) {
  const fallback = PRODUCT_ENGLISH[item && item.id] || {};
  return {
    name: String(item?.nameEn || fallback.name || item?.name || '').trim(),
    desc: String(item?.descEn || fallback.desc || item?.desc || '').trim(),
    unit: String(item?.unitEn || fallback.unit || translateUnit(item?.unit) || item?.unit || '').trim(),
  };
}

export function localizeItem(item, locale) {
  if (locale !== 'en') return item;
  const english = getProductEnglish(item);
  return { ...item, name: english.name, desc: english.desc, unit: english.unit };
}

export function getCategoryEnglish(category) {
  const id = String(category?.id || '').trim();
  return String(category?.nameEn || CATEGORY_ENGLISH[id] || category?.name || '').trim();
}

export function localizeCategory(category, locale) {
  return locale === 'en' ? { ...category, name: getCategoryEnglish(category) } : category;
}

export function getDeliveryEnglish(zone) {
  const fallback = DELIVERY_ENGLISH[zone && zone.id] || {};
  return {
    name: String(zone?.nameEn || fallback.name || zone?.name || '').trim(),
    coverage: String(zone?.coverageEn || fallback.coverage || zone?.coverage || '').trim(),
    eta: String(zone?.etaEn || fallback.eta || zone?.eta || '').trim(),
  };
}

export function localizeDeliveryZone(zone, locale) {
  if (locale !== 'en') return zone;
  return { ...zone, ...getDeliveryEnglish(zone) };
}

function translateUnit(value) {
  return String(value || '')
    .replace(/^lata\s+/i, 'can ')
    .replace(/^por persona$/i, 'per person')
    .replace(/^caja de regalo$/i, 'gift box')
    .replace(/^porción$/i, 'serving')
    .replace(/^unidad$/i, 'unit');
}

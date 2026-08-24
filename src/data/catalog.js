// Catálogo Chocolate World — editar aquí precios, sabores y descripciones.

export const PRODUCTS = [
  { id: 'baileys', name: 'Baileys', desc: 'Crema de Baileys, chocolate y bizcocho de cacao.' },
  { id: 'chinola', name: 'Chinola', desc: 'Crema de chinola con crocante de chocolate.' },
  { id: 'pistacho', name: 'Pistacho y Frambuesa', desc: 'Crema de pistacho con frambuesa y crocante de chocolate.' },
  { id: 'pannacotta', name: 'Panna Cotta', desc: 'Panna cotta cremosa con coulis de frutos rojos y galleta de vainilla.' },
  { id: 'dulceleche', name: 'Dulce de Leche y Café', desc: 'Dulce de leche, crema de café y bizcocho de chocolate.' },
  { id: 'carrot', name: 'Carrot Cake', desc: 'Bizcocho de zanahoria gluten free con crema de queso.' },
  { id: 'tresleches', name: 'Tres Leches', desc: 'Bizcocho tres leches con crema suave.' },
  { id: 'avellanas', name: 'Chocolate y Avellanas', desc: 'Mousse de chocolate y crema de avellanas.' },
  { id: 'oreo', name: 'Oreo', desc: 'Crema de vainilla con galleta Oreo y trozos crujientes.' },
  { id: 'chocolate', name: 'Chocolate', desc: 'Mousse de chocolate y bizcocho de cacao húmedo.' },
].map((p) => ({ ...p, price: 450, unit: 'lata 300ml' }));

export const BOXES = [
  { id: 'box4', name: 'Caja Descubre', desc: '4 postres en lata a elección del chef.', price: 1700 },
  { id: 'box6', name: 'Caja Comparte', desc: '6 postres en lata surtidos, ideal para regalar.', price: 2450 },
  { id: 'box9', name: 'Caja Celebra', desc: '9 postres en lata + tarjeta personalizada.', price: 3500 },
].map((b) => ({ ...b, unit: 'caja de regalo' }));

export const EXPERIENCES = [
  {
    id: 'dominicana',
    name: 'Experiencia Dominicana',
    desc: 'Café premium dominicano, dulces típicos y prepara tu propio chocolate caliente.',
    price: 1800,
  },
  {
    id: 'immersive',
    name: 'Cokoa Immersive Experience',
    desc: 'Una propuesta inmersiva donde la gastronomía, la creatividad y los sabores te llevan a un viaje único.',
    price: 2500,
  },
].map((e) => ({ ...e, unit: 'por persona' }));

export const DELIVERY_FEE_CIUDAD = 150;

export const CONTACT = {
  instagram: 'cokoabychefmanurossi',
  location: 'Bávaro, Punta Cana 🇩🇴',
  phoneDisplay: '+1 (809) 000-0000',
  phoneHref: 'tel:+18090000000',
};

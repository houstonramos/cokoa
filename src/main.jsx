import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './AdminApp';
import { detectBrowserLocale, getSavedLocale, localeFromPath, rememberLocale } from './lib/i18n';
import './index.css';

// Enrutamiento mínimo sin librerías: /admin es el panel y /en es la tienda en inglés.
const normalizedPath = window.location.pathname.replace(/\/+$/, '');
const isAdmin = normalizedPath === '/admin';
const locale = localeFromPath();
const isSpanishHome = !normalizedPath;
const savedLocale = getSavedLocale();
const preferredLocale = savedLocale || detectBrowserLocale();
const shouldOpenEnglish = !isAdmin && isSpanishHome && preferredLocale === 'en';

if (shouldOpenEnglish) {
  window.location.replace(`/en${window.location.hash || ''}`);
} else if (!isAdmin) {
  const english = locale === 'en';
  const title = english
    ? 'Cokoa by Chef Manu Rossi | Desserts, drinks and cacao'
    : 'Cokoa by Chef Manu Rossi | Postres, bebidas y cacao';
  const description = english
    ? 'Desserts in cans, petit gâteau, drinks, Dominican chocolates, gifts and handcrafted experiences in Bavaro · Punta Cana.'
    : 'Postres en lata, petit gâteau, bebidas, chocolates dominicanos, regalos y experiencias artesanales en Bávaro · Punta Cana.';
  const canonical = english ? 'https://cokoa.online/en' : 'https://cokoa.online/';

  document.documentElement.lang = locale;
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', english ? 'en_US' : 'es_DO');
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
  rememberLocale(locale);
}

if (!shouldOpenEnglish) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      {isAdmin ? <AdminApp /> : <App locale={locale} />}
    </React.StrictMode>
  );
}

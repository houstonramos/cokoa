const BUSINESS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwDEqAI-e60panDCwe69xivB6e-445vyZ6pMaSV4Bj_qXKBqJXjudliIkflIvdxJoVqig/exec';

// A separate variable name prevents a stale Netlify value from keeping the
// storefront connected to the former personal-account deployment.
export const ORDERS_ENDPOINT = import.meta.env.VITE_COKOA_ORDERS_ENDPOINT || BUSINESS_ENDPOINT;

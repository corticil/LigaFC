/* global __APP_VERSION__, __BUILD_DATE__ */

// Constantes inyectadas en build time por vite.config.js (define)
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
export const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined'
  ? __BUILD_DATE__.slice(0, 16).replace('T', ' ')
  : '';

/* eslint-disable @typescript-eslint/no-require-imports */  
const withPWA = require('next-pwa')({  
  dest: "public",  
  disable: false,  // Cambiar a false para generar SW siempre  
  register: true,  
  skipWaiting: true,  
});  
  
module.exports = withPWA;
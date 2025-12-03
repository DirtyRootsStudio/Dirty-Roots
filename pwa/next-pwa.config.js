/* eslint-disable @typescript-eslint/no-require-imports */  
const withPWA = require('next-pwa')({  
  dest: "public",  
  disable: process.env.NODE_ENV === "development",  
  register: true,  
  skipWaiting: true,  
});  
  
module.exports = withPWA;
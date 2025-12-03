import type { NextConfig } from "next";  
import withPWA from './next-pwa.config.js';  
  
const nextConfig: NextConfig = {  
  images: {  
    unoptimized: true,  
  },  
};  
  
// eslint-disable-next-line @typescript-eslint/no-explicit-any  
export default withPWA(nextConfig as any);
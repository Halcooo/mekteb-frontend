import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({mode})=>{
  if(mode==='production'){
    const api=loadEnv(mode,process.cwd(),'VITE_').VITE_API_URL;
    let url:URL;
    try{url=new URL(api);}catch{throw new Error('Production VITE_API_URL must be an absolute HTTPS API URL');}
    if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/backend/api')throw new Error('Production VITE_API_URL must use HTTPS and /backend/api without credentials or query');
  }
  return {
  // Use an absolute base so hashed assets (fonts/icons) resolve on deep links.
  base: "/",
  plugins: [react()],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
};});

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'maskable-icon-512x512.png'],
        manifest: {
          name: 'Mento AI',
          short_name: 'MentoAI',
          description: 'Your intelligent AI mentor for learning, coding, and problem-solving.',
          theme_color: '#863bff',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            {
              src: 'icon/mentoai_logo.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon/mentoai_logo.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'icon/mentoai_logo_512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5000000,
        }
      })
    ],

    server: {
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});

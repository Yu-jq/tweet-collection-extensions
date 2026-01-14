import { defineConfig, PluginOption } from "vite";
import { enterDevPlugin, enterProdPlugin } from 'vite-plugin-enter-dev';
import react from '@vitejs/plugin-react';
import path from "path";

export default defineConfig(({ mode }) => {
  const plugins = [react(), ...enterProdPlugin()];
  if (mode === 'development') {
    plugins.push(...enterDevPlugin());
  }
  return {
    server: { host: "::", port: 8080 },
    plugins: plugins.filter(Boolean) as PluginOption[],
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
    base: './',
    build: {
      outDir: 'dist',
      // Chrome 扩展 CSP 兼容配置
      cssCodeSplit: false,
      modulePreload: false,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          content: path.resolve(__dirname, 'src/content/content.ts'),
          background: path.resolve(__dirname, 'src/background/background.ts'),
        },
        output: {
          entryFileNames: (chunk) => {
            if (chunk.name === 'content') return 'content.js';
            if (chunk.name === 'background') return 'background.js';
            return 'assets/[name]-[hash].js';
          },
          // 避免内联动态导入
          inlineDynamicImports: false,
        },
      },
    }
  };
});
import { defineConfig } from 'vite';

// base 用 './'：产物可以放在任意子路径（如 https://xxx.com/products/）下而无需改配置。
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    target: 'es2020',
    cssTarget: 'chrome80',
    // 站点本身很小，关闭资源内联阈值之外的一切拆分，保持单文件产物便于部署
    modulePreload: { polyfill: true },
    reportCompressedSize: true,
  },
});

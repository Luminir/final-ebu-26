import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = [
  'index',
  'mua-le',
  'cam-nang',
  'san-pham',
  'ai-goi-y',
  'gio-hang',
  'thanh-toan',
  'lich-gia-dinh',
  'tai-khoan',
  'thong-ke',
  'chinh-sach',
];

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(__dirname, `${p}.html`)])),
    },
  },
  test: { environment: 'node' },
});

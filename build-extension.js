import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');
const srcPath = path.join(__dirname, 'src');

// 复制 manifest.json
fs.copyFileSync(
  path.join(publicPath, 'manifest.json'),
  path.join(distPath, 'manifest.json')
);
console.log('+ manifest.json');

// 从源目录复制 content.css
fs.copyFileSync(
  path.join(srcPath, 'content/content.css'),
  path.join(distPath, 'content.css')
);
console.log('+ content.css');

console.log('Build complete! Load "dist" folder in Chrome Extensions.');

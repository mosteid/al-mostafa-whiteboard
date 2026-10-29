// ينسخ كل المكتبات الخارجية (pdf.js، الخطوط، الأيقونات…) إلى src/vendor
// فيعمل التطبيق بالكامل بدون إنترنت ولا يعتمد على أي CDN.
// الاستخدام:  npm install  ثم  npm run vendor
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = (p) => path.join(root, 'node_modules', p);
const out = (p) => path.join(root, 'src', 'vendor', p);
const mk = (d) => fs.mkdirSync(d, { recursive: true });
let missing = 0;

function copy(from, to) {
  if (!fs.existsSync(from)) { console.warn('✗ غير موجود:', path.relative(root, from)); missing++; return; }
  mk(path.dirname(to));
  fs.cpSync(from, to, { recursive: true });
  console.log('✓', path.relative(root, to));
}

copy(nm('pdfjs-dist/build/pdf.min.js'), out('pdf.min.js'));
copy(nm('pdfjs-dist/build/pdf.worker.min.js'), out('pdf.worker.min.js'));
copy(nm('pdfjs-dist/cmaps'), out('pdfjs/cmaps'));
copy(nm('pdfjs-dist/standard_fonts'), out('pdfjs/standard_fonts'));
copy(nm('pdf-lib/dist/pdf-lib.min.js'), out('pdf-lib.min.js'));
copy(nm('jspdf/dist/jspdf.umd.min.js'), out('jspdf.umd.min.js'));
copy(fs.existsSync(nm('canvas-confetti/dist/confetti.browser.min.js')) ? nm('canvas-confetti/dist/confetti.browser.min.js') : nm('canvas-confetti/dist/confetti.browser.js'), out('confetti.browser.min.js'));
copy(nm('@fortawesome/fontawesome-free/css/all.min.css'), out('fa/css/all.min.css'));
copy(nm('@fortawesome/fontawesome-free/webfonts'), out('fa/webfonts'));

// الخطوط العربية (Fontsource) -> fonts.css محلي
const AR = 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LA = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const FONTS = [
  ['Cairo', 'cairo', [400, 600, 700, 900]], ['Amiri', 'amiri', [400, 700]], ['Aref Ruqaa', 'aref-ruqaa', [400, 700]],
  ['Noto Naskh Arabic', 'noto-naskh-arabic', [400, 700]], ['Tajawal', 'tajawal', [400, 700]],
];
let css = '/* مُولَّد تلقائيًا بواسطة scripts/vendor.mjs */\n';
for (const [family, pkg, weights] of FONTS) {
  for (const w of weights) for (const [subset, range] of [['arabic', AR], ['latin', LA]]) {
    const file = `${pkg}-${subset}-${w}-normal.woff2`;
    const src = nm(`@fontsource/${pkg}/files/${file}`);
    if (!fs.existsSync(src)) continue;
    mk(out('fonts/files')); fs.copyFileSync(src, out(`fonts/files/${file}`));
    css += `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:swap;src:url(files/${file}) format('woff2');unicode-range:${range}}\n`;
  }
}
mk(out('fonts')); fs.writeFileSync(out('fonts/fonts.css'), css);
console.log('✓ src/vendor/fonts/fonts.css');
console.log(missing ? `\nانتهى مع ${missing} ملف ناقص — تأكد من تشغيل npm install أولًا.` : '\nتم — التطبيق جاهز للعمل بدون إنترنت.');

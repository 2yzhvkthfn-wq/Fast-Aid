// Check i18n key coverage in templates vs translations
const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, 'static', 'js', 'i18n.js');
const i18nSrc = fs.readFileSync(i18nPath, 'utf8');
const enMatch = i18nSrc.match(/en:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*fr:/);
const frMatch = i18nSrc.match(/fr:\s*\{([\s\S]*?)\n\s*\}\s*\};/);

function extractKeys(block) {
    const keys = [];
    const re = /^\s*([a-z_]+):/gm;
    let m;
    while ((m = re.exec(block))) keys.push(m[1]);
    return keys;
}

const enKeys = new Set(extractKeys(enMatch[1]));
const frKeys = new Set(extractKeys(frMatch[1]));

const templatesDir = path.join(__dirname, 'templates');
const htmlFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'));
const usedKeys = new Set();

for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(templatesDir, file), 'utf8');
    const re = /data-i18n(?:-placeholder)?="([^"]+)"/g;
    let m;
    while ((m = re.exec(html))) usedKeys.add(m[1]);
}

const missingEn = [...usedKeys].filter(k => !enKeys.has(k));
const missingFr = [...usedKeys].filter(k => !frKeys.has(k));
const missingFrMirror = [...enKeys].filter(k => !frKeys.has(k));

console.log('Template i18n keys:', usedKeys.size);
console.log('EN keys:', enKeys.size, 'FR keys:', frKeys.size);
console.log('Missing EN for templates:', missingEn.length ? missingEn : 'none');
console.log('Missing FR for templates:', missingFr.length ? missingFr : 'none');
console.log('EN keys without FR:', missingFrMirror.length ? missingFrMirror.slice(0, 10) : 'none');

if (missingEn.length || missingFr.length || missingFrMirror.length) process.exit(1);
console.log('i18n coverage OK');

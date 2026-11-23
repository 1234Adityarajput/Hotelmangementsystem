const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, '../frontend/src/app'),
  path.join(__dirname, '../frontend/src/components'),
];

const replacementRules = [
  // Primary CTA buttons & accents
  { from: /bg-indigo-600 hover:bg-indigo-500/g, to: 'bg-[#362A22] hover:bg-[#43352B]' },
  { from: /bg-indigo-600 hover:bg-indigo-700/g, to: 'bg-[#362A22] hover:bg-[#43352B]' },
  { from: /hover:bg-indigo-500/g, to: 'hover:bg-[#43352B]' },
  { from: /hover:bg-indigo-700/g, to: 'hover:bg-[#43352B]' },
  { from: /bg-indigo-600/g, to: 'bg-[#362A22]' },
  { from: /bg-indigo-700/g, to: 'bg-[#2A201A]' },
  { from: /bg-indigo-500/g, to: 'bg-[#B08A60]' },
  { from: /text-indigo-600/g, to: 'text-[#B08A60]' },
  { from: /text-indigo-700/g, to: 'text-[#362A22]' },
  { from: /text-indigo-500/g, to: 'text-[#B08A60]' },
  { from: /text-indigo-400/g, to: 'text-[#C5A37B]' },
  { from: /hover:text-indigo-600/g, to: 'hover:text-[#B08A60]' },
  { from: /hover:text-indigo-700/g, to: 'hover:text-[#362A22]' },
  { from: /hover:bg-indigo-50\/40/g, to: 'hover:bg-[#F2EADF]' },
  { from: /hover:bg-indigo-50/g, to: 'hover:bg-[#F2EADF]' },
  { from: /bg-indigo-50\/80/g, to: 'bg-[#FAF6F0]' },
  { from: /bg-indigo-50/g, to: 'bg-[#FAF6F0]' },
  { from: /bg-indigo-100/g, to: 'bg-[#FAF6F0]' },
  { from: /border-indigo-600/g, to: 'border-[#B08A60]' },
  { from: /border-indigo-500/g, to: 'border-[#B08A60]' },
  { from: /border-indigo-300/g, to: 'border-[#B08A60]/40' },
  { from: /border-indigo-200/g, to: 'border-[#E3D9CA]' },
  { from: /focus:ring-indigo-500/g, to: 'focus:ring-[#B08A60]' },
  { from: /focus:border-indigo-500/g, to: 'focus:border-[#B08A60]' },
  { from: /focus:ring-indigo-600/g, to: 'focus:ring-[#B08A60]' },

  // Blue buttons & accents
  { from: /bg-blue-600 hover:bg-blue-500/g, to: 'bg-[#362A22] hover:bg-[#43352B]' },
  { from: /bg-blue-600 hover:bg-blue-700/g, to: 'bg-[#362A22] hover:bg-[#43352B]' },
  { from: /bg-blue-600/g, to: 'bg-[#362A22]' },
  { from: /text-blue-600/g, to: 'text-[#B08A60]' },
  { from: /hover:text-blue-600/g, to: 'hover:text-[#B08A60]' },

  // Slate Neutral borders & backgrounds
  { from: /border-slate-200\/90/g, to: 'border-[#E3D9CA]' },
  { from: /border-slate-200\/70/g, to: 'border-[#E3D9CA]' },
  { from: /border-slate-200\/80/g, to: 'border-[#E3D9CA]' },
  { from: /border-slate-200/g, to: 'border-[#E3D9CA]' },
  { from: /border-slate-100/g, to: 'border-[#EAE3D8]' },
  { from: /divide-slate-100/g, to: 'divide-[#EAE3D8]' },
  { from: /divide-slate-200/g, to: 'divide-[#E3D9CA]' },
  { from: /bg-slate-50\/80/g, to: 'bg-[#F7F4EE]' },
  { from: /bg-slate-50\/60/g, to: 'bg-[#F7F4EE]' },
  { from: /bg-slate-50\/40/g, to: 'bg-[#F7F4EE]' },
  { from: /bg-slate-50/g, to: 'bg-[#F7F4EE]' },
  { from: /hover:bg-slate-50\/80/g, to: 'hover:bg-[#F2EADF]/60' },
  { from: /hover:bg-slate-50\/60/g, to: 'hover:bg-[#F2EADF]/60' },
  { from: /hover:bg-slate-50/g, to: 'hover:bg-[#F2EADF]' },

  // Typography colors
  { from: /text-slate-900/g, to: 'text-[#362A22]' },
  { from: /text-slate-800/g, to: 'text-[#362A22]' },
  { from: /text-slate-700/g, to: 'text-[#5D493D]' },
  { from: /text-slate-600/g, to: 'text-[#79695B]' },
  { from: /text-slate-500/g, to: 'text-[#79695B]' },
  { from: /text-slate-400/g, to: 'text-[#948779]' },
];

function processFile(filePath) {
  // Skip layout and login as they are already custom styled
  if (filePath.endsWith('layout.tsx') || filePath.endsWith('login\\page.tsx') || filePath.endsWith('sidebar.tsx') || filePath.endsWith('header.tsx')) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const rule of replacementRules) {
    if (rule.from.test(content)) {
      content = content.replace(rule.from, rule.to);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated theme in: ${path.relative(__dirname, filePath)}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      processFile(fullPath);
    }
  }
}

console.log('--- Applying Ivory & Espresso theme across frontend ---');
for (const dir of targetDirs) {
  walkDir(dir);
}
console.log('--- Theme application complete ---');

const fs = require('fs');
const path = require('path');

const replacements = [
  // Primary Dark to Royal Burgundy / Deep Wine
  { from: /#362A22/gi, to: '#59283A' },
  { from: /#43352B/gi, to: '#472130' },
  { from: /#2A201A/gi, to: '#381926' },

  // Antique Gold to Champagne Gold
  { from: /#B08A60/gi, to: '#C4A06A' },
  { from: /#C4A77E/gi, to: '#D8BC8F' },
  { from: /#C9A781/gi, to: '#D8BC8F' },
  { from: /#96724A/gi, to: '#A8834F' },
  { from: /#7A5935/gi, to: '#8B6A3D' },
  { from: /#B58E58/gi, to: '#C4A06A' },

  // Muted Mocha to Secondary Text / Muted Rose / Muted Burgundy
  { from: /#79695B/gi, to: '#82747A' },
  { from: /#5D493D/gi, to: '#7A4652' },
  { from: /#948779/gi, to: '#8E7079' },
  { from: /#C4B5AC/gi, to: '#8E7079' },
  { from: /#B0A495/gi, to: '#8E7079' },

  // Ivory to Pearl Backgrounds
  { from: /#F7F4EE/gi, to: '#F5F0EA' },
  { from: /#FAF6F0/gi, to: '#F5F0EA' },
  { from: /#F2EADF/gi, to: '#EFE8E0' },
  { from: /#F3ECE1/gi, to: '#EFE8E0' },
  { from: /#EEE7DA/gi, to: '#F5F0EA' },
  { from: /#F7F5F3/gi, to: '#FAF5F7' },
  { from: /#EFEBE7/gi, to: '#F3E8EC' },

  // Warm Borders to Soft Border #E8DDD8
  { from: /#E3D9CA/gi, to: '#E8DDD8' },
  { from: /#EAE3D8/gi, to: '#E8DDD8' },
  { from: /#D6C7B2/gi, to: '#E8DDD8' },
  { from: /#DDD4CE/gi, to: '#E8DDD8' },
  { from: /#E8E2D9/gi, to: '#E8DDD8' },
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const targetDirs = [
  path.join(__dirname, '../frontend/src/app'),
  path.join(__dirname, '../frontend/src/components'),
];

let totalModified = 0;

targetDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) return;
  walkDir(dir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.css')) return;
    
    // Skip globals.css, layout.tsx, sidebar.tsx, header.tsx, app-shell.tsx since we already carefully authored them
    const baseName = path.basename(filePath);
    if (['globals.css', 'layout.tsx', 'sidebar.tsx', 'header.tsx', 'app-shell.tsx'].includes(baseName)) {
      return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    for (const r of replacements) {
      if (r.from.test(content)) {
        content = content.replace(r.from, r.to);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Updated theme tokens in ${path.relative(path.join(__dirname, '..'), filePath)}`);
      totalModified++;
    }
  });
});

console.log(`\nSuccessfully applied Royal Burgundy & Pearl theme tokens to ${totalModified} files!`);

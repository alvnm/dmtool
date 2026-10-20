const fs = require('fs');

// Layout update
let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
layout = layout.replace(
  "{ url: '/icon.svg', type: 'image/svg+xml' },",
  "{ url: '/favicon.png', sizes: '32x32', type: 'image/png' },"
);
fs.writeFileSync('src/app/layout.tsx', layout, 'utf8');

// MainApp update
let app = fs.readFileSync('src/components/MainApp.tsx', 'utf8');
const oldLogoRegex = /<div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500\/20">[\s\S]*?<Sparkles className="w-6 h-6 fill-slate-950" \/>[\s\S]*?<\/div>/;

const newLogo = `<div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 border border-amber-500/30 flex items-center justify-center bg-dungeon-950">
                <img src="/icon-192.png" alt="DM Companion Logo" className="w-full h-full object-cover" />
              </div>`;

app = app.replace(oldLogoRegex, newLogo);
fs.writeFileSync('src/components/MainApp.tsx', app, 'utf8');

console.log('Layout & MainApp updated.');

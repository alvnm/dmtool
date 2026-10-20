const fs = require('fs');

let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const regex = /\{\/\* Logo \*\/\}[\s\S]*?<div className="flex items-center gap-3 cursor-pointer shrink-0" onClick=\{\(\) => setActiveTab\('dashboard'\)\}>[\s\S]*?<div className="hidden sm:block">[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const replacement = `{/* Botón Inicio / Logo */}
            <button
              type="button"
              className="flex items-center cursor-pointer shrink-0 group rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              onClick={() => setActiveTab('dashboard')}
              title={t('dashboard')}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 border border-amber-500/30 group-hover:border-amber-400 flex items-center justify-center bg-dungeon-950 transition">
                <img src="/icon-192.png" alt="DM Companion" className="w-full h-full object-cover group-hover:scale-105 transition" />
              </div>
            </button>`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/MainApp.tsx', code, 'utf8');
console.log('Updated logo button successfully.');

import fs from 'node:fs';

const path = 'src/components/MainApp.tsx';
let content = fs.readFileSync(path, 'utf8');

// Normalizar a LF temporalmente para reemplazo seguro
let norm = content.replace(/\r\n/g, '\n');

const targetNav = `<nav className="hidden md:flex items-center space-x-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={\`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition \${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-dungeon-800'
                    }\`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>`;

const replacementNav = `<nav className="hidden md:flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none flex-1 justify-center min-w-0">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={\`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition \${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-dungeon-800'
                    }\`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>`;

if (!norm.includes(targetNav)) {
  console.error('Target nav not found!');
  process.exit(1);
}

norm = norm.replace(targetNav, replacementNav);

// Asegurar que en mobile también tenga scroll cómodo con padding
norm = norm.replace(
  'className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-dungeon-800 space-x-1"',
  'className="md:hidden flex items-center overflow-x-auto py-2 border-t border-dungeon-800 space-x-1 scrollbar-none px-1"'
);

fs.writeFileSync(path, norm.replace(/\n/g, '\r\n'), 'utf8');
console.log('MainApp updated successfully!');

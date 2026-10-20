const fs = require('fs');

let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// 1. Import useI18n and Globe
code = code.replace(
  "import { ThemeToggle } from '@/components/theme/ThemeToggle';",
  "import { ThemeToggle } from '@/components/theme/ThemeToggle';\nimport { useI18n } from '@/lib/i18n';\nimport { Globe } from 'lucide-react';"
);

// 2. Add hook in MainApp
code = code.replace(
  "export default function MainApp() {",
  "export default function MainApp() {\n  const { t, language, toggleLanguage } = useI18n();"
);

// 3. Nav items
code = code.replace("{ id: 'dashboard', label: 'Panel', icon: LayoutDashboard }", "{ id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard }");
code = code.replace("{ id: 'initiative', label: 'Iniciativa', icon: Swords }", "{ id: 'initiative', label: t('initiative'), icon: Swords }");
code = code.replace("{ id: 'inventory', label: 'Inventario', icon: Backpack }", "{ id: 'inventory', label: t('inventory'), icon: Backpack }");
code = code.replace("{ id: 'monsters', label: 'Bestiario', icon: Skull }", "{ id: 'monsters', label: t('monsters'), icon: Skull }");
code = code.replace("{ id: 'npcs', label: 'NPCs', icon: Users }", "{ id: 'npcs', label: t('npcs'), icon: Users }");
code = code.replace("{ id: 'spells', label: 'Grimorio', icon: BookOpen }", "{ id: 'spells', label: t('spells'), icon: BookOpen }");
code = code.replace("{ id: 'party', label: 'Grupo', icon: UserCheck }", "{ id: 'party', label: t('party'), icon: UserCheck }");
code = code.replace("{ id: 'treasure', label: 'Tesoros', icon: Gift }", "{ id: 'treasure', label: t('treasure'), icon: Gift }");

// 4. Remove syncStatus badge and add language toggle button
// Search for the sync status block
const syncRegex = /\{supabaseActive\s*&&\s*\(\s*<div\s+className=\{`flex items-center gap-1\.5 text-xs px-2\.5 py-1 rounded-full font-medium border transition[\s\S]*?<\/div>\s*\)\}/;

code = code.replace(syncRegex, '');

// Insert language button before or next to ThemeToggle
code = code.replace(
  '<ThemeToggle />',
  `{/* Selector de idioma */}
              <button
                type="button"
                onClick={toggleLanguage}
                title={t('langTooltip')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-dungeon-800 text-slate-300 border border-dungeon-700 hover:text-slate-100 hover:bg-dungeon-700 transition"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{language.toUpperCase()}</span>
              </button>

              <ThemeToggle />`
);

// Update some tooltip / labels
code = code.replace('title="Buscador rápido (Ctrl + K)"', 'title={t("searchTooltip")}');
code = code.replace('title="Descargar la campaña en JSON (Ctrl + S)"', 'title={t("downloadTooltip")}');
code = code.replace('<span className="hidden lg:inline">Buscar</span>', '<span className="hidden lg:inline">{t("search")}</span>');
code = code.replace('title="Focus Mode: ocultar barras y maximizar el espacio (tablet/laptop en la mesa)"', 'title={t("focusTooltip")}');
code = code.replace('<span className="hidden lg:inline">Focus</span>', '<span className="hidden lg:inline">{t("focus")}</span>');
code = code.replace('<LogOut className="w-3.5 h-3.5" /> <span className="hidden md:inline">Salir</span>', '<LogOut className="w-3.5 h-3.5" /> <span className="hidden md:inline">{t("logout")}</span>');
code = code.replace('title="Salir del Focus Mode"', 'title={t("exitFocus")}');
code = code.replace('<Minimize2 className="w-4 h-4" /> Focus', '<Minimize2 className="w-4 h-4" /> {t("exitFocus")}');

fs.writeFileSync('src/components/MainApp.tsx', code, 'utf8');
console.log('MainApp.tsx updated successfully.');

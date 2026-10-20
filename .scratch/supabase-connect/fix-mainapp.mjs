// Repara el refactor a medias de src/components/MainApp.tsx:
//  - faltaban los imports de useCampaignData y de los helpers de combate
//  - el estado local duplicaba el que ya expone el hook
//  - handleExportCampaign no existe (el hook expone exportCampaign)
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'src/components/MainApp.tsx';
let s = readFileSync(PATH, 'utf8');
const applied = [];

function rep(name, re, to) {
  const before = s;
  s = s.replace(re, to);
  if (s === before) throw new Error('No coincidió el paso: ' + name);
  applied.push(name);
}

// 1) imports del hook + helpers de combate (junto al import de usePersistentState)
rep(
  'import useCampaignData/combat',
  /import \{ usePersistentState, readStorage, writeStorage, STORAGE_ERROR_EVENT \} from '@\/lib\/usePersistentState';/,
  "import { usePersistentState } from '@/lib/usePersistentState';\n" +
    "import { useCampaignData } from '@/lib/useCampaignData';\n" +
    "import { sortCombatants, monsterToCombatant } from '@/lib/combat';"
);

// 2) quitar imports que ya vive en el hook (compendium, mockData, campaign)
rep('import compendium', /import \{ loadBestiary, loadGrimoire, mergeById \} from '@\/lib\/compendium';\r?\n/, '');
rep('import mockData', /import \{\s*INITIAL_COMBATANTS, INITIAL_ITEMS, INITIAL_MONSTERS,\s*INITIAL_NPCS, INITIAL_SPELLS, INITIAL_NOTES\s*\} from '@\/lib\/mockData';\r?\n/, '');
rep('import campaign', /import \{ buildCampaign, downloadCampaign, STORAGE_KEYS, type CampaignData \} from '@\/lib\/campaign';\r?\n/, '');

// 3) tipos: solo Monster sigue usándose en este componente
rep('import tipos', /import \{ Combatant, InventoryItem, Monster, NPC, Spell, DMNote \} from '@\/types';/, "import { Monster } from '@/types';");

// 4) configVersion local sin uso (el hook tiene el suyo interno)
rep(
  'configVersion local',
  /  \/\/ Cambia cuando el DM guarda\/borra credenciales en el modal de ajustes\.\r?\n  const \[configVersion, setConfigVersion\] = useState\(0\);\r?\n/,
  ''
);

// 5) estado local duplicado del hook
rep(
  'bloque estado App State',
  /  \/\/ App State \(persistidos en localStorage: la sesi.n local sobrevive a un refresco\)\r?\n(?:  const \[(?:combatants|items|monsters|npcs|spells|notes|party)[^\n]*\r?\n)+/,
  ''
);

// 6) listener de cuota duplicado: el hook ya lo gestiona y expone storageAlert
rep(
  'efecto cuota duplicado',
  /  \/\/ Escuchar errores de cuota de localStorage\r?\n  useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);\r?\n\r?\n/,
  ''
);

// 7) Ctrl+S: usar exportCampaign (lo que expone el hook)
rep('Ctrl+S export', /handleExportCampaign\(\)/g, 'exportCampaign()');
rep('deps efecto Ctrl+S', /\[handleExportCampaign\]/, '[exportCampaign]');

writeFileSync(PATH, s);
console.log('Pasos aplicados:\n  - ' + applied.join('\n  - '));

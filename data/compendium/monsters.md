# Compendio unificado D&D 5e — informe de generación

- Generado: 2026-10-17T22:58:53.597Z
- Monstruos totales: **386** (B1: 383, B2: 325; en ambos: 322; solo B2: 3)
- Hechizos: **396** — SRD completo desde vorpalhex/srd_spells (0 trucos, 361 de nivel 1-9; 32 rituales).

## Fuentes y formatos

| Repo | Formato | Contenido |
|---|---|---|
| beaurancourt/bestiary | Markdown (Jekyll front matter) en `_posts/` | 383 fichas de monstruo |
| Libco/bestiary5thedition | JSON (`assets/srd_5e.json`, 325 monstruos; `files/5e-SRD-Monsters.json` = duplicado + bloque de licencia) | SRD estructurado |
| vorpalhex/srd_spells | JSON (`spells.json`, 396 hechizos) | Grimorio SRD (OGL 1.0a) |

## Calidad de datos (campos vacíos)

| Campo | Vacíos |
|---|---|
| armor_class.value | 0 |
| hit_points | 0 |
| challenge_rating | 0 |
| abilities | 0 |
| alignment | 0 |
| actions | 2 |

## Conflictos detectados entre fuentes

- Bone Devil: challenge_rating 9 -> adoptado B2=12
- Chain Devil: challenge_rating 8 -> adoptado B2=11
- Adult Brass Dragon: speed B1="40 ft., burrow 30 ft., fly 80 ft." vs B2="40 ft., burrow 40 ft., fly 80 ft."
- Air Elemental: speed B1="0 ft., fly 90 ft. (hover)" vs B2="fly 90 ft. (hover)"
- Basilisk: ac B1=15 vs B2=12
- Crocodile: speed B1="20 ft., swim 30 ft." vs B2="20 ft., swim 20 ft."
- Flying Sword: speed B1="0 ft., fly 50 ft. (hover)" vs B2="0 ft., fly 50 ft. It can hover."
- Ghost: speed B1="0 ft., fly 40 ft. (hover)" vs B2="0 ft., fly 40 ft. It can hover."
- Giant Elk: ac B1=14 vs B2=15
- Giant Shark: speed B1="0 ft., swim 50 ft." vs B2="swim 50 ft."
- Giant Wasp: speed B1="10 ft., fly 50 ft." vs B2="10 ft., fly 50 ft., swim 50 ft."
- Hippogriff: speed B1="40 ft., fly 60 ft." vs B2="40 ft, fly 60 ft."
- Hunter Shark: speed B1="0 ft., swim 40 ft." vs B2="swim 40 ft."
- Killer Whale: speed B1="0 ft., swim 60 ft." vs B2="swim 60 ft."
- Quipper: speed B1="0 ft., swim 40 ft." vs B2="swim 40 ft."
- Reef Shark: speed B1="0 ft., swim 40 ft." vs B2="swim 40 ft."
- Sea Horse: speed B1="0 ft., swim 20 ft." vs B2="swim 20 ft."
- Swarm of Beetles: speed B1="20 ft., climb 20 ft., burrow 5 ft." vs B2="20 ft., burrow 5 ft., climb 20 ft."
- Young Blue Dragon: speed B1="40 ft., burrow 20 ft., fly 80 ft." vs B2="40 ft., burrow 40 ft., fly 80 ft."
- Cult Fanatic: hit_points B1="33" vs B2="22"

## Recuperaciones de líneas pegadas (B1)

- 2016-02-29-draft-horse.markdown: entrada inicial recuperada tras cabecera Actions
- 2016-02-29-mammoth.markdown: 1 entrada(s) recuperada(s) de línea pegada
- 2016-02-29-mammoth.markdown: entrada inicial recuperada tras cabecera Actions
- 2016-02-29-mule.markdown: entrada inicial recuperada tras cabecera Actions
- 2016-02-29-ochre-jelly.markdown: entrada inicial recuperada tras cabecera Actions
- 2016-02-29-ogre-zombie.markdown: entrada inicial recuperada tras cabecera Actions
- 2016-02-29-orc.markdown: 1 entrada(s) recuperada(s) de línea pegada
- 2016-02-29-orc.markdown: entrada inicial recuperada tras cabecera Actions
- 2016-02-29-owl.markdown: 1 entrada(s) recuperada(s) de línea pegada
- 2016-02-29-owl.markdown: entrada inicial recuperada tras cabecera Actions
- 2016-02-29-panther.markdown: 2 entrada(s) recuperada(s) de línea pegada
- 2016-02-29-panther.markdown: entrada inicial recuperada tras cabecera Actions
- 2016-02-29-planetar.markdown: entrada inicial recuperada tras cabecera Actions
- 2016-02-29-scorpion.markdown: resto no recuperable "W"
- alias: "Sphinxes Androsphinx" (B1) fusionado con "Androsphinx" (B2)
- alias: "Gnome, Deep (Svirfneblin)" (B1) fusionado con "Deep Gnome (Svirfneblin)" (B2)
- alias: "Elf, Drow" (B1) fusionado con "Drow" (B2)
- alias: "Diseased Giant Rat" (B1) fusionado con "Giant Rat (Diseased)" (B2)

## Etiquetas desconocidas en B1

- ninguna

## Avisos

- ninguno

## Tabla resumen

| Nombre | Tamaño | Tipo | Alineamiento | CA | PV | CR | Fuentes |
|---|---|---|---|---|---|---|---|
| Aarakocra | Medium | humanoid (aarakocra) | neutral good | 12 | 13 | 1/4 | B1 |
| Aboleth | Large | aberration | lawful evil | 17 | 135 | 10 | B1+B2 |
| Acolyte | Medium | humanoid (any race) | any alignment | 10 | 9 | 1/4 | B1+B2 |
| Adult Black Dragon | Huge | dragon | chaotic evil | 19 | 195 | 14 | B1+B2 |
| Adult Blue Dracolich | Huge | undead | lawful evil | 19 | 225 | 17 | B2 |
| Adult Blue Dragon | Huge | dragon | lawful evil | 19 | 225 | 16 | B1+B2 |
| Adult Brass Dragon | Huge | dragon | chaotic good | 18 | 172 | 13 | B1+B2 |
| Adult Bronze Dragon | Huge | dragon | lawful good | 19 | 212 | 15 | B1+B2 |
| Adult Copper Dragon | Huge | dragon | chaotic good | 18 | 184 | 14 | B1+B2 |
| Adult Gold Dragon | Huge | dragon | lawful good | 19 | 256 | 17 | B1+B2 |
| Adult Green Dragon | Huge | dragon | lawful evil | 19 | 207 | 15 | B1+B2 |
| Adult Red Dragon | Huge | dragon | chaotic evil | 19 | 256 | 17 | B1+B2 |
| Adult Silver Dragon | Huge | dragon | lawful good | 19 | 243 | 16 | B1+B2 |
| Adult White Dragon | Huge | dragon | chaotic evil | 18 | 200 | 13 | B1+B2 |
| Air Elemental | Large | elemental | neutral | 15 | 90 | 5 | B1+B2 |
| Allosaurus | Large | beast | unaligned | 13 | 51 | 2 | B1 |
| Ancient Black Dragon | Gargantuan | dragon | chaotic evil | 22 | 367 | 21 | B1+B2 |
| Ancient Blue Dragon | Gargantuan | dragon | lawful evil | 22 | 481 | 23 | B1+B2 |
| Ancient Brass Dragon | Gargantuan | dragon | chaotic good | 20 | 297 | 20 | B1+B2 |
| Ancient Bronze Dragon | Gargantuan | dragon | lawful good | 22 | 444 | 22 | B1+B2 |
| Ancient Copper Dragon | Gargantuan | dragon | chaotic good | 21 | 350 | 21 | B1+B2 |
| Ancient Gold Dragon | Gargantuan | dragon | lawful good | 22 | 546 | 24 | B1+B2 |
| Ancient Green Dragon | Gargantuan | dragon | lawful evil | 21 | 385 | 22 | B1+B2 |
| Ancient Red Dragon | Gargantuan | dragon | chaotic evil | 22 | 546 | 24 | B1+B2 |
| Ancient Silver Dragon | Gargantuan | dragon | lawful good | 22 | 487 | 23 | B1+B2 |
| Ancient White Dragon | Gargantuan | dragon | chaotic evil | 20 | 333 | 20 | B1+B2 |
| Androsphinx | Large | monstrosity | lawful neutral | 17 | 199 | 17 | B1+B2 |
| Animated Armor | Medium | construct | unaligned | 18 | 33 | 1 | B1+B2 |
| Ankheg | Large | monstrosity | unaligned | 14 | 39 | 2 | B1+B2 |
| Ankylosaurus | Huge | beast | unaligned | 15 | 68 | 3 | B1 |
| Ape | Medium | beast | unaligned | 12 | 19 | 1/2 | B1+B2 |
| Archmage | Medium | humanoid (any race) | any alignment | 12 | 99 | 12 | B1+B2 |
| Assassin | Medium | humanoid (any race) | any non-good alignment | 15 | 78 | 8 | B1+B2 |
| Awakened Shrub | Small | plant | unaligned | 9 | 10 | 0 | B1+B2 |
| Awakened Tree | Huge | plant | unaligned | 13 | 59 | 2 | B1+B2 |
| Axe Beak | Large | beast | unaligned | 11 | 19 | 1/4 | B1+B2 |
| Azer | Medium | elemental | lawful neutral | 17 | 39 | 2 | B1+B2 |
| Baboon | Small | beast | unaligned | 12 | 3 | 0 | B1+B2 |
| Badger | Tiny | beast | unaligned | 10 | 3 | 0 | B1+B2 |
| Balor | Huge | fiend (demon) | chaotic evil | 19 | 262 | 19 | B1+B2 |
| Bandit | Medium | humanoid (any race) | any non-lawful alignment | 12 | 11 | 1/8 | B1+B2 |
| Bandit Captain | Medium | humanoid (any race) | any non-lawful alignment | 15 | 65 | 2 | B1+B2 |
| Banshee | Medium | undead | chaotic evil | 12 | 58 | 4 | B1 |
| Barbed Devil | Medium | fiend (devil) | lawful evil | 15 | 110 | 5 | B1+B2 |
| Barlgura | Large | fiend (demon) | chaotic evil | 15 | 68 | 5 | B1 |
| Basilisk | Medium | monstrosity | unaligned | 15 | 52 | 3 | B1+B2 |
| Bat | Tiny | beast | unaligned | 12 | 1 | 0 | B1+B2 |
| Bearded Devil | Medium | fiend (devil) | lawful evil | 13 | 52 | 3 | B1+B2 |
| Behir | Huge | monstrosity | neutral evil | 17 | 168 | 11 | B1+B2 |
| Berserker | Medium | humanoid (any race) | any chaotic alignment | 13 | 67 | 2 | B1+B2 |
| Black Bear | Medium | beast | unaligned | 11 | 19 | 1/2 | B1+B2 |
| Black Dragon Wyrmling | Medium | dragon | chaotic evil | 17 | 33 | 2 | B1+B2 |
| Black Earth Priest | Medium | humanoid (human) | neutral evil | 17 | 45 | 3 | B1 |
| Black Pudding | Large | ooze | unaligned | 7 | 85 | 4 | B1+B2 |
| Blink Dog | Medium | fey | lawful good | 13 | 22 | 1/4 | B1+B2 |
| Blood Hawk | Small | beast | unaligned | 12 | 7 | 1/8 | B1+B2 |
| Blue Dragon Wyrmling | Medium | dragon | lawful evil | 17 | 52 | 3 | B1+B2 |
| Boar | Medium | beast | unaligned | 11 | 11 | 1/4 | B1+B2 |
| Bone Devil | Large | fiend (devil) | lawful evil | 19 | 142 | 12 | B1+B2 |
| Brass Dragon Wyrmling | Medium | dragon | chaotic good | 16 | 16 | 1 | B1+B2 |
| Bronze Dragon Wyrmling | Medium | dragon | lawful good | 17 | 32 | 2 | B1+B2 |
| Brown Bear | Large | beast | unaligned | 11 | 34 | 1 | B1+B2 |
| Bugbear | Medium | humanoid (goblinoid) | chaotic evil | 16 | 27 | 1 | B1+B2 |
| Bulette | Large | monstrosity | unaligned | 17 | 94 | 5 | B1+B2 |
| Bullywug | Medium | humanoid (bullywug) | neutral evil | 15 | 11 | 1/4 | B1 |
| Camel | Large | beast | unaligned | 9 | 15 | 1/8 | B1+B2 |
| Carrion Crawler | Large | monstrosity | unaligned | 13 | 51 | 2 | B2 |
| Cat | Tiny | beast | unaligned | 12 | 2 | 0 | B1+B2 |
| Cave Bear | Large | beast | unaligned | 12 | 42 | 2 | B2 |
| Centaur | Large | monstrosity | neutral good | 12 | 45 | 2 | B1+B2 |
| Chain Devil | Medium | fiend (devil) | lawful evil | 16 | 85 | 11 | B1+B2 |
| Chimera | Large | monstrosity | chaotic evil | 14 | 114 | 6 | B1+B2 |
| Chuul | Large | aberration | chaotic evil | 16 | 93 | 4 | B1+B2 |
| Clay Golem | Large | construct | unaligned | 14 | 133 | 9 | B1+B2 |
| Cloaker | Large | aberration | chaotic neutral | 14 | 78 | 8 | B1+B2 |
| Cloud Giant | Huge | giant | neutral good | 14 | 200 | 9 | B1+B2 |
| Cockatrice | Small | monstrosity | unaligned | 11 | 27 | 1/2 | B1+B2 |
| Commoner | Medium | humanoid (any race) | any alignment | 10 | 4 | 0 | B1+B2 |
| Constrictor Snake | Large | beast | unaligned | 12 | 13 | 1/4 | B1+B2 |
| Copper Dragon Wyrmling | Medium | dragon | chaotic good | 16 | 22 | 1 | B1+B2 |
| Couatl | Medium | celestial | lawful good | 19 | 97 | 4 | B1+B2 |
| Crab | Tiny | beast | unaligned | 11 | 2 | 0 | B1+B2 |
| Crawling Claw | Tiny | undead | neutral evil | 12 | 2 | 0 | B1 |
| Crocodile | Large | beast | unaligned | 12 | 19 | 1/2 | B1+B2 |
| Crushing Wave Priest | Medium | humanoid (human) | neutral evil | 13 | 52 | 2 | B1 |
| Crushing Wave Reaver | Medium | humanoid (human) | neutral evil | 14 | 22 | 1/2 | B1 |
| Cult Fanatic | Medium | humanoid (any race) | any non-good alignment | 13 | 33 | 2 | B1+B2 |
| Cultist | Medium | humanoid (any race) | any non-good alignment | 12 | 9 | 1/8 | B1+B2 |
| Cyclops | Huge | giant | chaotic neutral | 14 | 138 | 6 | B1 |
| Dao | Large | elemental | neutral evil | 18 | 187 | 11 | B1 |
| Darkmantle | Small | monstrosity | unaligned | 11 | 22 | 1/2 | B1+B2 |
| Death Dog | Medium | monstrosity | neutral evil | 12 | 39 | 1 | B1+B2 |
| Deep Gnome (Svirfneblin) | Small | humanoid (gnome) | neutral good | 15 | 16 | 1/2 | B1+B2 |
| Deer | Medium | beast | unaligned | 13 | 4 | 0 | B1+B2 |
| Deva | Medium | celestial | lawful good | 17 | 136 | 10 | B1+B2 |
| Dire Wolf | Large | beast | unaligned | 14 | 37 | 1 | B1+B2 |
| Djinni | Large | elemental | chaotic good | 17 | 161 | 11 | B1+B2 |
| Doppelganger | Medium | monstrosity (shapechanger) | neutral | 14 | 52 | 3 | B1+B2 |
| Draft Horse | Large | beast | unaligned | 10 | 19 | 1/4 | B1+B2 |
| Dragon Turtle | Gargantuan | dragon | neutral | 20 | 341 | 17 | B1+B2 |
| Dretch | Small | fiend (demon) | chaotic evil | 11 | 18 | 1/4 | B1+B2 |
| Drider | Large | monstrosity | chaotic evil | 19 | 123 | 6 | B1+B2 |
| Drow | Medium | humanoid (elf) | neutral evil | 15 | 13 | 1/4 | B1+B2 |
| Drow Mage | Medium | humanoid (elf) | neutral evil | 12 | 45 | 7 | B1 |
| Druid | Medium | humanoid (any race) | any alignment | 11 | 27 | 2 | B1+B2 |
| Dryad | Medium | fey | neutral | 11 | 22 | 1 | B1+B2 |
| Duergar | Medium | humanoid (dwarf) | lawful evil | 16 | 26 | 1 | B1+B2 |
| Dust Mephit | Small | elemental | neutral evil | 12 | 17 | 1/2 | B1+B2 |
| Eagle | Small | beast | unaligned | 12 | 3 | 0 | B1+B2 |
| Earth Elemental | Large | elemental | neutral | 17 | 126 | 5 | B1+B2 |
| Efreeti | Large | elemental | lawful evil | 17 | 200 | 11 | B1+B2 |
| Elephant | Huge | beast | unaligned | 12 | 76 | 4 | B1+B2 |
| Elk | Large | beast | unaligned | 10 | 13 | 1/4 | B1+B2 |
| Erinyes | Medium | fiend (devil) | lawful evil | 18 | 153 | 12 | B1+B2 |
| Ettercap | Medium | monstrosity | neutral evil | 13 | 44 | 2 | B1+B2 |
| Ettin | Large | giant | chaotic evil | 12 | 85 | 4 | B1+B2 |
| Fathomer | Medium | humanoid (human) | neutral evil | 10 | 52 | 2 | B1 |
| Feathergale Knight | Medium | humanoid (human) | lawful evil | 16 | 33 | 1 | B1 |
| Fire Elemental | Large | elemental | neutral | 13 | 102 | 5 | B1+B2 |
| Fire Giant | Huge | giant | lawful evil | 18 | 162 | 9 | B1+B2 |
| Fire Snake | Medium | elemental | neutral evil | 14 | 22 | 1 | B1 |
| Flameskull | Tiny | undead | neutral evil | 13 | 40 | 4 | B1 |
| Flesh Golem | Medium | construct | neutral | 9 | 93 | 5 | B1+B2 |
| Flying Snake | Tiny | beast | unaligned | 14 | 5 | 1/8 | B1+B2 |
| Flying Sword | Small | construct | unaligned | 17 | 17 | 1/4 | B1+B2 |
| Frog | Tiny | beast | unaligned | 11 | 1 | 0 | B1+B2 |
| Frost Giant | Huge | giant | neutral evil | 15 | 138 | 8 | B1+B2 |
| Galeb Duhr | Medium | elemental | neutral | 16 | 85 | 6 | B1 |
| Gargoyle | Medium | elemental | chaotic evil | 15 | 52 | 2 | B1+B2 |
| Gelatinous Cube | Large | ooze | unaligned | 6 | 84 | 2 | B1+B2 |
| Ghast | Medium | undead | chaotic evil | 13 | 36 | 2 | B1+B2 |
| Ghost | Medium | undead | any alignment | 11 | 45 | 4 | B1+B2 |
| Ghoul | Medium | undead | chaotic evil | 12 | 22 | 1 | B1+B2 |
| Giant Ape | Huge | beast | unaligned | 12 | 157 | 7 | B1+B2 |
| Giant Badger | Medium | beast | unaligned | 10 | 13 | 1/4 | B1+B2 |
| Giant Bat | Large | beast | unaligned | 13 | 22 | 1/4 | B1+B2 |
| Giant Boar | Large | beast | unaligned | 12 | 42 | 2 | B1+B2 |
| Giant Centipede | Small | beast | unaligned | 13 | 4 | 1/4 | B1+B2 |
| Giant Constrictor Snake | Huge | beast | unaligned | 12 | 60 | 2 | B1+B2 |
| Giant Crab | Medium | beast | unaligned | 15 | 13 | 1/8 | B1+B2 |
| Giant Crocodile | Huge | beast | unaligned | 14 | 85 | 5 | B1+B2 |
| Giant Eagle | Large | beast | neutral good | 13 | 26 | 1 | B1+B2 |
| Giant Elk | Huge | beast | unaligned | 14 | 42 | 2 | B1+B2 |
| Giant Fire Beetle | Small | beast | unaligned | 13 | 4 | 0 | B1+B2 |
| Giant Frog | Medium | beast | unaligned | 11 | 18 | 1/4 | B1+B2 |
| Giant Goat | Large | beast | unaligned | 11 | 19 | 1/2 | B1+B2 |
| Giant Hyena | Large | beast | unaligned | 12 | 45 | 1 | B1+B2 |
| Giant Lizard | Large | beast | unaligned | 12 | 19 | 1/4 | B1+B2 |
| Giant Octopus | Large | beast | unaligned | 11 | 52 | 1 | B1+B2 |
| Giant Owl | Large | beast | neutral | 12 | 19 | 1/4 | B1+B2 |
| Giant Poisonous Snake | Medium | beast | unaligned | 14 | 11 | 1/4 | B1+B2 |
| Giant Rat | Small | beast | unaligned | 12 | 7 | 1/8 | B1+B2 |
| Giant Rat (Diseased) | Small | beast | unaligned | 12 | 7 | 1/8 | B1+B2 |
| Giant Scorpion | Large | beast | unaligned | 15 | 52 | 3 | B1+B2 |
| Giant Sea Horse | Large | beast | unaligned | 13 | 16 | 1/2 | B1+B2 |
| Giant Shark | Huge | beast | unaligned | 13 | 126 | 5 | B1+B2 |
| Giant Spider | Large | beast | unaligned | 14 | 26 | 1 | B1+B2 |
| Giant Toad | Large | beast | unaligned | 11 | 39 | 1 | B1+B2 |
| Giant Vulture | Large | beast | neutral evil | 10 | 22 | 1 | B1+B2 |
| Giant Wasp | Medium | beast | unaligned | 12 | 13 | 1/2 | B1+B2 |
| Giant Weasel | Medium | beast | unaligned | 13 | 9 | 1/8 | B1+B2 |
| Giant Wolf Spider | Medium | beast | unaligned | 13 | 11 | 1/4 | B1+B2 |
| Gibbering Mouther | Medium | aberration | neutral | 9 | 67 | 2 | B1+B2 |
| Glabrezu | Large | fiend (demon) | chaotic evil | 17 | 157 | 9 | B1+B2 |
| Gladiator | Medium | humanoid (any race) | any alignment | 16 | 112 | 5 | B1+B2 |
| Gnoll | Medium | humanoid (gnoll) | chaotic evil | 15 | 22 | 1/2 | B1+B2 |
| Gnoll Pack Lord | Medium | humanoid (gnoll) | chaotic evil | 15 | 49 | 2 | B1 |
| Goat | Medium | beast | unaligned | 10 | 4 | 0 | B1+B2 |
| Goblin | Small | humanoid (goblinoid) | neutral evil | 15 | 7 | 1/4 | B1+B2 |
| Gold Dragon Wyrmling | Medium | dragon | lawful good | 17 | 60 | 3 | B1+B2 |
| Gorgon | Large | monstrosity | unaligned | 19 | 114 | 5 | B1+B2 |
| Gray Ooze | Medium | ooze | unaligned | 8 | 22 | 1/2 | B1+B2 |
| Green Dragon Wyrmling | Medium | dragon | lawful evil | 17 | 38 | 2 | B1+B2 |
| Green Hag | Medium | fey | neutral evil | 17 | 82 | 3 | B1+B2 |
| Grell | Medium | aberration | neutral evil | 12 | 55 | 3 | B1 |
| Grick | Medium | monstrosity | neutral | 14 | 27 | 2 | B1+B2 |
| Griffon | Large | monstrosity | unaligned | 12 | 59 | 2 | B1+B2 |
| Grimlock | Medium | humanoid (grimlock) | neutral evil | 11 | 11 | 1/4 | B1+B2 |
| Guard | Medium | humanoid (any race) | any alignment | 16 | 11 | 1/8 | B1+B2 |
| Guardian Naga | Large | monstrosity | lawful good | 18 | 127 | 10 | B1+B2 |
| Gynosphinx | Large | monstrosity | lawful neutral | 17 | 136 | 11 | B1+B2 |
| Half-Ogre | Large | giant | any chaotic alignment | 12 | 30 | 1 | B1 |
| Half-Red Dragon Veteran | Medium | humanoid (human) | any alignment | 18 | 65 | 5 | B1+B2 |
| Harpy | Medium | monstrosity | chaotic evil | 11 | 38 | 1 | B1+B2 |
| Hawk | Tiny | beast | unaligned | 13 | 1 | 0 | B1+B2 |
| Hell Hound | Medium | fiend | lawful evil | 15 | 45 | 3 | B1+B2 |
| Helmed Horror | Medium | construct | neutral | 20 | 60 | 4 | B1 |
| Hezrou | Large | fiend (demon) | chaotic evil | 16 | 136 | 8 | B1+B2 |
| Hill Giant | Huge | giant | chaotic evil | 13 | 105 | 5 | B1+B2 |
| Hippogriff | Large | monstrosity | unaligned | 11 | 19 | 1 | B1+B2 |
| Hobgoblin | Medium | humanoid (goblinoid) | lawful evil | 18 | 11 | 1/2 | B1+B2 |
| Hobgoblin Captain | Medium | humanoid (goblinoid) | lawful evil | 17 | 39 | 3 | B1 |
| Homunculus | Tiny | construct | neutral | 13 | 5 | 0 | B1+B2 |
| Hook Horror | Large | monstrosity | neutral | 15 | 75 | 3 | B1 |
| Horned Devil | Large | fiend (devil) | lawful evil | 18 | 148 | 11 | B1+B2 |
| Howling Hatred Initiate | Medium | humanoid (human) | neutral evil | 13 | 9 | 1/8 | B1 |
| Hunter Shark | Large | beast | unaligned | 12 | 45 | 2 | B1+B2 |
| Hurricane | Medium | humanoid (human) | lawful evil | 14 | 33 | 2 | B1 |
| Hydra | Huge | monstrosity | unaligned | 15 | 172 | 8 | B1+B2 |
| Hyena | Medium | beast | unaligned | 11 | 5 | 0 | B1+B2 |
| Ice Devil | Large | fiend (devil) | lawful evil | 18 | 180 | 14 | B1+B2 |
| Ice Mephit | Small | elemental | neutral evil | 11 | 21 | 1/2 | B1+B2 |
| Imp | Tiny | fiend (devil, shapechanger) | lawful evil | 13 | 10 | 1 | B1+B2 |
| Invisible Stalker | Medium | elemental | neutral | 14 | 104 | 6 | B1+B2 |
| Iron Golem | Large | construct | unaligned | 20 | 210 | 16 | B1+B2 |
| Jackal | Small | beast | unaligned | 12 | 3 | 0 | B1+B2 |
| Jackalwere | Medium | humanoid (shapechanger) | chaotic evil | 12 | 18 | 1/2 | B1 |
| Kenku | Medium | humanoid (kenku) | chaotic neutral | 13 | 13 | 1/4 | B1 |
| Killer Whale | Huge | beast | unaligned | 12 | 90 | 3 | B1+B2 |
| Knight | Medium | humanoid (any race) | any alignment | 18 | 52 | 3 | B1+B2 |
| Kobold | Small | humanoid (kobold) | lawful evil | 12 | 5 | 1/8 | B1+B2 |
| Kraken | Gargantuan | monstrosity (titan) | chaotic evil | 18 | 472 | 23 | B1+B2 |
| Kuo-toa | Medium | humanoid (kuo-toa) | neutral evil | 13 | 18 | 1/4 | B1 |
| Kuo-toa Archpriest | Medium | humanoid (kuo-toa) | neutral evil | 13 | 97 | 6 | B1 |
| Kuo-toa Monitor | Medium | humanoid (kuo-toa) | neutral evil | 13 | 65 | 3 | B1 |
| Kuo-toa Whip | Medium | humanoid (kuo-toa) | neutral evil | 11 | 65 | 1 | B1 |
| Lamia | Large | monstrosity | chaotic evil | 13 | 97 | 4 | B1+B2 |
| Lemure | Medium | fiend (devil) | lawful evil | 7 | 13 | 0 | B1+B2 |
| Lich | Medium | undead | any evil | 17 | 135 | 21 | B1+B2 |
| Lion | Large | beast | unaligned | 12 | 26 | 1 | B1+B2 |
| Lizard | Tiny | beast | unaligned | 10 | 2 | 0 | B1+B2 |
| Lizard King/Queen | Medium | humanoid (lizardfolk) | chaotic evil | 15 | 78 | 4 | B1 |
| Lizardfolk | Medium | humanoid (lizardfolk) | neutral | 15 | 22 | 1/2 | B1+B2 |
| Lizardfolk Shaman | Medium | humanoid (lizardfolk) | neutral | 13 | 27 | 2 | B1 |
| Mage | Medium | humanoid (any race) | any alignment | 12 | 40 | 6 | B1+B2 |
| Magma Mephit | Small | elemental | neutral evil | 11 | 22 | 1/2 | B1+B2 |
| Magmin | Small | elemental | chaotic neutral | 14 | 9 | 1/2 | B1+B2 |
| Mammoth | Huge | beast | unaligned | 13 | 126 | 6 | B1+B2 |
| Manticore | Large | monstrosity | lawful evil | 14 | 68 | 3 | B1+B2 |
| Marilith | Large | fiend (demon) | chaotic evil | 18 | 189 | 16 | B1+B2 |
| Mastiff | Medium | beast | unaligned | 12 | 5 | 1/8 | B1+B2 |
| Medusa | Medium | monstrosity | lawful evil | 15 | 127 | 6 | B1+B2 |
| Merfolk | Medium | humanoid (merfolk) | neutral | 11 | 11 | 1/8 | B1+B2 |
| Merrow | Large | monstrosity | chaotic evil | 13 | 45 | 2 | B1+B2 |
| Mezzoloth | Medium | fiend (yugoloth) | neutral evil | 18 | 75 | 5 | B1 |
| Mimic | Medium | monstrosity (shapechanger) | neutral | 12 | 58 | 2 | B1+B2 |
| Minotaur | Large | monstrosity | chaotic evil | 14 | 76 | 3 | B1+B2 |
| Minotaur Skeleton | Large | undead | lawful evil | 12 | 67 | 2 | B1+B2 |
| Mud Mephit | Small | elemental | neutral evil | 11 | 27 | 1/4 | B1 |
| Mule | Medium | beast | unaligned | 10 | 11 | 1/8 | B1+B2 |
| Mummy | Medium | undead | lawful evil | 11 | 58 | 3 | B1+B2 |
| Mummy Lord | Medium | undead | lawful evil | 17 | 97 | 15 | B1+B2 |
| Nalfeshnee | Large | fiend (demon) | chaotic evil | 18 | 184 | 13 | B1+B2 |
| Needle Blight | Medium | plant | neutral evil | 12 | 11 | 1/4 | B1 |
| Night Hag | Medium | fiend | neutral evil | 17 | 112 | 5 | B1+B2 |
| Nightmare | Large | fiend | neutral evil | 13 | 68 | 3 | B1+B2 |
| Noble | Medium | humanoid (any race) | any alignment | 15 | 9 | 1/8 | B1+B2 |
| Nothic | Medium | aberration | neutral evil | 15 | 45 | 2 | B1 |
| Nycaloth | Large | fiend (yugoloth) | neutral evil | 18 | 123 | 9 | B1 |
| Ochre Jelly | Large | ooze | unaligned | 8 | 45 | 2 | B1+B2 |
| Octopus | Small | beast | unaligned | 12 | 3 | 0 | B1+B2 |
| Ogre | Large | giant | chaotic evil | 11 | 59 | 2 | B1+B2 |
| Ogre Zombie | Large | undead | neutral evil | 8 | 85 | 2 | B1+B2 |
| Oni | Large | giant | lawful evil | 16 | 110 | 7 | B1+B2 |
| Orc | Medium | humanoid (orc) | chaotic evil | 13 | 15 | 1/2 | B1+B2 |
| Orc Eye of Gruumsh | Medium | humanoid (orc) | chaotic evil | 16 | 45 | 2 | B1 |
| Oreioth | Medium | humanoid (human) | chaotic evil | 11 | 39 | 2 | B1 |
| Orog | Medium | humanoid (orc) | chaotic evil | 18 | 42 | 2 | B1 |
| Otyugh | Large | aberration | neutral | 14 | 114 | 5 | B1+B2 |
| Owl | Tiny | beast | unaligned | 11 | 1 | 0 | B1+B2 |
| Owlbear | Large | monstrosity | unaligned | 13 | 59 | 3 | B1+B2 |
| Panther | Medium | beast | unaligned | 12 | 13 | 1/4 | B1+B2 |
| Pegasus | Large | celestial | chaotic good | 12 | 59 | 2 | B1+B2 |
| Peryton | Medium | monstrosity | chaotic evil | 13 | 33 | 2 | B1 |
| Phase Spider | Large | monstrosity | unaligned | 13 | 32 | 3 | B1+B2 |
| Piercer | Medium | monstrosity | unaligned | 15 | 22 | 1/2 | B1 |
| Pit Fiend | Large | fiend (devil) | lawful evil | 19 | 300 | 20 | B1+B2 |
| Planetar | Large | celestial | lawful good | 19 | 200 | 16 | B1+B2 |
| Plesiosaurus | Large | beast | unaligned | 13 | 68 | 2 | B1+B2 |
| Poisonous Snake | Tiny | beast | unaligned | 13 | 2 | 1/8 | B1+B2 |
| Polar Bear | Large | beast | unaligned | 12 | 42 | 2 | B1+B2 |
| Pony | Medium | beast | unaligned | 10 | 11 | 1/8 | B1+B2 |
| Priest | Medium | humanoid (any race) | any alignment | 13 | 27 | 2 | B1+B2 |
| Pseudodragon | Tiny | dragon | neutral good | 13 | 7 | 1/4 | B1+B2 |
| Pteranodon | Medium | beast | unaligned | 13 | 13 | 1/4 | B1 |
| Purple Worm | Gargantuan | monstrosity | unaligned | 18 | 247 | 15 | B1+B2 |
| Quasit | Tiny | fiend (demon, shapechanger) | chaotic evil | 13 | 7 | 1 | B1+B2 |
| Quipper | Tiny | beast | unaligned | 13 | 1 | 0 | B1+B2 |
| Rakshasa | Medium | fiend | lawful evil | 16 | 110 | 13 | B1+B2 |
| Rat | Tiny | beast | unaligned | 10 | 1 | 0 | B1+B2 |
| Raven | Tiny | beast | unaligned | 12 | 1 | 0 | B1+B2 |
| Red Dragon Wyrmling | Medium | dragon | chaotic evil | 17 | 75 | 4 | B1+B2 |
| Reef Shark | Medium | beast | unaligned | 12 | 22 | 1/2 | B1+B2 |
| Remorhaz | Huge | monstrosity | unaligned | 17 | 195 | 11 | B1+B2 |
| Revenant | Medium | undead | neutral | 13 | 136 | 5 | B1 |
| Rhinoceros | Large | beast | unaligned | 11 | 45 | 2 | B1+B2 |
| Riding Horse | Large | beast | unaligned | 10 | 13 | 1/4 | B1+B2 |
| Roc | Gargantuan | monstrosity | unaligned | 15 | 248 | 11 | B1+B2 |
| Roper | Large | monstrosity | neutral evil | 20 | 93 | 5 | B1+B2 |
| Rug of Smothering | Large | construct | unaligned | 12 | 33 | 2 | B1+B2 |
| Rust Monster | Medium | monstrosity | unaligned | 14 | 27 | 1/2 | B1+B2 |
| Saber-Toothed Tiger | Large | beast | unaligned | 12 | 52 | 2 | B1+B2 |
| Sahuagin | Medium | humanoid (sahuagin) | lawful evil | 12 | 22 | 1/2 | B1+B2 |
| Salamander | Large | elemental | neutral evil | 15 | 90 | 5 | B1+B2 |
| Satyr | Medium | fey | chaotic neutral | 14 | 31 | 1/2 | B1+B2 |
| Scorpion | Tiny | beast | unaligned | 11 | 1 | 0 | B1+B2 |
| Scout | Medium | humanoid (any race) | any alignment | 13 | 16 | 1/2 | B1+B2 |
| Sea Hag | Medium | fey | chaotic evil | 14 | 52 | 2 | B1+B2 |
| Sea Horse | Tiny | beast | unaligned | 11 | 1 | 0 | B1+B2 |
| Shadow | Medium | undead | chaotic evil | 12 | 16 | 1/2 | B1+B2 |
| Shadow Demon | Medium | fiend (demon) | chaotic evil | 13 | 66 | 4 | B1 |
| Shambling Mound | Large | plant | unaligned | 15 | 136 | 5 | B1+B2 |
| Shield Guardian | Large | construct | unaligned | 17 | 142 | 7 | B1+B2 |
| Shoalar Quanderil | Medium | humanoid (water genasi) | lawful evil | 10 | 60 | 4 | B1 |
| Shrieker | Medium | plant | unaligned | 5 | 13 | 0 | B1+B2 |
| Silver Dragon Wyrmling | Medium | dragon | lawful good | 17 | 45 | 2 | B1+B2 |
| Skeleton | Medium | undead | lawful evil | 13 | 13 | 1/4 | B1+B2 |
| Skyweaver | Medium | humanoid (human) | chaotic evil | 12 | 44 | 3 | B1 |
| Smoke Mephit | Small | elemental | neutral evil | 12 | 22 | 1/4 | B1 |
| Solar | Large | celestial | lawful good | 21 | 243 | 21 | B1+B2 |
| Specter | Medium | undead | chaotic evil | 12 | 22 | 1 | B1+B2 |
| Spider | Tiny | beast | unaligned | 12 | 1 | 0 | B1+B2 |
| Spirit Naga | Large | monstrosity | chaotic evil | 15 | 75 | 8 | B1+B2 |
| Sprite | Tiny | fey | neutral good | 15 | 2 | 1/4 | B1+B2 |
| Spy | Medium | humanoid (any race) | any alignment | 12 | 27 | 1 | B1+B2 |
| Steam Mephit | Small | elemental | neutral evil | 10 | 21 | 1/4 | B1+B2 |
| Stirge | Tiny | beast | unaligned | 14 | 2 | 1/8 | B1+B2 |
| Stone Giant | Huge | giant | neutral | 17 | 126 | 7 | B1+B2 |
| Stone Golem | Large | construct | unaligned | 17 | 178 | 10 | B1+B2 |
| Storm Giant | Huge | giant | chaotic good | 16 | 230 | 13 | B1+B2 |
| Succubus/Incubus | Medium | fiend (shapechanger) | neutral evil | 15 | 66 | 4 | B1+B2 |
| Swarm of Bats | Medium | swarm (Tiny beasts) | unaligned | 12 | 22 | 1/4 | B1+B2 |
| Swarm of Beetles | Medium | swarm (Tiny beasts) | unaligned | 12 | 22 | 1/2 | B1+B2 |
| Swarm of Centipedes | Medium | swarm (Tiny beasts) | unaligned | 12 | 22 | 1/2 | B1+B2 |
| Swarm of Insects | Medium | swarm (Tiny beasts) | unaligned | 12 | 22 | 1/2 | B1+B2 |
| Swarm of Poisonous Snakes | Medium | swarm (Tiny beasts) | unaligned | 14 | 36 | 2 | B1+B2 |
| Swarm of Quippers | Medium | swarm (Tiny beasts) | unaligned | 13 | 28 | 1 | B1+B2 |
| Swarm of Rats | Medium | swarm (Tiny beasts) | unaligned | 10 | 24 | 1/4 | B1+B2 |
| Swarm of Ravens | Medium | swarm (Tiny beasts) | unaligned | 12 | 24 | 1/4 | B1+B2 |
| Swarm of Spiders | Medium | swarm (Tiny beasts) | unaligned | 12 | 22 | 1/2 | B1+B2 |
| Swarm of Wasps | Medium | swarm (Tiny beasts) | unaligned | 12 | 22 | 1/2 | B1+B2 |
| Tarrasque | Gargantuan | monstrosity (titan) | unaligned | 25 | 676 | 30 | B1+B2 |
| Thug | Medium | humanoid (any race) | any non-good alignment | 11 | 32 | 1/2 | B1+B2 |
| Thurl Merosska | Medium | humanoid (human) | lawful evil | 16 | 71 | 3 | B1 |
| Tiger | Large | beast | unaligned | 12 | 37 | 1 | B1+B2 |
| Treant | Huge | plant | chaotic good | 16 | 138 | 9 | B1+B2 |
| Tribal Warrior | Medium | humanoid (any race) | any alignment | 12 | 11 | 1/8 | B1+B2 |
| Triceratops | Huge | beast | unaligned | 13 | 95 | 5 | B1+B2 |
| Troglodyte | Medium | humanoid (troglodyte) | chaotic evil | 11 | 13 | 1/4 | B1 |
| Troll | Large | giant | chaotic evil | 15 | 84 | 5 | B1+B2 |
| Twig Blight | Small | plant | neutral evil | 13 | 4 | 1/8 | B1 |
| Tyrannosaurus Rex | Huge | beast | unaligned | 13 | 136 | 8 | B1+B2 |
| Umber Hulk | Large | monstrosity | chaotic evil | 18 | 93 | 5 | B1 |
| Unicorn | Large | celestial | lawful good | 12 | 67 | 5 | B1+B2 |
| Vampire | Medium | undead (shapechanger) | lawful evil | 16 | 144 | 13 | B1+B2 |
| Vampire Spawn | Medium | undead | neutral evil | 15 | 82 | 5 | B1+B2 |
| Veteran | Medium | humanoid (any race) | any alignment | 17 | 58 | 3 | B1+B2 |
| Vine Blight | Medium | plant | neutral evil | 12 | 26 | 1/2 | B1 |
| Violet Fungus | Medium | plant | unaligned | 5 | 18 | 1/4 | B1+B2 |
| Vrock | Large | fiend (demon) | chaotic evil | 15 | 104 | 6 | B1+B2 |
| Vulture | Medium | beast | unaligned | 10 | 5 | 0 | B1+B2 |
| Warhorse | Large | beast | unaligned | 11 | 19 | 1/2 | B1+B2 |
| Warhorse Skeleton | Large | undead | lawful evil | 13 | 22 | 1/2 | B1+B2 |
| Water Elemental | Large | elemental | neutral | 14 | 114 | 5 | B1+B2 |
| Water Weird | Large | elemental | neutral | 13 | 58 | 3 | B1 |
| Weasel | Tiny | beast | unaligned | 13 | 1 | 0 | B1+B2 |
| Werebear | Medium | humanoid (human, shapechanger) | neutral good | 10 | 135 | 5 | B1+B2 |
| Wereboar | Medium | humanoid (human, shapechanger) | neutral evil | 10 | 78 | 4 | B1+B2 |
| Wererat | Medium | humanoid (human, shapechanger) | lawful evil | 12 | 33 | 2 | B1+B2 |
| Weretiger | Medium | humanoid (human, shapechanger) | neutral | 12 | 120 | 4 | B1+B2 |
| Werewolf | Medium | humanoid (human, shapechanger) | chaotic evil | 11 | 58 | 3 | B1+B2 |
| White Dragon Wyrmling | Medium | dragon | chaotic evil | 16 | 32 | 2 | B1+B2 |
| Wight | Medium | undead | neutral evil | 14 | 45 | 3 | B1+B2 |
| Will-o'-Wisp | Tiny | undead | chaotic evil | 19 | 22 | 2 | B1+B2 |
| Winged Kobold | Small | humanoid (kobold) | lawful evil | 13 | 7 | 1/4 | B1 |
| Winter Wolf | Large | monstrosity | neutral evil | 13 | 75 | 3 | B1+B2 |
| Wolf | Medium | beast | unaligned | 13 | 11 | 1/4 | B1+B2 |
| Worg | Large | monstrosity | neutral evil | 13 | 26 | 1/2 | B1+B2 |
| Wraith | Medium | undead | neutral evil | 13 | 67 | 5 | B1+B2 |
| Wyvern | Large | dragon | unaligned | 13 | 110 | 6 | B1+B2 |
| Xorn | Medium | elemental | neutral | 19 | 73 | 5 | B1+B2 |
| Yeti | Large | monstrosity | chaotic evil | 12 | 51 | 3 | B1 |
| Young Black Dragon | Large | dragon | chaotic evil | 18 | 127 | 7 | B1+B2 |
| Young Blue Dragon | Large | dragon | lawful evil | 18 | 152 | 9 | B1+B2 |
| Young Brass Dragon | Large | dragon | chaotic good | 17 | 110 | 6 | B1+B2 |
| Young Bronze Dragon | Large | dragon | lawful good | 18 | 142 | 8 | B1+B2 |
| Young Copper Dragon | Large | dragon | chaotic good | 17 | 119 | 7 | B1+B2 |
| Young Gold Dragon | Large | dragon | lawful good | 18 | 178 | 10 | B1+B2 |
| Young Green Dragon | Large | dragon | lawful evil | 18 | 136 | 8 | B1+B2 |
| Young Red Dragon | Large | dragon | chaotic evil | 18 | 178 | 10 | B1+B2 |
| Young Silver Dragon | Large | dragon | lawful good | 18 | 168 | 9 | B1+B2 |
| Young White Dragon | Large | dragon | chaotic evil | 17 | 133 | 6 | B1+B2 |
| Yuan-ti Abomination | Large | monstrosity (shapechanger, yuan-ti) | neutral evil | 15 | 127 | 7 | B1 |
| Yuan-ti Malison | Medium | monstrosity (shapechanger, yuan-ti) | neutral evil | 12 | 66 | 3 | B1 |
| Yuan-ti Pureblood | Medium | humanoid (yuan-ti) | neutral evil | 11 | 40 | 1 | B1 |
| Zombie | Medium | undead | neutral evil | 8 | 22 | 1/4 | B1+B2 |

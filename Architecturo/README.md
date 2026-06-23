# Architecturo

Constructeur visuel d'**architectures d'intégration**, avec deux niveaux de lecture
liés par un **drill-down** animé :

- **Vue globale (macro)** — systèmes & intégrations de haut niveau.
- **Vue détaillée** — les composants qui *réalisent* une intégration et leurs
  relations (REST Message, Scripted REST, Business Rule, Transform Map, MID Server…).

Pensé d'abord pour les architectures **ServiceNow**, mais le modèle est générique
(toutes plateformes). Tout fonctionne **côté navigateur** : aucun serveur requis.

![niveaux](https://img.shields.io/badge/vues-macro%20→%20détail-6366f1) ![offline](https://img.shields.io/badge/offline-first-34d399)

---

## ⚡ Installation rapide

**Prérequis :** [Node.js](https://nodejs.org) ≥ 18 (testé sur Node 24) et npm.

```bash
# 1. Se placer dans le dossier du projet
cd Architecturo

# 2. Installer les dépendances
npm install

# 3. Lancer en mode développement
npm run dev
```

➡️ L'application s'ouvre sur **http://localhost:5180**.

### Autres commandes

| Commande            | Effet                                             |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Serveur de développement (rechargement à chaud)   |
| `npm run build`     | Build de production (`tsc` + Vite) dans `dist/`   |
| `npm run preview`   | Sert le build de production en local              |
| `npm run typecheck` | Vérifie uniquement les types TypeScript           |

---

## 🚀 Prise en main (2 minutes)

À la première ouverture, vous arrivez sur le **tableau de bord** listant vos schémas.

1. **Ouvrir l'exemple** ou cliquer sur **« Démo animée »** pour voir la plongée
   macro → intégration → composants en animation.
2. **Ajouter une forme** : la palette de gauche propose **trois formes** —
   **Objet** (carte), **Intégration** (hexagone, forme distincte) et **Zone** (cadre
   de regroupement). Glissez-la sur le canvas, ou cliquez dessus.
3. **Personnaliser un objet** (style Excalidraw) : cliquez dessus → le panneau de
   droite permet de changer son **nom**, sa **couleur**, son **icône** (large choix),
   sa description et ses propriétés. **Redimensionnez** un bloc en tirant ses poignées
   (visibles quand il est sélectionné).
4. **Relier deux objets** : survolez un objet (4 points de connexion apparaissent),
   puis tirez vers un autre — dans n'importe quel sens. On peut **rebrancher** un
   lien existant en glissant son extrémité. Les liens sont **flottants** : ils se
   replacent tout seuls du bon côté quand vous déplacez un bloc.
5. **Régler un lien** : cliquez dessus → sens (unique →, bidirectionnel ↔, sans flèche)
   et libellé.
6. **Plonger (dive deep)** : double-cliquez sur un objet pour ouvrir/créer sa
   **vue détaillée**. Un **mini-aperçu** du sous-schéma s'affiche sur l'objet
   encapsulé. Le fil d'Ariane en haut permet de remonter.
   Le bouton **« Tout déplier »** ouvre une **vue d'ensemble** (lecture seule) qui
   affiche d'un coup tous les niveaux imbriqués.
7. **Regrouper** : posez une **Zone** (redimensionnable) derrière des objets pour
   matérialiser une DMZ, un scope, un datacenter…
8. **Réorganiser / Dupliquer** : bouton *Réorganiser* (agencement automatique) ;
   `Ctrl/⌘+D` duplique l'objet sélectionné.
9. **Santé du schéma** : la pastille en haut signale objets isolés, vues vides,
   liens cassés et noms en double — un clic vous y amène.
10. **Rechercher** : champ en haut (ou `Ctrl/⌘+K`) — retrouve un objet dans **tous
    les niveaux**, saute à sa vue et le centre.
11. **Agent** : décrivez une intégration en langage naturel, il génère les composants.
12. **Présenter / Exporter** : *Présenter* masque les panneaux (`Échap` pour sortir) ;
    *Exporter* → **JSON**, **PNG** ou **SVG**.
13. **Annuler / Refaire** : barre d'outils ou `Ctrl/⌘+Z` et `Ctrl/⌘+Maj+Z`.
14. **Partager** : import `.json` ou lien encodé. Sauvegarde automatique (localStorage).

> Le bouton **« Aide »** dans la barre d'outils rouvre ce guide à tout moment.

---

## 🗂️ Cartographie CMDB

Architecturo se prête bien à la **cartographie CMDB** (style ServiceNow) : services
métier, services applicatifs et **CI** (Configuration Items) avec leurs dépendances.
Un exemple prêt à l'emploi — **« Cartographie CMDB — exemple »** — est dans le
tableau de bord.

**Principe.** Tout est un **Objet** (carte) ; on distingue les classes de CI par leur
**icône** et leur **couleur**, et on relie par des liens **étiquetés**. Aucune notion
de « type » figé : la nature d'un CI se lit à son apparence et à ses relations.

| Élément CMDB                       | Représentation conseillée                       |
| ---------------------------------- | ----------------------------------------------- |
| Service métier (Business Service)  | Objet · icône *immeuble* · ambre                |
| Service applicatif (App Service)   | Objet · icône *calques* · violet                |
| Serveur / Hôte                     | Objet · icône *serveur* · bleu                  |
| Load Balancer                      | Objet · icône *aiguillage* · turquoise          |
| Base de données                    | Objet · icône *base* · émeraude                 |
| Stockage (SAN)                     | Objet · icône *disque* · gris                   |

**Méthode :**

1. **Vue macro = services & dépendances.** Posez les *services métier* et les
   *services applicatifs* ; reliez-les avec des libellés de relation
   (`Dépend de`, `Se connecte à`, `Utilise`).
2. **Drill-down = les CI d'un service.** Double-cliquez sur un service applicatif
   pour ouvrir sa **vue détaillée** : ses CI (serveurs, LB, BD, stockage) et leurs
   relations techniques (`Équilibre vers`, `Hébergé sur`, `Appelle`).
3. **Zones** pour regrouper par **datacenter**, **environnement** (Prod/Préprod) ou
   **DMZ** : déposez une *Zone* derrière les CI concernés.
4. **Convention couleur/icône = classe de CI.** Gardez une couleur stable par classe ;
   la pastille **Santé** repère les CI non reliés ou les vues détaillées vides.

**Import automatique (`cmdb_rel_ci`).** Le bouton **« CMDB »** de la barre d'outils
ouvre un import dédié : collez (ou chargez) un export de la table
`cmdb_rel_ci` et le schéma se construit tout seul.

- **JSON** de l'API REST :
  `…/api/now/table/cmdb_rel_ci?sysparm_display_value=true&sysparm_fields=parent,child,type,parent.sys_class_name,child.sys_class_name`
- **CSV** avec des colonnes *parent / child / type* (+ classes optionnelles).

Chaque CI distinct devient un **Objet**, chaque relation un **lien orienté** étiqueté
par son type (`Depends on`, `Runs on`…). Si la classe (`sys_class_name`) est fournie,
l'icône et la couleur sont déduites automatiquement, puis le tout est **agencé**
en couches.

**Niveaux (drill-down) automatiques.** Par défaut (case *« Générer les niveaux »*),
l'import suit le sens **parent → enfant** : les CI racines (sans parent) forment la
**vue macro**, et chaque CI qui a des enfants ouvre sa **vue détaillée** (ses CI et
leurs relations), récursivement. Ex. : *Service applicatif* → ses serveurs / LB / BD.
Décochez la case pour tout mettre dans une seule vue à plat.

> 💡 Sans export sous la main, l'**Agent** génère une première trame.

---

## 🤖 Agent constructeur

L'agent transforme une description en schéma. Il est **configurable** (icône ⚙️
dans le panneau Agent) :

| Provider                     | Clé requise | Détail                                                |
| ---------------------------- | ----------- | ----------------------------------------------------- |
| **Heuristique locale**       | Non         | Génération par mots-clés, hors-ligne (par défaut)     |
| **Claude (Anthropic)**       | Oui         | Modèle `claude-opus-4-8`, appel direct navigateur     |
| **Compatible OpenAI**        | Oui         | OpenAI, Ollama, LM Studio… (URL de base + clé)        |

> 🔒 La clé est stockée **en local** sur votre appareil et envoyée uniquement au
> provider. Elle **n'est jamais** incluse dans l'export ou le lien de partage.
> Pour une mise en production multi-utilisateurs, passez par un proxy backend
> (la couture est déjà prévue dans `src/agent/builder.ts`).

---

## ☁️ Déploiement (Vercel)

Le projet est prêt pour Vercel (`vercel.json` fourni). Comme l'app vit dans le
sous-dossier `Architecturo/` du dépôt, indiquez-le comme **Root Directory**.

**Option A — via le tableau de bord (recommandé) :**
1. [vercel.com](https://vercel.com) → **Add New… → Project** → importer `LeaderKam/Architecturo`.
2. **Root Directory** : `Architecturo`.
3. Framework *Vite* détecté automatiquement → **Deploy**.
   Chaque `git push` redéploie ensuite tout seul.

**Option B — via le CLI :**
```bash
npm i -g vercel
cd Architecturo
vercel login
vercel --prod
```

## 🧱 Pile technique

React 18 · TypeScript · Vite · [React Flow](https://reactflow.dev) (`@xyflow/react`)
· Zustand · Tailwind CSS · lucide-react

## 📁 Structure du code

```
src/
  types.ts              modèle de données (Project, Graph, ArchNode, ArchEdge)
  store.ts              état global Zustand (navigation, CRUD, drill-down, bibliothèque)
  lib/
    nodeCatalog.ts      catalogue minimal : 2 formes (object / zone)
    icons.ts            large jeu d'icônes + couleurs sélectionnables
    autoLayout.ts       agencement automatique en couches
    validate.ts         contrôle « santé » du schéma
    cmdbImport.ts       parseur d'export cmdb_rel_ci (JSON/CSV) -> projet
    io.ts               export / import / partage
    demo.ts             visite guidée animée
  data/
    presets.ts          styles (couleur+icône) pour amorcer les exemples
    sampleProject.ts    exemple ServiceNow à 3 niveaux
    cmdbProject.ts      exemple de cartographie CMDB
  components/           Dashboard, Canvas, Toolbar, Palette, Inspector, Breadcrumb, HelpModal
  agent/                config (providers + clé) et builder (heuristique + LLM)
```

Plus de détails dans [`CLAUDE.md`](./CLAUDE.md) (carte du code) et
[`CHECKPOINTS.md`](./CHECKPOINTS.md) (revue qualité).

---

## 🗺️ Roadmap

- [x] Export image (PNG/SVG) du schéma
- [x] Annuler/refaire, recherche multi-niveaux, agencement automatique
- [x] Zones de regroupement (DMZ, scope, datacenter)
- [x] Contrôle « santé » du schéma
- [x] Import CMDB (`cmdb_rel_ci`) — JSON/CSV, stylé par classe, **niveaux drill-down** auto
- [ ] Brancher l'agent sur l'API Claude via un backend/proxy (clés côté serveur)
- [ ] Connexion directe à l'API ServiceNow (sans copier/coller l'export)
- [ ] Import depuis l'API ServiceNow (REST Messages / Scripted REST réels)
- [ ] Collaboration temps réel

# Architecturo — Règles & contexte projet

> Fichier lu à chaque session. Objectif : me donner le contexte essentiel sans
> avoir à re-scanner tout le repo → moins de tokens, plus de cohérence.

## 1. Ce qu'est le produit

**Architecturo** = constructeur visuel d'architectures d'intégration.
Deux niveaux de lecture liés par un **drill-down** :

- **Vue Macro** : systèmes & intégrations de haut niveau (ex. « Intégrations ServiceNow »).
- **Vue Détaillée** (dive deep) : composants qui *réalisent* une intégration et leurs
  relations (REST Message, Scripted REST, Business Rule, Transform Map, MID Server…).

On peut **créer, éditer, exporter, importer et partager** un schéma. Cible métier
principale : développeurs **ServiceNow** (cf. projet voisin `ai-agent-manager` qui
utilise `@servicenow/sdk`). Le modèle reste générique (autres plateformes possibles).

## 2. Stack (ne pas changer sans raison)

- React 18 + TypeScript + Vite
- **@xyflow/react** (React Flow v12) pour le canvas à nœuds — cœur du drill-down
- Zustand pour l'état global (`src/store.ts`)
- Tailwind CSS (thème sombre, voir `tailwind.config.js` + `src/index.css`)
- lucide-react (icônes), nanoid (ids)
- Tout est côté client : pas de backend. Persistance = localStorage + fichiers JSON.

## 3. Carte du code (où trouver quoi)

```
src/
  types.ts            modèle de données (Project, Graph, ArchNode, ArchEdge + EdgeDirection)
  store.ts            store Zustand : navigation, CRUD nœuds/arêtes, drill-down,
                      sélection (selectedNodeId/selectedEdgeId), applyDirection(),
                      view ('dashboard'|'editor') + library (Record<id, Project>),
                      historique undo/redo (past/future + snap() sur ops structurelles)
  lib/demo.ts         visite guidée animée (3 niveaux) via useReactFlow().fitView
  lib/exportImage.ts  export PNG/SVG de la vue courante (html-to-image)
  lib/autoLayout.ts   agencement automatique en couches (Sugiyama, sans dépendance)
  lib/validate.ts     contrôle « santé » du schéma (isolés, vues vides, liens cassés…)
  lib/nodeCatalog.ts  catalogue minimal : 2 formes (object / zone). Le reste
                      (nom/icône/couleur) se personnalise par objet (style Excalidraw)
  lib/icons.ts        large jeu d'icônes sélectionnables (clé stable -> LucideIcon)
  lib/io.ts           export / import / partage (JSON + lien base64)
  data/presets.ts     styles (couleur+icône) pour amorcer les exemples — PAS des types
  data/sampleProject.ts  projet d'exemple ServiceNow (macro + détails)
  components/
    Canvas.tsx        React Flow + drag&drop + double-clic = drill-down ;
                      onReconnect (rebrancher un lien) ; markerEnd (flèches)
    Toolbar.tsx       barre du haut (réorganiser/new/import/export/share/présenter/aide/agent)
    Palette.tsx       palette des 2 formes : Objet + Zone
    Inspector.tsx     édition objet (nom/icône/couleur/champs, dupliquer) OU lien
    HealthCheck.tsx   pastille « santé du schéma » (liste les problèmes, clic = y aller)
    Breadcrumb.tsx    fil d'Ariane entre niveaux
    Dashboard.tsx     tableau de bord : liste des schémas (stats) + démo animée
    HelpModal.tsx     guide de prise en main in-app
    nodes/ArchNode.tsx  rendu d'un nœud (carte) + 4 handles (connexions multi-côtés)
    nodes/ZoneNode.tsx  cadre « zone/groupe » redimensionnable (DMZ, scope), derrière les objets
  agent/
    config.ts         providers (local / Claude / compatible OpenAI) + clé, localStorage
    builder.ts        génération : heuristique locale OU appel LLM (claude-opus-4-8)
    AgentPanel.tsx    UI : prompt + réglages provider/clé
```

## 4. Modèle de données (invariants)

- Un `Project` contient `graphs: Record<id, Graph>` + `rootGraphId`.
- Chaque `Graph` = `{ id, title, nodes, edges }` (format React Flow).
- Un nœud peut porter `data.childGraphId` → c'est le lien drill-down vers un
  sous-graphe. Entrer = `enterGraph(childGraphId)`.
- La navigation est une **pile** `path: string[]` de graphIds (pour le breadcrumb).
- Deux formes seulement : `NodeKind = 'object' | 'zone'` (style Excalidraw).
  L'identité d'un objet vient de son **nom / icône / couleur** (data.label/icon/color),
  pas d'un « type » figé. `object` = carte (rendu `ArchNode`, `type:'arch'`),
  `zone` = cadre de regroupement (rendu `ZoneNode`, `type:'zone'`).

## 5. Conventions

- Tout en français dans l'UI (libellés, placeholders).
- Couleurs des objets : viennent du catalogue, jamais codées en dur dans les composants.
- Pas de dépendance réseau au runtime (offline-first).
- Ne jamais muter l'état React Flow directement : passer par les actions du store.
- Garder les composants < ~200 lignes ; extraire si ça dépasse.

## 6. Checkpoints qualité (mon « équipe » de relecture)

Avant de dire « c'est fini », vérifier les 4 axes (voir `CHECKPOINTS.md`) :
1. **User-friendly** — un nouvel utilisateur comprend en < 30 s ?
2. **Dive deep correct** — le drill-down ouvre bien le bon sous-graphe, retour OK ?
3. **Comprehensive** — créer/éditer/lier/exporter/importer/partager fonctionnent ?
4. **Agent** — l'agent peut-il générer un schéma valide consommable par le store ?

## 7. Commandes

- `npm run dev` — serveur de dev (port 5180)
- `npm run build` — build prod (tsc + vite)
- `npm run typecheck` — types seulement

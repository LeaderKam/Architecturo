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
2. **Créer un objet** : glissez un type depuis la palette de gauche sur le canvas
   (ou cliquez dessus). Les types sont groupés en *Générique*, *Intégration*, *ServiceNow*.
3. **Éditer un objet** : cliquez dessus → le panneau de droite permet de changer
   son nom, son type, sa **couleur**, son **icône**, sa description et ses propriétés.
4. **Relier deux objets** : survolez un objet (4 points de connexion apparaissent),
   puis tirez vers un autre — dans n'importe quel sens.
5. **Régler un lien** : cliquez dessus → sens (unique →, bidirectionnel ↔, sans flèche)
   et libellé.
6. **Plonger (dive deep)** : double-cliquez sur un objet pour ouvrir/créer sa
   **vue détaillée**. Le fil d'Ariane en haut permet de remonter.
7. **Rechercher** : champ de recherche en haut (ou `Ctrl/⌘+K`) — retrouve un objet
   dans **tous les niveaux**, saute à sa vue et le centre.
8. **Agent** : décrivez une intégration en langage naturel, il génère les composants.
9. **Exporter** : menu *Exporter* → **JSON**, **PNG** ou **SVG** (image du schéma).
10. **Annuler / Refaire** : boutons de la barre d'outils ou `Ctrl/⌘+Z` et `Ctrl/⌘+Maj+Z`.
11. **Partager** : import `.json` ou lien encodé. Sauvegarde automatique (localStorage).

> Le bouton **« Aide »** dans la barre d'outils rouvre ce guide à tout moment.

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

## 🧱 Pile technique

React 18 · TypeScript · Vite · [React Flow](https://reactflow.dev) (`@xyflow/react`)
· Zustand · Tailwind CSS · lucide-react

## 📁 Structure du code

```
src/
  types.ts              modèle de données (Project, Graph, ArchNode, ArchEdge)
  store.ts              état global Zustand (navigation, CRUD, drill-down, bibliothèque)
  lib/
    nodeCatalog.ts      catalogue des types d'objets, par catégorie
    icons.ts            jeu d'icônes + couleurs sélectionnables
    io.ts               export / import / partage
    demo.ts             visite guidée animée
  data/sampleProject.ts exemple ServiceNow à 3 niveaux
  components/           Dashboard, Canvas, Toolbar, Palette, Inspector, Breadcrumb, HelpModal
  agent/                config (providers + clé) et builder (heuristique + LLM)
```

Plus de détails dans [`CLAUDE.md`](./CLAUDE.md) (carte du code) et
[`CHECKPOINTS.md`](./CHECKPOINTS.md) (revue qualité).

---

## 🗺️ Roadmap

- [ ] Brancher l'agent sur l'API Claude via un backend/proxy (clés côté serveur)
- [ ] Export image (PNG/SVG) du schéma
- [ ] Import depuis l'API ServiceNow (REST Messages / Scripted REST réels)
- [ ] Collaboration temps réel

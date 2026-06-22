# Checkpoints qualité — revue « équipe »

Revue passée avant livraison de la v1. Chaque axe est évalué comme une relecture
par un membre d'équipe distinct.

## ✅ 1. User-friendly (UX)

| Vérification | Statut |
| --- | --- |
| Layout clair : barre d'outils + palette + canvas + inspecteur | ✅ |
| L'état vide de l'inspecteur explique « cliquer / double-cliquer » | ✅ |
| Le drill-down est découvrable (badge « Vue détaillée disponible » + bouton) | ✅ |
| Compteur d'objets/liens visible | ✅ |
| Thème sombre cohérent, couleurs par type d'objet | ✅ |
| Ajout d'objet par glisser-déposer **et** par clic | ✅ |

**Verdict :** un nouvel utilisateur comprend la scène en quelques secondes.
*Amélioration future :* confirmation avant « Nouveau » (écrase le schéma courant).

## ✅ 2. Dive deep correct (drill-down)

| Vérification | Statut |
| --- | --- |
| Double-clic sur un nœud ouvre sa vue détaillée | ✅ |
| Création automatique d'un sous-graphe si absent | ✅ |
| Ré-ouverture = on entre dans le sous-graphe existant (pas de doublon) | ✅ |
| Fil d'Ariane reflète la pile de navigation et permet de remonter | ✅ |
| Drill-down récursif (détail d'un détail) supporté | ✅ |
| Bug corrigé : `path` vide au premier lancement → fil d'Ariane vide | ✅ |

**Verdict :** la navigation macro → détail est correcte et réversible.

## ✅ 3. Comprehensive (fonctionnel complet)

| Capacité | Statut |
| --- | --- |
| Créer / éditer / supprimer un objet | ✅ |
| Relier deux objets (drag entre handles) | ✅ |
| Propriétés clé/valeur libres par objet | ✅ |
| Export `.json` | ✅ |
| Import `.json` avec validation de format | ✅ |
| Partage via lien encodé (`#p=…`, UTF-8 safe) | ✅ |
| Persistance automatique (localStorage) | ✅ |

**Verdict :** le cycle créer → partager → importer → visualiser fonctionne de bout en bout.

## ✅ 4. Agent constructeur

| Vérification | Statut |
| --- | --- |
| L'agent génère des nœuds/arêtes valides pour le store | ✅ |
| Détection de composants ServiceNow par mots-clés (REST, scripted, transform, MID…) | ✅ |
| Injection dans la vue courante + recentrage automatique | ✅ |
| Explication lisible de ce qui a été construit | ✅ |
| Couture documentée pour brancher l'API Claude (`claude-opus-4-8`) plus tard | ✅ |

**Verdict :** l'agent crée bien « quelque chose » de valide sur la plateforme.
*Limite assumée :* génération heuristique locale (offline). Le provider Claude est
prévu mais nécessite un backend (clé API jamais côté client).

## Vérifications techniques

- `npm run build` (tsc strict + vite) : ✅ vert
- Serveur de dev : ✅ HTTP 200
- Mode strict TS : `noUnusedLocals`, `noUnusedParameters`, `strict` activés

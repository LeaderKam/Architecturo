import type { Project } from '../types'

export type IssueLevel = 'error' | 'warn'

export interface Issue {
  id: string
  level: IssueLevel
  message: string
  /** Graphe concerné (pour naviguer dessus). */
  graphId: string
  /** Objet concerné, si applicable (pour le révéler/sélectionner). */
  nodeId?: string
}

/**
 * Vérifie la « santé » d'un schéma : objets isolés, vues détaillées vides,
 * liens cassés, noms manquants ou en double. Sert d'aide avant export/partage.
 */
export function validateProject(project: Project): Issue[] {
  const issues: Issue[] = []
  const graphs = Object.values(project.graphs)

  for (const g of graphs) {
    const nodeIds = new Set(g.nodes.map((n) => n.id))
    const connected = new Set<string>()
    for (const e of g.edges) {
      connected.add(e.source)
      connected.add(e.target)
      // Lien cassé : une extrémité n'existe plus dans le graphe.
      if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) {
        issues.push({
          id: `broken-${g.id}-${e.id}`,
          level: 'error',
          message: `Lien cassé dans « ${g.title} » (objet supprimé).`,
          graphId: g.id,
        })
      }
    }

    // Doublons de noms dans un même graphe.
    const byName = new Map<string, number>()
    for (const n of g.nodes) {
      const label = (n.data.label ?? '').trim()
      if (label) byName.set(label.toLowerCase(), (byName.get(label.toLowerCase()) ?? 0) + 1)
    }

    for (const n of g.nodes) {
      const label = (n.data.label ?? '').trim()

      if (!label) {
        issues.push({
          id: `noname-${g.id}-${n.id}`,
          level: 'warn',
          message: `Objet sans nom dans « ${g.title} ».`,
          graphId: g.id,
          nodeId: n.id,
        })
      } else if ((byName.get(label.toLowerCase()) ?? 0) > 1) {
        issues.push({
          id: `dup-${g.id}-${n.id}`,
          level: 'warn',
          message: `Nom en double : « ${label} » (dans « ${g.title} »).`,
          graphId: g.id,
          nodeId: n.id,
        })
      }

      // Objet isolé (aucun lien) — seulement si le graphe a plusieurs objets.
      if (g.nodes.length > 1 && !connected.has(n.id)) {
        issues.push({
          id: `isolated-${g.id}-${n.id}`,
          level: 'warn',
          message: `Objet non relié : « ${label || 'sans nom'} ».`,
          graphId: g.id,
          nodeId: n.id,
        })
      }

      // Vue détaillée déclarée mais vide.
      const childId = n.data.childGraphId
      if (childId) {
        const child = project.graphs[childId]
        if (child && child.nodes.length === 0) {
          issues.push({
            id: `emptychild-${g.id}-${n.id}`,
            level: 'warn',
            message: `Vue détaillée vide : « ${label || 'sans nom'} ».`,
            graphId: g.id,
            nodeId: n.id,
          })
        }
      }
    }
  }

  // Tri : erreurs d'abord.
  return issues.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))
}

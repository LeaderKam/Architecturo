import type { ArchEdge, ArchNode } from '../types'

/**
 * Agencement automatique en couches (style Sugiyama, gauche → droite).
 * Sans dépendance : on respecte le sens des liens pour lire le flux d'intégration.
 *
 * 1. couche = plus long chemin depuis une source (nœud sans entrant) ;
 * 2. ordre dans la couche affiné par barycentre (réduit les croisements) ;
 * 3. positions = colonnes (couches) × lignes (rang dans la couche), centrées.
 */

const COL_GAP = 320 // espace horizontal entre couches
const ROW_GAP = 140 // espace vertical entre nœuds d'une couche

export function layoutGraph(allNodes: ArchNode[], edges: ArchEdge[]): ArchNode[] {
  // Les zones (cadres) ne participent pas à l'agencement : on les laisse en place.
  const zones = allNodes.filter((n) => n.type === 'zone')
  const nodes = allNodes.filter((n) => n.type !== 'zone')
  if (nodes.length === 0) return allNodes

  const ids = new Set(nodes.map((n) => n.id))
  // Liens internes au graphe, hors boucles sur soi-même.
  const links = edges.filter((e) => ids.has(e.source) && ids.has(e.target) && e.source !== e.target)

  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  for (const id of ids) {
    outgoing.set(id, [])
    incoming.set(id, [])
  }
  for (const e of links) {
    outgoing.get(e.source)!.push(e.target)
    incoming.get(e.target)!.push(e.source)
  }

  // --- 1. Affectation des couches (relaxation tolérante aux cycles) ---
  const layer = new Map<string, number>()
  for (const id of ids) layer.set(id, 0)
  // |nodes| passes suffisent pour propager le plus long chemin ; on borne pour les cycles.
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false
    for (const e of links) {
      const want = layer.get(e.source)! + 1
      if (want > layer.get(e.target)!) {
        layer.set(e.target, want)
        changed = true
      }
    }
    if (!changed) break
  }

  // Regroupe par couche, en conservant l'ordre d'origine comme base stable.
  const order = new Map<string, number>()
  nodes.forEach((n, i) => order.set(n.id, i))
  const maxLayer = Math.max(...[...layer.values()])
  const columns: string[][] = Array.from({ length: maxLayer + 1 }, () => [])
  for (const n of nodes) columns[layer.get(n.id)!].push(n.id)

  // --- 2. Réduction des croisements par barycentre (quelques balayages) ---
  const rank = new Map<string, number>()
  const reindex = () => columns.forEach((col) => col.forEach((id, i) => rank.set(id, i)))
  reindex()
  for (let sweep = 0; sweep < 4; sweep++) {
    const leftToRight = sweep % 2 === 0
    for (let c = 1; c < columns.length; c++) {
      const col = leftToRight ? columns[c] : columns[columns.length - 1 - c]
      const neighbors = leftToRight ? incoming : outgoing
      const bary = (id: string) => {
        const ns = neighbors.get(id)!.filter((x) => layer.get(x) !== layer.get(id))
        if (ns.length === 0) return rank.get(id)! // garde sa place si isolé dans le sens du balayage
        return ns.reduce((s, x) => s + rank.get(x)!, 0) / ns.length
      }
      col.sort((a, b) => bary(a) - bary(b) || order.get(a)! - order.get(b)!)
    }
    reindex()
  }

  // --- 3. Positions, chaque colonne centrée verticalement ---
  const tallest = Math.max(...columns.map((c) => c.length))
  const centerY = ((tallest - 1) * ROW_GAP) / 2
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const out: ArchNode[] = []
  columns.forEach((col, c) => {
    const colTop = centerY - ((col.length - 1) * ROW_GAP) / 2
    col.forEach((id, r) => {
      const n = byId.get(id)!
      out.push({ ...n, position: { x: c * COL_GAP, y: colTop + r * ROW_GAP } })
    })
  })
  return [...zones, ...out]
}

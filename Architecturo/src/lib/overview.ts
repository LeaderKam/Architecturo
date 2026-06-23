import type { Edge, Node } from '@xyflow/react'
import type { Project } from '../types'
import { kindDef } from './nodeCatalog'

/**
 * Construit une « vue d'ensemble dépliée » : tout le projet dans UN seul canvas,
 * chaque objet encapsulé devenant un conteneur (groupe) qui englobe les nœuds de
 * sa sous-vue, récursivement. Lecture seule (pour présenter / exporter le tout).
 */

const NODE_W = 190
const NODE_H = 62
const PAD = 22
const HEADER = 30
const GAP_X = 46
const GAP_Y = 46
const MAX_ROW = 1600

interface Pack {
  top: Node[] // nœuds de ce niveau (positions relatives à l'origine du graphe, sans parentId)
  inner: Node[] // descendants (déjà avec parentId)
  edges: Edge[]
  w: number
  h: number
}

interface Item {
  id: string
  label: string
  color: string
  icon?: string
  group: boolean
  sub?: Pack
  w: number
  h: number
  px: number
  py: number
}

export function buildOverview(project: Project): { nodes: Node[]; edges: Edge[] } {
  const pack = (graphId: string, ancestors: Set<string>): Pack => {
    const graph = project.graphs[graphId]
    if (!graph) return { top: [], inner: [], edges: [], w: 0, h: 0 }

    const items: Item[] = graph.nodes.map((n) => {
      const color = n.data.color ?? kindDef(n.data.kind).color
      const childId = n.data.childGraphId
      const isContainer =
        !!childId && (project.graphs[childId]?.nodes.length ?? 0) > 0 && !ancestors.has(childId)
      if (isContainer) {
        const sub = pack(childId!, new Set([...ancestors, graphId]))
        return {
          id: n.id, label: n.data.label, color, icon: n.data.icon, group: true, sub,
          w: sub.w + PAD * 2, h: sub.h + HEADER + PAD, px: 0, py: 0,
        }
      }
      return {
        id: n.id, label: n.data.label, color, icon: n.data.icon, group: false,
        w: NODE_W, h: NODE_H, px: 0, py: 0,
      }
    })

    // Rangement en étagères (rows) pour ce niveau.
    let x = 0, y = 0, rowH = 0, maxW = 0
    for (const it of items) {
      if (x > 0 && x + it.w > MAX_ROW) {
        x = 0
        y += rowH + GAP_Y
        rowH = 0
      }
      it.px = x
      it.py = y
      x += it.w + GAP_X
      rowH = Math.max(rowH, it.h)
      maxW = Math.max(maxW, it.px + it.w)
    }
    const totalH = y + rowH

    const top: Node[] = []
    const inner: Node[] = []
    const edges: Edge[] = graph.edges.map((e) => ({ ...e, type: 'floating' }))

    for (const it of items) {
      if (it.group && it.sub) {
        top.push({
          id: it.id,
          type: 'ovGroup',
          position: { x: it.px, y: it.py },
          width: it.w,
          height: it.h,
          data: { label: it.label, color: it.color },
          draggable: false,
          selectable: false,
        })
        // Les nœuds de tête du sous-graphe deviennent enfants de ce groupe.
        for (const cn of it.sub.top) {
          inner.push({
            ...cn,
            parentId: it.id,
            position: { x: cn.position.x + PAD, y: cn.position.y + HEADER },
          })
        }
        // Les descendants plus profonds gardent leur parentId/position.
        for (const cn of it.sub.inner) inner.push(cn)
        edges.push(...it.sub.edges)
      } else {
        top.push({
          id: it.id,
          type: 'ovNode',
          position: { x: it.px, y: it.py },
          width: NODE_W,
          height: NODE_H,
          data: { label: it.label, color: it.color, icon: it.icon },
          draggable: false,
          selectable: false,
        })
      }
    }

    return { top, inner, edges, w: maxW, h: totalH }
  }

  const root = pack(project.rootGraphId, new Set())
  // Parents avant enfants (exigence React Flow) : top de racine, puis descendants.
  return { nodes: [...root.top, ...root.inner], edges: root.edges }
}

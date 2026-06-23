import { kindDef } from '../../lib/nodeCatalog'
import type { ArchEdge, ArchNode } from '../../types'

const VB_W = 212
const VB_H = 80

function sizeOf(n: ArchNode): { w: number; h: number } {
  if (typeof n.width === 'number' && typeof n.height === 'number') return { w: n.width, h: n.height }
  if (n.type === 'zone') return { w: 360, h: 240 }
  if (n.type === 'integration') return { w: 220, h: 96 }
  return { w: 200, h: 80 }
}

/** Mini-aperçu SVG d'un sous-schéma (rendu statique, sans React Flow). */
export function GraphThumbnail({ nodes, edges }: { nodes: ArchNode[]; edges: ArchEdge[] }) {
  if (nodes.length === 0) return null

  const boxes = nodes.map((n) => {
    const { w, h } = sizeOf(n)
    return {
      id: n.id,
      x: n.position.x,
      y: n.position.y,
      w,
      h,
      color: n.data.color ?? kindDef(n.data.kind).color,
      zone: n.type === 'zone',
    }
  })

  const minX = Math.min(...boxes.map((b) => b.x))
  const minY = Math.min(...boxes.map((b) => b.y))
  const maxX = Math.max(...boxes.map((b) => b.x + b.w))
  const maxY = Math.max(...boxes.map((b) => b.y + b.h))
  const gw = maxX - minX || 1
  const gh = maxY - minY || 1
  const pad = 6
  const scale = Math.min((VB_W - pad * 2) / gw, (VB_H - pad * 2) / gh)
  const ox = (VB_W - gw * scale) / 2 - minX * scale
  const oy = (VB_H - gh * scale) / 2 - minY * scale
  const at = (b: (typeof boxes)[number]) => ({
    x: b.x * scale + ox,
    y: b.y * scale + oy,
    w: Math.max(b.w * scale, 4),
    h: Math.max(b.h * scale, 4),
  })
  const center = new Map(boxes.map((b) => {
    const r = at(b)
    return [b.id, { cx: r.x + r.w / 2, cy: r.y + r.h / 2 }]
  }))

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height={VB_H}
      preserveAspectRatio="xMidYMid meet"
      className="block"
    >
      {edges.map((e) => {
        const a = center.get(e.source)
        const b = center.get(e.target)
        if (!a || !b) return null
        return (
          <line
            key={e.id}
            x1={a.cx}
            y1={a.cy}
            x2={b.cx}
            y2={b.cy}
            stroke="#475069"
            strokeWidth={1}
          />
        )
      })}
      {boxes.map((b) => {
        const r = at(b)
        return (
          <rect
            key={b.id}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            rx={b.zone ? 4 : 3}
            fill={b.zone ? 'transparent' : `${b.color}33`}
            stroke={b.color}
            strokeWidth={b.zone ? 1 : 1.2}
            strokeDasharray={b.zone ? '3 2' : undefined}
          />
        )
      })}
    </svg>
  )
}

import { Position, type InternalNode, type Node } from '@xyflow/react'

/**
 * Calcule les points d'ancrage d'un lien « flottant » : il part/arrive
 * toujours sur le bord du bloc qui FAIT FACE à l'autre. Ainsi, quand on
 * déplace un bloc, le lien (et la flèche) se replacent tout seuls du bon côté.
 *
 * Adapté de la recette officielle React Flow « Floating Edges ».
 */

function getNodeIntersection(node: InternalNode<Node>, target: InternalNode<Node>) {
  const w = (node.measured.width ?? 0) / 2
  const h = (node.measured.height ?? 0) / 2
  const x2 = node.internals.positionAbsolute.x + w
  const y2 = node.internals.positionAbsolute.y + h
  const x1 = target.internals.positionAbsolute.x + (target.measured.width ?? 0) / 2
  const y1 = target.internals.positionAbsolute.y + (target.measured.height ?? 0) / 2

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1)
  const xx3 = a * xx1
  const yy3 = a * yy1
  const x = w * (xx3 + yy3) + x2
  const y = h * (-xx3 + yy3) + y2
  return { x, y }
}

function getEdgePosition(node: InternalNode<Node>, point: { x: number; y: number }): Position {
  const nx = Math.round(node.internals.positionAbsolute.x)
  const ny = Math.round(node.internals.positionAbsolute.y)
  const px = Math.round(point.x)
  const py = Math.round(point.y)
  if (px <= nx + 1) return Position.Left
  if (px >= nx + (node.measured.width ?? 0) - 1) return Position.Right
  if (py <= ny + 1) return Position.Top
  return Position.Bottom
}

export function getEdgeParams(source: InternalNode<Node>, target: InternalNode<Node>) {
  const sp = getNodeIntersection(source, target)
  const tp = getNodeIntersection(target, source)
  return {
    sx: sp.x,
    sy: sp.y,
    tx: tp.x,
    ty: tp.y,
    sourcePos: getEdgePosition(source, sp),
    targetPos: getEdgePosition(target, tp),
  }
}

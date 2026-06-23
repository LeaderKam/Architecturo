import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
} from '@xyflow/react'
import { getEdgeParams } from './floating'

/** Lien flottant : recalcule ses ancrages en continu selon la position des blocs. */
export function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  markerStart,
  style,
  label,
  selected,
}: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  if (!sourceNode || !targetNode) return null

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode)
  const [path, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{ strokeWidth: selected ? 2 : 1.5, ...style }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute rounded-md border border-line bg-panel px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

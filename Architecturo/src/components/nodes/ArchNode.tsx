import { memo } from 'react'
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { Layers } from 'lucide-react'
import { kindDef } from '../../lib/nodeCatalog'
import { iconByKey } from '../../lib/icons'
import { useStore } from '../../store'
import type { ArchNodeData } from '../../types'
import { GraphThumbnail } from './GraphThumbnail'

const SIDES = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
] as const

const MAX_FIELDS = 4

function ArchNodeInner({ data, selected, width, height }: NodeProps) {
  const d = data as ArchNodeData
  const def = kindDef(d.kind)
  // Couleur / icône personnalisées prioritaires, sinon valeurs du type.
  const color = d.color ?? def.color
  const Icon = iconByKey(d.icon) ?? def.icon
  const fields = (d.fields ?? []).filter((f) => f.key || f.value)

  // La vue détaillée n'est signalée que si le sous-graphe contient des objets.
  const child = useStore((s) => (d.childGraphId ? s.project.graphs[d.childGraphId] : undefined))
  const childCount = child?.nodes.length ?? 0
  const hasDetail = childCount > 0
  const sized = typeof width === 'number'

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-panel shadow-node transition-all"
      style={{
        width: sized ? '100%' : 240,
        height: typeof height === 'number' ? '100%' : undefined,
        border: `1px solid ${selected ? color : '#2a2f42'}`,
        boxShadow: selected ? `0 0 0 2px ${color}55, 0 8px 24px -6px #000` : undefined,
      }}
    >
      <NodeResizer
        color={color}
        isVisible={!!selected}
        minWidth={180}
        minHeight={64}
        handleStyle={{ width: 9, height: 9, borderRadius: 2 }}
      />
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: color }}
      />

      {SIDES.map((s) => (
        <Handle
          key={s.id}
          id={s.id}
          type="source"
          position={s.position}
          className="!h-2.5 !w-2.5 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: color }}
        />
      ))}

      <div className="flex items-start gap-3 px-3.5 py-3 pl-4">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${color}22`, color: color }}
        >
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight text-slate-100">
            {d.label}
          </div>
          {d.description && (
            <div className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-400">
              {d.description}
            </div>
          )}
        </div>
      </div>

      {/* Propriétés affichées directement sur l'objet */}
      {fields.length > 0 && (
        <div className="space-y-1 border-t border-line px-4 py-2">
          {fields.slice(0, MAX_FIELDS).map((f) => (
            <div key={f.id} className="flex items-baseline gap-2 text-[10.5px] leading-tight">
              <span className="shrink-0 font-medium text-slate-500">{f.key || '—'}</span>
              <span className="truncate text-right text-slate-300" style={{ marginLeft: 'auto' }}>
                {f.value}
              </span>
            </div>
          ))}
          {fields.length > MAX_FIELDS && (
            <div className="text-[10px] text-slate-600">+{fields.length - MAX_FIELDS} autres…</div>
          )}
        </div>
      )}

      {hasDetail && child && (
        <div
          className="border-t"
          style={{ borderColor: '#2a2f42' }}
          title="Double-cliquez pour plonger dans la vue détaillée"
        >
          <div className="bg-canvas/60 px-2 pt-1.5">
            <GraphThumbnail nodes={child.nodes} edges={child.edges} />
          </div>
          <div
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-medium"
            style={{ color }}
          >
            <Layers size={11} />
            Vue détaillée · {childCount} {childCount > 1 ? 'composants' : 'composant'}
          </div>
        </div>
      )}
    </div>
  )
}

export const ArchNode = memo(ArchNodeInner)

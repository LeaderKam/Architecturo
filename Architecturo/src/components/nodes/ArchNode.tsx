import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Layers } from 'lucide-react'
import { kindDef } from '../../lib/nodeCatalog'
import { iconByKey } from '../../lib/icons'
import { useStore } from '../../store'
import type { ArchNodeData } from '../../types'

const SIDES = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
] as const

const MAX_FIELDS = 4

function ArchNodeInner({ data, selected }: NodeProps) {
  const d = data as ArchNodeData
  const def = kindDef(d.kind)
  // Couleur / icône personnalisées prioritaires, sinon valeurs du type.
  const color = d.color ?? def.color
  const Icon = iconByKey(d.icon) ?? def.icon
  const fields = (d.fields ?? []).filter((f) => f.key || f.value)

  // La vue détaillée n'est signalée que si le sous-graphe contient des objets.
  const childCount = useStore((s) =>
    d.childGraphId ? (s.project.graphs[d.childGraphId]?.nodes.length ?? 0) : 0,
  )
  const hasDetail = childCount > 0

  return (
    <div
      className="group relative w-60 rounded-xl bg-panel shadow-node transition-all"
      style={{
        border: `1px solid ${selected ? color : '#2a2f42'}`,
        boxShadow: selected ? `0 0 0 2px ${color}55, 0 8px 24px -6px #000` : undefined,
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
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
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {def.label}
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

      {hasDetail && (
        <div
          className="flex items-center gap-1.5 border-t px-4 py-1.5 text-[10px] font-medium"
          style={{ borderColor: '#2a2f42', color: color }}
          title="Double-cliquez pour plonger dans la vue détaillée"
        >
          <Layers size={11} />
          Vue détaillée · {childCount} {childCount > 1 ? 'composants' : 'composant'}
        </div>
      )}
    </div>
  )
}

export const ArchNode = memo(ArchNodeInner)

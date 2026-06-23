import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { iconByKey } from '../../lib/icons'
import { Box } from 'lucide-react'

/** Carte compacte (lecture seule) pour la vue d'ensemble. */
function OvNodeInner({ data }: NodeProps) {
  const d = data as { label: string; color: string; icon?: string }
  const Icon = iconByKey(d.icon) ?? Box
  return (
    <div
      className="flex h-full w-full items-center gap-2 overflow-hidden rounded-lg bg-panel px-2.5"
      style={{ border: `1px solid ${d.color}55`, borderLeft: `3px solid ${d.color}` }}
    >
      <span className="shrink-0" style={{ color: d.color }}>
        <Icon size={14} />
      </span>
      <span className="truncate text-[11px] font-medium text-slate-100">{d.label}</span>
    </div>
  )
}

/** Conteneur (objet encapsulé) : cadre avec en-tête, englobe ses enfants. */
function OvGroupInner({ data }: NodeProps) {
  const d = data as { label: string; color: string }
  return (
    <div
      className="h-full w-full rounded-xl"
      style={{ border: `1.5px solid ${d.color}66`, background: `${d.color}0d` }}
    >
      <div
        className="inline-flex max-w-full items-center gap-1.5 truncate rounded-br-lg rounded-tl-[10px] px-2.5 py-1 text-[11px] font-semibold"
        style={{ background: `${d.color}22`, color: d.color }}
      >
        {d.label}
      </div>
    </div>
  )
}

export const OverviewNode = memo(OvNodeInner)
export const OverviewGroup = memo(OvGroupInner)

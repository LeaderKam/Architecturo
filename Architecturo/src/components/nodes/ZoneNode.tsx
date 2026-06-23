import { memo } from 'react'
import { NodeResizer, type NodeProps } from '@xyflow/react'
import { kindDef } from '../../lib/nodeCatalog'
import { iconByKey } from '../../lib/icons'
import type { ArchNodeData } from '../../types'

/**
 * Zone / groupe : un cadre translucide redimensionnable, posé DERRIÈRE les
 * objets (zIndex négatif), pour matérialiser une DMZ, un scope, un réseau…
 */
function ZoneInner({ data, selected }: NodeProps) {
  const d = data as ArchNodeData
  const def = kindDef('zone')
  const color = d.color ?? def.color
  const Icon = iconByKey(d.icon) ?? def.icon

  return (
    <>
      <NodeResizer
        color={color}
        isVisible={!!selected}
        minWidth={180}
        minHeight={120}
        handleStyle={{ width: 9, height: 9, borderRadius: 2 }}
      />
      <div
        className="h-full w-full rounded-xl border-2 border-dashed"
        style={{
          borderColor: `${color}88`,
          background: `${color}12`,
          boxShadow: selected ? `0 0 0 1px ${color}55` : undefined,
        }}
      >
        <div
          className="inline-flex items-center gap-1.5 rounded-br-lg rounded-tl-[10px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{ background: `${color}26`, color }}
        >
          <Icon size={12} />
          {d.label || 'Zone'}
        </div>
      </div>
    </>
  )
}

export const ZoneNode = memo(ZoneInner)

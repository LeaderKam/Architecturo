import { memo } from 'react'
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { kindDef } from '../../lib/nodeCatalog'
import { iconByKey } from '../../lib/icons'
import type { ArchNodeData } from '../../types'

const SIDES = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
] as const

const HEX = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'

/** Intégration : forme hexagonale distincte (flux d'échange), redimensionnable. */
function IntegrationInner({ data, selected, width, height }: NodeProps) {
  const d = data as ArchNodeData
  const def = kindDef('integration')
  const color = d.color ?? def.color
  const Icon = iconByKey(d.icon) ?? def.icon
  const sized = typeof width === 'number'

  return (
    <div
      className="group relative"
      style={{ width: sized ? '100%' : 220, height: typeof height === 'number' ? '100%' : 96 }}
    >
      <NodeResizer
        color={color}
        isVisible={!!selected}
        minWidth={160}
        minHeight={84}
        handleStyle={{ width: 9, height: 9, borderRadius: 2 }}
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

      <div
        className="flex h-full w-full flex-col items-center justify-center px-8 text-center"
        style={{
          clipPath: HEX,
          background: '#161a26',
          border: `1px solid ${selected ? color : '#2a2f42'}`,
        }}
      >
        <span style={{ color }}>
          <Icon size={18} />
        </span>
        <div className="mt-1 line-clamp-2 text-[12px] font-semibold leading-tight text-slate-100">
          {d.label}
        </div>
      </div>

      {/* Bordure colorée nette (le clip-path masque le border ci-dessus côté biais) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: HEX, boxShadow: selected ? `inset 0 0 0 2px ${color}55` : undefined }}
      />
    </div>
  )
}

export const IntegrationNode = memo(IntegrationInner)

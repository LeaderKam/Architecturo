import { NODE_KINDS_BY_CATEGORY } from '../lib/nodeCatalog'
import type { NodeKind } from '../types'
import { useStore } from '../store'
import { useReactFlow } from '@xyflow/react'

export function Palette() {
  const addNode = useStore((s) => s.addNode)
  const { screenToFlowPosition } = useReactFlow()

  const onDragStart = (e: React.DragEvent, kind: NodeKind) => {
    e.dataTransfer.setData('application/architecturo-kind', kind)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Clic = ajout au centre de la vue courante.
  const onClick = (kind: NodeKind) => {
    const pos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })
    addNode(kind, pos)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-2 pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Objets
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Glissez sur le canvas, ou cliquez pour ajouter.
        </p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-4 scroll-thin">
        {NODE_KINDS_BY_CATEGORY.map(({ category, kinds }) => (
          <div key={category}>
            <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              {category}
            </div>
            <div className="space-y-1.5">
              {kinds.map((def) => {
                const Icon = def.icon
                return (
                  <button
                    key={def.kind}
                    draggable
                    onDragStart={(e) => onDragStart(e, def.kind)}
                    onClick={() => onClick(def.kind)}
                    title={def.hint}
                    className="group flex w-full cursor-grab items-center gap-2.5 rounded-lg border border-transparent bg-panel-2 px-2.5 py-2 text-left transition-all hover:border-line active:cursor-grabbing"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      style={{ background: `${def.color}22`, color: def.color }}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-slate-200">
                        {def.label}
                      </span>
                      <span className="block truncate text-[10px] text-slate-500">{def.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

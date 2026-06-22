import { ArrowLeftRight, ArrowRight, Layers, Minus, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useStore } from '../store'
import { NODE_KINDS, kindDef } from '../lib/nodeCatalog'
import { COLOR_SWATCHES, ICONS, ICON_KEYS } from '../lib/icons'
import type { EdgeDirection, FieldEntry, NodeKind } from '../types'

export function Inspector() {
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedEdgeId = useStore((s) => s.selectedEdgeId)
  const graph = useStore((s) => s.currentGraph())
  const updateNodeData = useStore((s) => s.updateNodeData)
  const deleteNode = useStore((s) => s.deleteNode)
  const drillInto = useStore((s) => s.drillInto)
  const select = useStore((s) => s.select)

  const node = graph.nodes.find((n) => n.id === selectedNodeId)
  const edge = graph.edges.find((e) => e.id === selectedEdgeId)

  if (edge) return <EdgeInspector edgeId={edge.id} />

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="text-[13px] font-medium text-slate-400">Aucun objet sélectionné</div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          Cliquez sur un objet pour l'éditer.
          <br />
          Double-cliquez pour ouvrir sa vue détaillée.
        </p>
      </div>
    )
  }

  const d = node.data
  const def = kindDef(d.kind)
  const fields = d.fields ?? []
  const color = d.color ?? def.color
  const HeaderIcon = (d.icon && ICONS[d.icon]) || def.icon

  const setField = (id: string, patch: Partial<FieldEntry>) =>
    updateNodeData(node.id, {
      fields: fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })

  const addField = () =>
    updateNodeData(node.id, {
      fields: [...fields, { id: `f_${nanoid(5)}`, key: '', value: '' }],
    })

  const removeField = (id: string) =>
    updateNodeData(node.id, { fields: fields.filter((f) => f.id !== id) })

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ background: `${color}22`, color }}
          >
            <HeaderIcon size={14} />
          </span>
          <h2 className="text-[12px] font-semibold text-slate-200">Éditer l'objet</h2>
        </div>
        <button
          onClick={() => select(null)}
          className="rounded-md p-1 text-slate-500 hover:bg-panel-2 hover:text-slate-300"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scroll-thin">
        <Labeled label="Nom">
          <input
            value={d.label}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            className="ipt"
            placeholder="Nom de l'objet"
          />
        </Labeled>

        <Labeled label="Type">
          <select
            value={d.kind}
            onChange={(e) => updateNodeData(node.id, { kind: e.target.value as NodeKind })}
            className="ipt"
          >
            {NODE_KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
          </select>
        </Labeled>

        {/* Apparence : couleur + icône personnalisées */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Apparence</span>
            {(d.color || d.icon) && (
              <button
                onClick={() => updateNodeData(node.id, { color: undefined, icon: undefined })}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-panel-2 hover:text-slate-300"
                title="Revenir au style du type"
              >
                <RotateCcw size={11} /> Réinitialiser
              </button>
            )}
          </div>

          <div className="mb-2 flex flex-wrap gap-1.5">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => updateNodeData(node.id, { color: c })}
                className="h-5 w-5 rounded-full ring-2 ring-offset-2 ring-offset-panel transition-transform hover:scale-110"
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                aria-label={c}
              />
            ))}
            <label
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-line text-[9px] text-slate-400"
              title="Couleur personnalisée"
            >
              +
              <input
                type="color"
                value={color}
                onChange={(e) => updateNodeData(node.id, { color: e.target.value })}
                className="sr-only"
              />
            </label>
          </div>

          <div className="grid grid-cols-9 gap-1">
            {ICON_KEYS.map((key) => {
              const IconC = ICONS[key]
              const active = d.icon === key
              return (
                <button
                  key={key}
                  onClick={() => updateNodeData(node.id, { icon: key })}
                  className={`flex h-7 items-center justify-center rounded-md border transition-colors ${
                    active ? 'border-transparent' : 'border-line text-slate-400 hover:bg-panel-2'
                  }`}
                  style={active ? { background: `${color}22`, color } : undefined}
                >
                  <IconC size={14} />
                </button>
              )
            })}
          </div>
        </div>

        <Labeled label="Description">
          <textarea
            value={d.description ?? ''}
            onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
            rows={3}
            className="ipt resize-none"
            placeholder="À quoi sert cet objet ?"
          />
        </Labeled>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Propriétés</span>
            <button
              onClick={addField}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-accent hover:bg-panel-2"
            >
              <Plus size={12} /> Ajouter
            </button>
          </div>
          <div className="space-y-1.5">
            {fields.length === 0 && (
              <p className="text-[11px] text-slate-600">Aucune propriété.</p>
            )}
            {fields.map((f) => (
              <div key={f.id} className="flex items-center gap-1.5">
                <input
                  value={f.key}
                  onChange={(e) => setField(f.id, { key: e.target.value })}
                  className="ipt flex-1"
                  placeholder="Clé"
                />
                <input
                  value={f.value}
                  onChange={(e) => setField(f.id, { value: e.target.value })}
                  className="ipt flex-1"
                  placeholder="Valeur"
                />
                <button
                  onClick={() => removeField(f.id)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-panel-2 hover:text-rose-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-line px-4 py-3">
        <button
          onClick={() => drillInto(node.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <Layers size={14} />
          {d.childGraphId ? 'Ouvrir la vue détaillée' : 'Créer une vue détaillée'}
        </button>
        <button
          onClick={() => deleteNode(node.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[12px] font-medium text-slate-400 transition-colors hover:border-rose-500/40 hover:text-rose-400"
        >
          <Trash2 size={14} /> Supprimer l'objet
        </button>
      </div>
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}

const DIRECTIONS: { value: EdgeDirection; label: string; icon: typeof ArrowRight }[] = [
  { value: 'forward', label: 'Sens unique', icon: ArrowRight },
  { value: 'both', label: 'Bidirectionnel', icon: ArrowLeftRight },
  { value: 'none', label: 'Sans flèche', icon: Minus },
]

function EdgeInspector({ edgeId }: { edgeId: string }) {
  const graph = useStore((s) => s.currentGraph())
  const setEdgeDirection = useStore((s) => s.setEdgeDirection)
  const setEdgeLabel = useStore((s) => s.setEdgeLabel)
  const deleteEdge = useStore((s) => s.deleteEdge)
  const selectEdge = useStore((s) => s.selectEdge)

  const edge = graph.edges.find((e) => e.id === edgeId)
  if (!edge) return null

  const direction = (edge.data?.direction as EdgeDirection) ?? 'forward'
  const source = graph.nodes.find((n) => n.id === edge.source)?.data.label ?? edge.source
  const target = graph.nodes.find((n) => n.id === edge.target)?.data.label ?? edge.target

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-[12px] font-semibold text-slate-200">Éditer le lien</h2>
        <button
          onClick={() => selectEdge(null)}
          className="rounded-md p-1 text-slate-500 hover:bg-panel-2 hover:text-slate-300"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scroll-thin">
        <div className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-[12px] text-slate-300">
          <span className="font-medium text-slate-100">{source}</span>
          <span className="px-1.5 text-slate-500">→</span>
          <span className="font-medium text-slate-100">{target}</span>
        </div>

        <Labeled label="Libellé du lien">
          <input
            value={typeof edge.label === 'string' ? edge.label : ''}
            onChange={(e) => setEdgeLabel(edgeId, e.target.value)}
            className="ipt"
            placeholder="ex. : appelle, écrit, transmet…"
          />
        </Labeled>

        <div>
          <span className="mb-1.5 block text-[11px] font-medium text-slate-400">Sens</span>
          <div className="grid grid-cols-3 gap-1.5">
            {DIRECTIONS.map((d) => {
              const active = direction === d.value
              return (
                <button
                  key={d.value}
                  onClick={() => setEdgeDirection(edgeId, d.value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] transition-colors ${
                    active
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-line text-slate-400 hover:bg-panel-2'
                  }`}
                >
                  <d.icon size={16} />
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <button
          onClick={() => deleteEdge(edgeId)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[12px] font-medium text-slate-400 transition-colors hover:border-rose-500/40 hover:text-rose-400"
        >
          <Trash2 size={14} /> Supprimer le lien
        </button>
      </div>
    </div>
  )
}

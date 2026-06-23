import { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import { X } from 'lucide-react'
import { useStore } from '../store'
import { buildOverview } from '../lib/overview'
import { OverviewGroup, OverviewNode } from './nodes/OverviewNodes'
import { FloatingEdge } from './edges/FloatingEdge'

const nodeTypes = { ovNode: OverviewNode, ovGroup: OverviewGroup }
const edgeTypes = { floating: FloatingEdge }

export function OverviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const project = useStore((s) => s.project)
  const { nodes, edges } = useMemo(
    () => (open ? buildOverview(project) : { nodes: [], edges: [] }),
    [open, project],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-panel px-4">
        <div className="text-[13px] font-semibold text-slate-100">
          {project.name} — vue d'ensemble dépliée
          <span className="ml-2 text-[11px] font-normal text-slate-500">
            tous les niveaux, lecture seule
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[12px] font-medium text-slate-300 hover:bg-panel-2 hover:text-slate-100"
        >
          <X size={14} /> Fermer
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            fitView
            minZoom={0.1}
            proOptions={{ hideAttribution: false }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#222639" />
            <Controls showInteractive={false} />
            <MiniMap maskColor="rgba(12,14,20,0.7)" style={{ background: '#151823' }} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Edge,
  type EdgeMouseHandler,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import { useStore } from '../store'
import { kindDef } from '../lib/nodeCatalog'
import type { NodeKind } from '../types'
import { ArchNode } from './nodes/ArchNode'

const nodeTypes = { arch: ArchNode }

export function Canvas() {
  const graph = useStore((s) => s.currentGraph())
  const lastNav = useStore((s) => s.lastNav)
  const onNodesChange = useStore((s) => s.onNodesChange)
  const onEdgesChange = useStore((s) => s.onEdgesChange)
  const onConnect = useStore((s) => s.onConnect)
  const select = useStore((s) => s.select)
  const selectEdge = useStore((s) => s.selectEdge)
  const addNode = useStore((s) => s.addNode)
  const drillInto = useStore((s) => s.drillInto)
  const beginDrag = useStore((s) => s.beginDrag)

  const wrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, setCenter } = useReactFlow()
  const [diving, setDiving] = useState(false)

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node: Node) => select(node.id),
    [select],
  )

  /**
   * Plongée cinématique : la « caméra » fonce dans l'objet (zoom),
   * un flash passe, puis on bascule sur la vue détaillée qui se révèle.
   */
  const dive = useCallback(
    (node: Node) => {
      const w = (node.measured?.width ?? node.width ?? 240) as number
      const h = (node.measured?.height ?? node.height ?? 90) as number
      const cx = node.position.x + w / 2
      const cy = node.position.y + h / 2
      setDiving(true)
      setCenter(cx, cy, { zoom: 2.6, duration: 520 })
      window.setTimeout(() => {
        drillInto(node.id)
        setDiving(false)
      }, 500)
    },
    [setCenter, drillInto],
  )

  const onNodeDoubleClick: NodeMouseHandler = useCallback((_, node: Node) => dive(node), [dive])

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_, edge: Edge) => selectEdge(edge.id),
    [selectEdge],
  )

  const onPaneClick = useCallback(() => select(null), [select])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const kind = e.dataTransfer.getData('application/architecturo-kind') as NodeKind
      if (!kind) return
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addNode(kind, position)
    },
    [screenToFlowPosition, addNode],
  )

  const minimapColor = useMemo(
    () => (node: Node) => {
      const data = node.data as { kind: NodeKind; color?: string }
      return data.color ?? kindDef(data.kind).color
    },
    [],
  )

  // Flash de remontée (« dézoom ») quand on revient vers une vue parente.
  const [surfacing, setSurfacing] = useState(false)
  useEffect(() => {
    if (lastNav === 'up') {
      setSurfacing(true)
      const t = window.setTimeout(() => setSurfacing(false), 500)
      return () => window.clearTimeout(t)
    }
  }, [graph.id, lastNav])

  const isEmpty = graph.nodes.length === 0

  return (
    <div className="relative h-full w-full overflow-hidden" ref={wrapper}>
      <div
        key={graph.id}
        className={`h-full w-full ${lastNav === 'up' ? 'animate-graph-out' : 'animate-graph-in'}`}
      >
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeDragStart={beginDrag}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          connectionMode={ConnectionMode.Loose}
          fitView
          proOptions={{ hideAttribution: false }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#6366f1' },
          }}
          minZoom={0.2}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#222639" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={minimapColor}
            maskColor="rgba(12,14,20,0.7)"
            style={{ background: '#151823' }}
          />
        </ReactFlow>
      </div>

      {/* État vide : on indique clairement la nature de la vue */}
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="animate-fade-up rounded-2xl border border-dashed border-line bg-panel/60 px-8 py-7 backdrop-blur">
            <div className="text-[13px] font-semibold text-slate-300">
              {graph.parentGraphId ? 'Vue détaillée — vide' : 'Vue globale (macro) — vide'}
            </div>
            <p className="mt-1.5 max-w-xs text-[11px] leading-relaxed text-slate-500">
              {graph.parentGraphId
                ? 'Glissez les composants qui réalisent cet objet depuis la palette de gauche.'
                : 'C\'est ici la vue d\'ensemble. Glissez vos systèmes et intégrations depuis la palette, puis double-cliquez pour plonger dans leur détail.'}
            </p>
          </div>
        </div>
      )}

      {/* Flash de plongée cinématique (descente) */}
      {diving && (
        <div
          className="pointer-events-none absolute inset-0 z-10 animate-dive"
          style={{
            background:
              'radial-gradient(circle at center, rgba(99,102,241,0.35), rgba(12,14,20,0.0) 60%)',
          }}
        />
      )}

      {/* Flash de remontée (dézoom) */}
      {surfacing && (
        <div
          className="pointer-events-none absolute inset-0 z-10 animate-surface"
          style={{
            background:
              'radial-gradient(circle at center, rgba(99,102,241,0.0) 30%, rgba(99,102,241,0.28))',
          }}
        />
      )}
    </div>
  )
}

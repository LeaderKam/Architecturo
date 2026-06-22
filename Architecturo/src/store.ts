import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react'
import { nanoid } from 'nanoid'
import type {
  ArchEdge,
  ArchNode,
  ArchNodeData,
  EdgeDirection,
  Graph,
  NodeKind,
  Project,
} from './types'
import { kindDef } from './lib/nodeCatalog'
import { sampleProject } from './data/sampleProject'

function now() {
  return new Date().toISOString()
}

const ARROW = { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#6366f1' }

/** Applique le sens (flèches) à une arête selon sa direction. */
export function applyDirection(edge: ArchEdge, direction: EdgeDirection): ArchEdge {
  return {
    ...edge,
    data: { ...(edge.data ?? {}), direction },
    markerEnd: direction === 'none' ? undefined : ARROW,
    markerStart: direction === 'both' ? ARROW : undefined,
  }
}

export function emptyProject(name = 'Nouveau schéma'): Project {
  const rootId = `g_${nanoid(6)}`
  return {
    id: `p_${nanoid(6)}`,
    name,
    version: 1,
    rootGraphId: rootId,
    graphs: {
      [rootId]: { id: rootId, title: 'Vue Macro', nodes: [], edges: [] },
    },
    createdAt: now(),
    updatedAt: now(),
  }
}

interface AppState {
  project: Project
  /** Pile de graphIds : le dernier est le graphe affiché. */
  path: string[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  /** Vue active : tableau de bord (liste des schémas) ou éditeur. */
  view: 'dashboard' | 'editor'
  /** Sens de la dernière navigation entre niveaux (anime le canvas). */
  lastNav: 'down' | 'up'
  /** Bibliothèque de tous les schémas créés (id -> Project). */
  library: Record<string, Project>

  // --- sélecteurs ---
  currentGraphId: () => string
  currentGraph: () => Graph

  // --- projet ---
  loadProject: (p: Project) => void
  newProject: () => void
  renameProject: (name: string) => void

  // --- bibliothèque / navigation d'app ---
  goDashboard: () => void
  goEditor: () => void
  openProject: (id: string) => void
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => void

  // --- navigation / drill-down ---
  enterGraph: (graphId: string) => void
  goToPathIndex: (index: number) => void

  // --- canvas (React Flow) ---
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (conn: Connection) => void

  // --- CRUD objets ---
  select: (id: string | null) => void
  selectEdge: (id: string | null) => void
  addNode: (kind: NodeKind, position: XYPosition) => void
  updateNodeData: (id: string, patch: Partial<ArchNodeData>) => void
  deleteNode: (id: string) => void

  // --- liens ---
  setEdgeDirection: (edgeId: string, direction: EdgeDirection) => void
  setEdgeLabel: (edgeId: string, label: string) => void
  deleteEdge: (edgeId: string) => void
  /** Crée (ou ouvre) la vue détaillée d'un nœud. */
  drillInto: (nodeId: string) => void

  /** Injecte un ensemble nœuds/arêtes (généré par l'agent) dans le graphe courant. */
  appendToCurrentGraph: (nodes: ArchNode[], edges: ArchEdge[]) => void
}

function touch(p: Project): Project {
  return { ...p, updatedAt: now() }
}

function writeGraph(p: Project, graphId: string, patch: Partial<Graph>): Project {
  const g = p.graphs[graphId]
  if (!g) return p
  return touch({ ...p, graphs: { ...p.graphs, [graphId]: { ...g, ...patch } } })
}

const initialProject = sampleProject()

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      project: initialProject,
      path: [initialProject.rootGraphId],
      selectedNodeId: null,
      selectedEdgeId: null,
      view: 'dashboard',
      lastNav: 'down',
      library: { [initialProject.id]: initialProject },

      currentGraphId: () => {
        const { path, project } = get()
        return path[path.length - 1] ?? project.rootGraphId
      },
      currentGraph: () => {
        const { project } = get()
        const id = get().currentGraphId()
        return project.graphs[id] ?? project.graphs[project.rootGraphId]
      },

      loadProject: (p) =>
        set((s) => ({
          project: p,
          path: [p.rootGraphId],
          selectedNodeId: null,
          selectedEdgeId: null,
          view: 'editor',
          library: { ...s.library, [p.id]: p },
        })),
      newProject: () => {
        const p = emptyProject()
        set((s) => ({
          project: p,
          path: [p.rootGraphId],
          selectedNodeId: null,
          selectedEdgeId: null,
          view: 'editor',
          library: { ...s.library, [p.id]: p },
        }))
      },
      renameProject: (name) =>
        set((s) => {
          const p = touch({ ...s.project, name })
          return { project: p, library: { ...s.library, [p.id]: p } }
        }),

      goDashboard: () =>
        set((s) => ({ view: 'dashboard', library: { ...s.library, [s.project.id]: s.project } })),
      goEditor: () => set({ view: 'editor' }),
      openProject: (id) =>
        set((s) => {
          const p = s.library[id]
          if (!p) return {}
          return {
            project: p,
            path: [p.rootGraphId],
            selectedNodeId: null,
            selectedEdgeId: null,
            view: 'editor',
          }
        }),
      deleteProject: (id) =>
        set((s) => {
          const library = { ...s.library }
          delete library[id]
          // Si on supprime le schéma actif, on bascule sur un autre (ou un vide).
          if (s.project.id === id) {
            const next = Object.values(library)[0] ?? emptyProject()
            library[next.id] = next
            return { library, project: next, path: [next.rootGraphId], selectedNodeId: null }
          }
          return { library }
        }),
      duplicateProject: (id) =>
        set((s) => {
          const src = s.library[id]
          if (!src) return {}
          const copy: Project = {
            ...JSON.parse(JSON.stringify(src)),
            id: `p_${nanoid(6)}`,
            name: `${src.name} (copie)`,
            createdAt: now(),
            updatedAt: now(),
          }
          return { library: { ...s.library, [copy.id]: copy } }
        }),

      enterGraph: (graphId) =>
        set((s) => ({
          path: [...s.path, graphId],
          selectedNodeId: null,
          selectedEdgeId: null,
          lastNav: 'down',
        })),
      goToPathIndex: (index) =>
        set((s) => ({
          path: s.path.slice(0, index + 1),
          selectedNodeId: null,
          selectedEdgeId: null,
          lastNav: index < s.path.length - 1 ? 'up' : s.lastNav,
        })),

      onNodesChange: (changes) => {
        const id = get().currentGraphId()
        const g = get().project.graphs[id]
        set((s) => ({
          project: writeGraph(s.project, id, {
            nodes: applyNodeChanges(changes, g.nodes) as ArchNode[],
          }),
        }))
      },
      onEdgesChange: (changes) => {
        const id = get().currentGraphId()
        const g = get().project.graphs[id]
        set((s) => ({
          project: writeGraph(s.project, id, {
            edges: applyEdgeChanges(changes, g.edges),
          }),
        }))
      },
      onConnect: (conn) => {
        const id = get().currentGraphId()
        const g = get().project.graphs[id]
        const edge = applyDirection(
          { ...conn, id: `e_${nanoid(6)}`, animated: true, type: 'smoothstep' },
          'forward',
        )
        set((s) => ({
          project: writeGraph(s.project, id, { edges: addEdge(edge, g.edges) }),
          selectedEdgeId: edge.id,
          selectedNodeId: null,
        }))
      },

      select: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
      selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

      addNode: (kind, position) => {
        const id = get().currentGraphId()
        const g = get().project.graphs[id]
        const def = kindDef(kind)
        const node: ArchNode = {
          id: `n_${nanoid(6)}`,
          type: 'arch',
          position,
          data: { label: def.label, kind, fields: [] },
        }
        set((s) => ({
          project: writeGraph(s.project, id, { nodes: [...g.nodes, node] }),
          selectedNodeId: node.id,
        }))
      },

      updateNodeData: (nodeId, patch) => {
        const id = get().currentGraphId()
        const g = get().project.graphs[id]
        const nodes = g.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
        )
        set((s) => ({ project: writeGraph(s.project, id, { nodes }) }))
      },

      deleteNode: (nodeId) => {
        const id = get().currentGraphId()
        const g = get().project.graphs[id]
        const nodes = g.nodes.filter((n) => n.id !== nodeId)
        const edges = g.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
        set((s) => ({
          project: writeGraph(s.project, id, { nodes, edges }),
          selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
        }))
      },

      setEdgeDirection: (edgeId, direction) => {
        const id = get().currentGraphId()
        const g = get().project.graphs[id]
        const edges = g.edges.map((e) => (e.id === edgeId ? applyDirection(e, direction) : e))
        set((s) => ({ project: writeGraph(s.project, id, { edges }) }))
      },

      setEdgeLabel: (edgeId, label) => {
        const id = get().currentGraphId()
        const g = get().project.graphs[id]
        const edges = g.edges.map((e) =>
          e.id === edgeId ? { ...e, label: label || undefined } : e,
        )
        set((s) => ({ project: writeGraph(s.project, id, { edges }) }))
      },

      deleteEdge: (edgeId) => {
        const id = get().currentGraphId()
        const g = get().project.graphs[id]
        const edges = g.edges.filter((e) => e.id !== edgeId)
        set((s) => ({
          project: writeGraph(s.project, id, { edges }),
          selectedEdgeId: s.selectedEdgeId === edgeId ? null : s.selectedEdgeId,
        }))
      },

      drillInto: (nodeId) => {
        const parentId = get().currentGraphId()
        const g = get().project.graphs[parentId]
        const node = g.nodes.find((n) => n.id === nodeId)
        if (!node) return

        // Sous-graphe déjà existant -> on entre dedans (navigation descendante).
        if (node.data.childGraphId && get().project.graphs[node.data.childGraphId]) {
          set({ lastNav: 'down' })
          get().enterGraph(node.data.childGraphId)
          return
        }

        // Sinon on en crée un.
        const childId = `g_${nanoid(6)}`
        const child: Graph = {
          id: childId,
          title: `${node.data.label} — détail`,
          parentGraphId: parentId,
          nodes: [],
          edges: [],
        }
        const nodes = g.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, childGraphId: childId } } : n,
        )
        set((s) => {
          const p = touch({
            ...s.project,
            graphs: { ...s.project.graphs, [childId]: child },
          })
          const p2 = { ...p, graphs: { ...p.graphs, [parentId]: { ...p.graphs[parentId], nodes } } }
          return { project: p2, path: [...s.path, childId], selectedNodeId: null, lastNav: 'down' }
        })
      },

      appendToCurrentGraph: (newNodes, newEdges) => {
        const id = get().currentGraphId()
        const g = get().project.graphs[id]
        set((s) => ({
          project: writeGraph(s.project, id, {
            nodes: [...g.nodes, ...newNodes],
            edges: [...g.edges, ...newEdges],
          }),
        }))
      },
    }),
    {
      name: 'architecturo:project',
      partialize: (s) => ({
        project: s.project,
        path: s.path,
        library: s.library,
        view: s.view,
      }),
      // À la réhydratation, s'assurer qu'on a un chemin et une bibliothèque valides.
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (!state.path || state.path.length === 0) {
          state.path = [state.project.rootGraphId]
        }
        if (!state.library || Object.keys(state.library).length === 0) {
          state.library = { [state.project.id]: state.project }
        }
      },
    },
  ),
)

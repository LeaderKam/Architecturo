import type { Edge, Node } from '@xyflow/react'

/** Types d'objets d'architecture. Définis/affichés via src/lib/nodeCatalog.ts */
export type NodeKind =
  // --- Génériques (toutes plateformes) ---
  | 'system'
  | 'application'
  | 'service'
  | 'api'
  | 'database'
  | 'queue'
  | 'gateway'
  | 'function'
  | 'storage'
  | 'user'
  | 'externalSystem'
  | 'event'
  | 'table'
  | 'custom'
  // --- Disposition ---
  | 'zone'
  // --- Intégration ---
  | 'integration'
  | 'webhook'
  | 'dataSource'
  // --- CMDB (classes de CI) ---
  | 'businessService'
  | 'appService'
  | 'server'
  | 'cluster'
  | 'loadBalancer'
  | 'networkGear'
  // --- ServiceNow ---
  | 'restMessage'
  | 'scriptedRest'
  | 'businessRule'
  | 'transformMap'
  | 'midServer'
  | 'flow'

/** Sens d'un lien entre deux objets. */
export type EdgeDirection = 'forward' | 'both' | 'none'

/** Paire clé/valeur libre pour documenter un objet. */
export interface FieldEntry {
  id: string
  key: string
  value: string
}

/** Données portées par un nœud du canvas. */
export interface ArchNodeData {
  label: string
  kind: NodeKind
  description?: string
  fields?: FieldEntry[]
  /** Couleur d'accent personnalisée (hex). Sinon : couleur du type. */
  color?: string
  /** Clé d'icône personnalisée (cf. lib/icons.ts). Sinon : icône du type. */
  icon?: string
  /** Si présent : ce nœud ouvre une vue détaillée (drill-down) vers ce graphe. */
  childGraphId?: string
  [key: string]: unknown
}

export interface ArchEdgeData {
  direction?: EdgeDirection
  [key: string]: unknown
}

export type ArchNode = Node<ArchNodeData>
export type ArchEdge = Edge<ArchEdgeData>

/** Un niveau / une vue. */
export interface Graph {
  id: string
  title: string
  /** graphId parent (undefined pour la racine) — utile pour le breadcrumb. */
  parentGraphId?: string
  nodes: ArchNode[]
  edges: ArchEdge[]
}

/** Le document complet, ce qu'on exporte / importe / partage. */
export interface Project {
  id: string
  name: string
  version: 1
  rootGraphId: string
  graphs: Record<string, Graph>
  createdAt: string
  updatedAt: string
}

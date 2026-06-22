import {
  Boxes,
  AppWindow,
  Cog,
  Plug,
  Database,
  Inbox,
  Waypoints,
  Braces,
  HardDrive,
  User,
  Globe,
  Cable,
  Webhook,
  FileInput,
  Send,
  Code2,
  Workflow,
  Shuffle,
  Server,
  GitBranch,
  Zap,
  Table2,
  Component,
  type LucideIcon,
} from 'lucide-react'
import type { NodeKind } from '../types'

export type NodeCategory = 'Générique' | 'Intégration' | 'ServiceNow'

export interface NodeKindDef {
  kind: NodeKind
  label: string
  category: NodeCategory
  /** Couleur d'accent (hex) — source unique de vérité pour l'UI. */
  color: string
  icon: LucideIcon
  /** Texte d'aide affiché dans la palette. */
  hint: string
}

/** Catalogue unique des types d'objets. Ajouter un type => ajouter ici. */
export const NODE_CATALOG: Record<NodeKind, NodeKindDef> = {
  // ---------------- Génériques ----------------
  system: {
    kind: 'system', label: 'Système', category: 'Générique', color: '#818cf8', icon: Boxes,
    hint: 'Plateforme ou système global',
  },
  application: {
    kind: 'application', label: 'Application', category: 'Générique', color: '#a78bfa', icon: AppWindow,
    hint: 'Application métier',
  },
  service: {
    kind: 'service', label: 'Service', category: 'Générique', color: '#38bdf8', icon: Cog,
    hint: 'Microservice / service backend',
  },
  api: {
    kind: 'api', label: 'API', category: 'Générique', color: '#34d399', icon: Plug,
    hint: 'Point d\'entrée API (REST/GraphQL)',
  },
  database: {
    kind: 'database', label: 'Base de données', category: 'Générique', color: '#2dd4bf', icon: Database,
    hint: 'Base de données / datastore',
  },
  queue: {
    kind: 'queue', label: 'File / Bus', category: 'Générique', color: '#fb923c', icon: Inbox,
    hint: 'File de messages / bus d\'événements',
  },
  gateway: {
    kind: 'gateway', label: 'Passerelle', category: 'Générique', color: '#60a5fa', icon: Waypoints,
    hint: 'API Gateway / proxy',
  },
  function: {
    kind: 'function', label: 'Fonction', category: 'Générique', color: '#facc15', icon: Braces,
    hint: 'Fonction serverless / lambda',
  },
  storage: {
    kind: 'storage', label: 'Stockage', category: 'Générique', color: '#94a3b8', icon: HardDrive,
    hint: 'Stockage objet / fichiers',
  },
  user: {
    kind: 'user', label: 'Acteur', category: 'Générique', color: '#f472b6', icon: User,
    hint: 'Utilisateur / acteur externe',
  },
  externalSystem: {
    kind: 'externalSystem', label: 'Système externe', category: 'Générique', color: '#cbd5e1', icon: Globe,
    hint: 'Système tiers hors périmètre',
  },
  event: {
    kind: 'event', label: 'Événement', category: 'Générique', color: '#eab308', icon: Zap,
    hint: 'Événement / trigger',
  },
  table: {
    kind: 'table', label: 'Table', category: 'Générique', color: '#9ca3af', icon: Table2,
    hint: 'Table de données',
  },
  custom: {
    kind: 'custom', label: 'Personnalisé', category: 'Générique', color: '#d1d5db', icon: Component,
    hint: 'Nœud libre — définissez son icône et sa couleur',
  },

  // ---------------- Intégration ----------------
  integration: {
    kind: 'integration', label: 'Intégration', category: 'Intégration', color: '#22d3ee', icon: Cable,
    hint: 'Flux d\'échange entre deux systèmes',
  },
  webhook: {
    kind: 'webhook', label: 'Webhook', category: 'Intégration', color: '#5eead4', icon: Webhook,
    hint: 'Notification HTTP entrante/sortante',
  },
  dataSource: {
    kind: 'dataSource', label: 'Data Source', category: 'Intégration', color: '#67e8f9', icon: FileInput,
    hint: 'Source de données d\'import',
  },

  // ---------------- ServiceNow ----------------
  restMessage: {
    kind: 'restMessage', label: 'REST Message', category: 'ServiceNow', color: '#34d399', icon: Send,
    hint: 'Appel REST sortant (Outbound)',
  },
  scriptedRest: {
    kind: 'scriptedRest', label: 'Scripted REST', category: 'ServiceNow', color: '#f59e0b', icon: Code2,
    hint: 'API REST entrante scriptée (Inbound)',
  },
  businessRule: {
    kind: 'businessRule', label: 'Business Rule', category: 'ServiceNow', color: '#f472b6', icon: Workflow,
    hint: 'Logique serveur déclenchée sur une table',
  },
  transformMap: {
    kind: 'transformMap', label: 'Transform Map', category: 'ServiceNow', color: '#c084fc', icon: Shuffle,
    hint: 'Mapping d\'import vers une table cible',
  },
  midServer: {
    kind: 'midServer', label: 'MID Server', category: 'ServiceNow', color: '#3b82f6', icon: Server,
    hint: 'Agent on-premise pour les flux internes',
  },
  flow: {
    kind: 'flow', label: 'Flow / Action', category: 'ServiceNow', color: '#fb923c', icon: GitBranch,
    hint: 'Flow Designer : flow ou action',
  },
}

export const NODE_KINDS = Object.values(NODE_CATALOG)

export const CATEGORY_ORDER: NodeCategory[] = ['Générique', 'Intégration', 'ServiceNow']

/** Types regroupés par catégorie, dans l'ordre d'affichage. */
export const NODE_KINDS_BY_CATEGORY: { category: NodeCategory; kinds: NodeKindDef[] }[] =
  CATEGORY_ORDER.map((category) => ({
    category,
    kinds: NODE_KINDS.filter((k) => k.category === category),
  }))

export function kindDef(kind: NodeKind): NodeKindDef {
  return NODE_CATALOG[kind] ?? NODE_CATALOG.custom
}

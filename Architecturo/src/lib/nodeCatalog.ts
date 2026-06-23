import { Box, Cable, Frame, type LucideIcon } from 'lucide-react'
import type { NodeKind } from '../types'

export type NodeCategory = 'Formes'

export interface NodeKindDef {
  kind: NodeKind
  label: string
  category: NodeCategory
  /** Couleur d'accent (hex) par défaut — modifiable par objet. */
  color: string
  icon: LucideIcon
  /** Texte d'aide affiché dans la palette. */
  hint: string
}

/**
 * Catalogue minimal : deux formes. Tout le reste (icône, couleur, nom, champs)
 * se personnalise objet par objet dans l'inspecteur.
 */
export const NODE_CATALOG: Record<NodeKind, NodeKindDef> = {
  object: {
    kind: 'object', label: 'Objet', category: 'Formes', color: '#818cf8', icon: Box,
    hint: 'Une carte — choisissez son nom, son icône et sa couleur',
  },
  integration: {
    kind: 'integration', label: 'Intégration', category: 'Formes', color: '#22d3ee', icon: Cable,
    hint: 'Flux d\'échange entre systèmes — forme hexagonale distincte',
  },
  zone: {
    kind: 'zone', label: 'Zone / Groupe', category: 'Formes', color: '#64748b', icon: Frame,
    hint: 'Cadre pour regrouper des objets (DMZ, scope, réseau…)',
  },
}

export const NODE_KINDS = Object.values(NODE_CATALOG)

export const CATEGORY_ORDER: NodeCategory[] = ['Formes']

/** Types regroupés par catégorie, dans l'ordre d'affichage. */
export const NODE_KINDS_BY_CATEGORY: { category: NodeCategory; kinds: NodeKindDef[] }[] =
  CATEGORY_ORDER.map((category) => ({
    category,
    kinds: NODE_KINDS.filter((k) => k.category === category),
  }))

export function kindDef(kind: NodeKind): NodeKindDef {
  return NODE_CATALOG[kind] ?? NODE_CATALOG.object
}

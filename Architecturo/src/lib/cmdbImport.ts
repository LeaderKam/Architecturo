import { nanoid } from 'nanoid'
import type { ArchEdge, ArchNode, Graph, Project } from '../types'
import { applyDirection } from '../store'
import { layoutGraph } from './autoLayout'

/**
 * Import d'une cartographie CMDB ServiceNow (offline, côté navigateur).
 *
 * Entrées acceptées :
 *  - JSON de l'API REST `cmdb_rel_ci` (`?sysparm_display_value=true`) :
 *      { "result": [ { "parent": {"display_value": "..."},
 *                      "child":  {"display_value": "..."},
 *                      "type":   {"display_value": "Depends on::Used by"} } ] }
 *  - JSON « à plat » : [ { "parent": "...", "child": "...", "type": "..." } ]
 *  - CSV avec en-têtes contenant parent / child / type (+ classes optionnelles).
 *
 * Deux modes :
 *  - hiérarchique (défaut) : un CI avec des enfants devient un conteneur avec sa
 *    vue détaillée (drill-down), récursivement, en suivant le sens parent → enfant ;
 *  - plat : tout dans une seule vue macro.
 */

interface Relation {
  parent: string
  child: string
  type?: string
  parentClass?: string
  childClass?: string
}

/** Styles par classe de CI ServiceNow (sys_class_name). Sinon : style par défaut. */
const CLASS_STYLE: { match: RegExp; color: string; icon: string }[] = [
  { match: /service_discovered|business_service|cmdb_ci_service\b|_service$/, color: '#f59e0b', icon: 'building' },
  { match: /appl|application|service_auto/, color: '#a78bfa', icon: 'layers' },
  { match: /lb|load_balancer/, color: '#2dd4bf', icon: 'waypoints' },
  { match: /db|database|oracle|mysql|mssql|postgre/, color: '#34d399', icon: 'database' },
  { match: /storage|san|disk|volume/, color: '#94a3b8', icon: 'harddrive' },
  { match: /netgear|switch|router|firewall|network/, color: '#22d3ee', icon: 'network' },
  { match: /cluster/, color: '#818cf8', icon: 'boxes' },
  { match: /server|computer|host|linux|win|esx|vm/, color: '#60a5fa', icon: 'server' },
]

function styleForClass(cls?: string): { color?: string; icon?: string } {
  if (!cls) return {}
  const c = cls.toLowerCase()
  const hit = CLASS_STYLE.find((s) => s.match.test(c))
  return hit ? { color: hit.color, icon: hit.icon } : {}
}

/** Valeur d'affichage robuste (chaîne directe ou objet {display_value|value}). */
function disp(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    return String(o.display_value ?? o.value ?? '').trim()
  }
  return String(v).trim()
}

/** Le type ServiceNow est « Descripteur parent::Descripteur enfant » -> on garde le sens parent. */
function relLabel(type?: string): string | undefined {
  if (!type) return undefined
  const fwd = type.split('::')[0]?.trim()
  return fwd || type.trim() || undefined
}

function extractRelations(text: string): Relation[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  // --- JSON ---
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const data = JSON.parse(trimmed)
    const rows: Record<string, unknown>[] = Array.isArray(data)
      ? data
      : Array.isArray(data.result)
        ? data.result
        : []
    return rows
      .map((r) => ({
        parent: disp(r.parent),
        child: disp(r.child),
        type: disp(r.type) || undefined,
        parentClass: disp(r['parent.sys_class_name'] ?? (r.parent as Record<string, unknown>)?.sys_class_name) || undefined,
        childClass: disp(r['child.sys_class_name'] ?? (r.child as Record<string, unknown>)?.sys_class_name) || undefined,
      }))
      .filter((r) => r.parent && r.child)
  }

  // --- CSV ---
  const delim = trimmed.includes(';') && !trimmed.includes(',') ? ';' : ','
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const header = lines[0].split(delim).map((h) => h.trim().toLowerCase())
  const col = (name: string) => header.findIndex((h) => h.includes(name))
  const pi = col('parent')
  const ci = col('child')
  const ti = col('type')
  const pci = header.findIndex((h) => h.includes('parent') && h.includes('class'))
  const cci = header.findIndex((h) => h.includes('child') && h.includes('class'))
  if (pi === -1 || ci === -1) return []
  return lines
    .slice(1)
    .map((line) => {
      const cells = line.split(delim).map((c) => c.trim())
      return {
        parent: cells[pi] ?? '',
        child: cells[ci] ?? '',
        type: ti >= 0 ? cells[ti] || undefined : undefined,
        parentClass: pci >= 0 ? cells[pci] || undefined : undefined,
        childClass: cci >= 0 ? cells[cci] || undefined : undefined,
      }
    })
    .filter((r) => r.parent && r.child)
}

/* -------------------------------------------------------------------------- */
/*  Index commun (relations -> adjacence, classes, racines)                    */
/* -------------------------------------------------------------------------- */

interface CmdbIndex {
  relations: Relation[]
  names: string[]
  childrenOf: Map<string, string[]>
  hasParent: Set<string>
  ciClass: Map<string, string>
}

function buildIndex(relations: Relation[]): CmdbIndex {
  const childrenOf = new Map<string, string[]>()
  const hasParent = new Set<string>()
  const ciClass = new Map<string, string>()
  const names = new Set<string>()
  for (const r of relations) {
    names.add(r.parent)
    names.add(r.child)
    if (r.parentClass && !ciClass.has(r.parent)) ciClass.set(r.parent, r.parentClass)
    if (r.childClass && !ciClass.has(r.child)) ciClass.set(r.child, r.childClass)
    const kids = childrenOf.get(r.parent) ?? []
    if (!kids.includes(r.child)) kids.push(r.child)
    childrenOf.set(r.parent, kids)
    hasParent.add(r.child)
  }
  return { relations, names: [...names], childrenOf, hasParent, ciClass }
}

/* -------------------------------------------------------------------------- */
/*  Construction des graphes                                                   */
/* -------------------------------------------------------------------------- */

interface Built {
  graphs: Record<string, Graph>
  rootGraphId: string
  ciCount: number
  relCount: number
  levels: number
}

/** Un graphe = des membres (par nom) + tous les liens internes à ces membres. */
function makeGraph(
  idx: CmdbIndex,
  id: string,
  title: string,
  memberNames: string[],
  parentGraphId: string | undefined,
  childGraphIdOf: Map<string, string | undefined>,
): Graph {
  const members = [...new Set(memberNames)]
  const idByName = new Map<string, string>()
  const nodes: ArchNode[] = members.map((label) => {
    const node: ArchNode = {
      id: `n_${nanoid(6)}`,
      type: 'arch',
      position: { x: 0, y: 0 },
      data: { label, kind: 'object', fields: [], ...styleForClass(idx.ciClass.get(label)) },
    }
    const childGid = childGraphIdOf.get(label)
    if (childGid) node.data.childGraphId = childGid
    idByName.set(label, node.id)
    return node
  })

  const memberSet = new Set(members)
  const edges: ArchEdge[] = []
  const seen = new Set<string>()
  for (const r of idx.relations) {
    if (r.parent === r.child) continue
    if (!memberSet.has(r.parent) || !memberSet.has(r.child)) continue
    const key = `${r.parent}->${r.child}:${r.type ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    edges.push(
      applyDirection(
        {
          id: `e_${nanoid(6)}`,
          source: idByName.get(r.parent)!,
          target: idByName.get(r.child)!,
          label: relLabel(r.type),
          animated: true,
          type: 'smoothstep',
        },
        'forward',
      ),
    )
  }

  return { id, title, parentGraphId, nodes: layoutGraph(nodes, edges), edges }
}

/** Mode hiérarchique : racines en macro, chaque CI à enfants ouvre sa vue détaillée. */
function buildHierarchy(idx: CmdbIndex): Built | null {
  const roots = idx.names.filter((n) => !idx.hasParent.has(n))
  if (roots.length === 0) return null // tout est cyclique -> on retombera en mode plat

  const graphs: Record<string, Graph> = {}
  const detailIdByCi = new Map<string, string>() // partage le sous-graphe d'un CI
  const building = new Set<string>() // détection de cycle
  let maxDepth = 1

  // Renvoie l'id du sous-graphe « détail » d'un CI (CI + ses enfants), ou undefined.
  const detailFor = (ci: string, parentGid: string, depth: number): string | undefined => {
    const kids = idx.childrenOf.get(ci)
    if (!kids || kids.length === 0) return undefined
    if (detailIdByCi.has(ci)) return detailIdByCi.get(ci)
    if (building.has(ci)) return undefined // cycle : on coupe le drill-down
    building.add(ci)
    maxDepth = Math.max(maxDepth, depth + 1)
    const gid = `g_${nanoid(6)}`
    detailIdByCi.set(ci, gid)

    const members = [ci, ...kids]
    const childGraphIdOf = new Map<string, string | undefined>()
    for (const m of members) {
      if (m === ci) continue // le CI focalisé n'ouvre pas sa propre détail ici
      childGraphIdOf.set(m, detailFor(m, gid, depth + 1))
    }
    graphs[gid] = makeGraph(idx, gid, `${ci} — CI`, members, parentGid, childGraphIdOf)
    building.delete(ci)
    return gid
  }

  const rootGid = `g_${nanoid(6)}`
  const childGraphIdOf = new Map<string, string | undefined>()
  for (const r of roots) childGraphIdOf.set(r, detailFor(r, rootGid, 1))
  graphs[rootGid] = makeGraph(idx, rootGid, 'CMDB — Services & dépendances', roots, undefined, childGraphIdOf)

  return {
    graphs,
    rootGraphId: rootGid,
    ciCount: idx.names.length,
    relCount: idx.relations.length,
    levels: maxDepth,
  }
}

/** Mode plat : tous les CI et toutes les relations dans une seule vue. */
function buildFlat(idx: CmdbIndex): Built {
  const rootGid = `g_${nanoid(6)}`
  const graph = makeGraph(idx, rootGid, 'CMDB — Relations', idx.names, undefined, new Map())
  return {
    graphs: { [rootGid]: graph },
    rootGraphId: rootGid,
    ciCount: idx.names.length,
    relCount: idx.relations.length,
    levels: 1,
  }
}

/* -------------------------------------------------------------------------- */

export interface CmdbImportResult {
  project: Project
  ciCount: number
  relCount: number
  levels: number
}

/** Construit un projet Architecturo à partir d'un export CMDB. */
export function parseCmdb(
  text: string,
  name = 'Import CMDB',
  opts: { hierarchical?: boolean } = {},
): CmdbImportResult {
  const relations = extractRelations(text)
  if (relations.length === 0) {
    throw new Error(
      'Aucune relation trouvée. Attendu : un export cmdb_rel_ci (JSON ou CSV) avec parent / child / type.',
    )
  }
  const idx = buildIndex(relations)
  const built =
    opts.hierarchical === false ? buildFlat(idx) : buildHierarchy(idx) ?? buildFlat(idx)

  const ts = new Date().toISOString()
  const project: Project = {
    id: `p_${nanoid(6)}`,
    name,
    version: 1,
    rootGraphId: built.rootGraphId,
    graphs: built.graphs,
    createdAt: ts,
    updatedAt: ts,
  }
  return { project, ciCount: built.ciCount, relCount: built.relCount, levels: built.levels }
}

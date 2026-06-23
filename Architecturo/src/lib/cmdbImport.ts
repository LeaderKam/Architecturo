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
 * Chaque CI distinct devient un Objet ; chaque relation, un lien orienté
 * parent → enfant étiqueté par le type de relation. Si la classe du CI est
 * fournie (`sys_class_name`), on lui applique une icône + couleur cohérentes.
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

export interface CmdbImportResult {
  project: Project
  ciCount: number
  relCount: number
}

/** Construit un projet Architecturo (une vue macro) à partir d'un export CMDB. */
export function parseCmdb(text: string, name = 'Import CMDB'): CmdbImportResult {
  const relations = extractRelations(text)
  if (relations.length === 0) {
    throw new Error(
      'Aucune relation trouvée. Attendu : un export cmdb_rel_ci (JSON ou CSV) avec parent / child / type.',
    )
  }

  const nodeByName = new Map<string, ArchNode>()
  const ensure = (label: string, cls?: string): ArchNode => {
    const existing = nodeByName.get(label)
    if (existing) {
      // Complète le style si on découvre la classe plus tard.
      if (cls && !existing.data.color) Object.assign(existing.data, styleForClass(cls))
      return existing
    }
    const node: ArchNode = {
      id: `n_${nanoid(6)}`,
      type: 'arch',
      position: { x: 0, y: 0 },
      data: { label, kind: 'object', fields: [], ...styleForClass(cls) },
    }
    nodeByName.set(label, node)
    return node
  }

  const edges: ArchEdge[] = []
  const seen = new Set<string>()
  for (const r of relations) {
    const p = ensure(r.parent, r.parentClass)
    const c = ensure(r.child, r.childClass)
    const key = `${p.id}->${c.id}:${r.type ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    edges.push(
      applyDirection(
        {
          id: `e_${nanoid(6)}`,
          source: p.id,
          target: c.id,
          label: relLabel(r.type),
          animated: true,
          type: 'smoothstep',
        },
        'forward',
      ),
    )
  }

  // Agencement automatique en couches (respecte le sens des relations).
  const nodes = layoutGraph([...nodeByName.values()], edges)

  const rootId = `g_${nanoid(6)}`
  const ts = new Date().toISOString()
  const root: Graph = { id: rootId, title: 'CMDB — Relations', nodes, edges }
  const project: Project = {
    id: `p_${nanoid(6)}`,
    name,
    version: 1,
    rootGraphId: rootId,
    graphs: { [rootId]: root },
    createdAt: ts,
    updatedAt: ts,
  }
  return { project, ciCount: nodeByName.size, relCount: edges.length }
}

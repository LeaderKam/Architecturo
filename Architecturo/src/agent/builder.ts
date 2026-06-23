import { nanoid } from 'nanoid'
import type { ArchEdge, ArchNode, EdgeDirection, NodeKind } from '../types'
import { ICON_KEYS } from '../lib/icons'
import { applyDirection } from '../store'
import type { AgentConfig } from './config'

export interface BuildResult {
  nodes: ArchNode[]
  edges: ArchEdge[]
  /** Explication lisible de ce que l'agent a construit. */
  rationale: string
}

/** Représentation neutre produite par un provider, avant matérialisation. */
interface DraftGraph {
  nodes: {
    id: string
    label: string
    description?: string
    /** Clé d'icône (cf. lib/icons.ts) — optionnelle. */
    icon?: string
    /** Couleur d'accent hex — optionnelle. */
    color?: string
  }[]
  edges: { source: string; target: string; label?: string; direction?: EdgeDirection }[]
  rationale?: string
}

const HEX = /^#[0-9a-fA-F]{3,8}$/

/** Transforme un brouillon (LLM ou heuristique) en nœuds/arêtes prêts pour le store. */
function materialize(draft: DraftGraph): BuildResult {
  const idMap = new Map<string, string>()
  const nodes: ArchNode[] = draft.nodes.map((dn, i) => {
    const realId = `n_${nanoid(6)}`
    idMap.set(dn.id, realId)
    const icon = dn.icon && ICON_KEYS.includes(dn.icon) ? dn.icon : undefined
    const color = dn.color && HEX.test(dn.color) ? dn.color : undefined
    return {
      id: realId,
      type: 'arch',
      position: { x: 80 + (i % 3) * 300, y: 80 + Math.floor(i / 3) * 200 },
      data: { label: dn.label, kind: 'object' as NodeKind, description: dn.description, icon, color, fields: [] },
    }
  })

  const edges: ArchEdge[] = draft.edges
    .filter((e) => idMap.has(e.source) && idMap.has(e.target))
    .map((e) =>
      applyDirection(
        {
          id: `e_${nanoid(6)}`,
          source: idMap.get(e.source)!,
          target: idMap.get(e.target)!,
          label: e.label,
          animated: true,
          type: 'smoothstep',
        },
        e.direction ?? 'forward',
      ),
    )

  return {
    nodes,
    edges,
    rationale:
      draft.rationale ??
      `J'ai généré ${nodes.length} composants et ${edges.length} liens. Éditez-les librement, puis créez des vues détaillées au besoin.`,
  }
}

/* -------------------------------------------------------------------------- */
/*  Provider local (heuristique) — hors-ligne, sans clé API.                   */
/* -------------------------------------------------------------------------- */

function buildLocal(prompt: string): DraftGraph {
  const p = prompt.toLowerCase()
  const nodes: DraftGraph['nodes'] = []
  const edges: DraftGraph['edges'] = []
  let i = 0
  // icon = clé d'icône (cf. lib/icons.ts) ; chaque nœud reste un `object`.
  const add = (icon: string, label: string, description?: string) => {
    const id = `l${i++}`
    nodes.push({ id, label, description, icon })
    return id
  }
  const wants = (...keys: string[]) => keys.some((k) => p.includes(k))

  const trigger = wants('webhook', 'inbound', 'entrant', 'reçoit')
    ? add('code', 'Scripted REST API', 'Point d\'entrée entrant (inbound).')
    : add('workflow', 'Business Rule', 'Déclencheur serveur sur la table cible.')

  if (wants('rest', 'api', 'http', 'sortant', 'outbound', 'jira', 'envoie', 'post')) {
    const rm = add('send', 'REST Message', 'Appel REST sortant vers le système distant.')
    edges.push({ source: trigger, target: rm, label: 'appelle' })
  }
  if (wants('transform', 'import', 'mapping', 'mappe', 'csv', 'fichier')) {
    const ds = add('fileinput', 'Data Source', 'Source de données importée.')
    const tm = add('shuffle', 'Transform Map', 'Mapping vers la table cible.')
    edges.push({ source: ds, target: tm, label: 'alimente' })
  }
  if (wants('mid', 'on-premise', 'on premise', 'interne')) {
    add('server', 'MID Server', 'Relais on-premise pour les flux internes.')
  }
  if (wants('queue', 'kafka', 'rabbit', 'bus', 'événement', 'event')) {
    const q = add('inbox', 'File / Bus', 'Bus de messages.')
    edges.push({ source: trigger, target: q, label: 'publie' })
  }
  if (wants('flow', 'orchestration', 'workflow', 'automation')) {
    const fl = add('branch', 'Flow / Action', 'Orchestration via Flow Designer.')
    edges.push({ source: trigger, target: fl, label: 'déclenche' })
  }

  const tbl = add('table', wants('incident') ? 'incident' : 'Table cible', 'Données persistées.')
  edges.push({ source: trigger, target: tbl, label: 'écrit' })

  return {
    nodes,
    edges,
    rationale: `J'ai généré ${nodes.length} composants à partir de votre description. Reliez/éditez-les librement.`,
  }
}

/* -------------------------------------------------------------------------- */
/*  Providers LLM (Claude / compatible OpenAI) — clé fournie par l'utilisateur */
/* -------------------------------------------------------------------------- */

function systemPrompt(): string {
  const icons = ICON_KEYS.join(', ')
  return [
    'Tu es un architecte d\'intégration. À partir de la description, produis un schéma d\'architecture.',
    'Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :',
    '{ "nodes": [{ "id": "n1", "label": "...", "description": "...", "icon": "send", "color": "#34d399" }],',
    '  "edges": [{ "source": "n1", "target": "n2", "label": "appelle", "direction": "forward" }],',
    '  "rationale": "courte explication en français" }',
    'Chaque nœud est une carte libre : donne-lui un "label" clair et une "description" courte.',
    `"icon" (optionnel) doit être une de ces clés : ${icons}.`,
    '"color" (optionnel) est un hex (#rrggbb) pour regrouper visuellement les nœuds de même nature.',
    'direction ∈ "forward" | "both" | "none". Les id des edges référencent les id des nodes.',
    'Sois concis : 3 à 8 nœuds pertinents.',
  ].join('\n')
}

/** Extrait le premier objet JSON d'une chaîne (les LLM ajoutent parfois du texte). */
function parseDraft(text: string): DraftGraph {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Réponse sans JSON exploitable')
  const obj = JSON.parse(text.slice(start, end + 1))
  if (!Array.isArray(obj.nodes)) throw new Error('JSON invalide (nodes manquant)')
  return { nodes: obj.nodes, edges: obj.edges ?? [], rationale: obj.rationale }
}

async function buildAnthropic(prompt: string, config: AgentConfig): Promise<DraftGraph> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model || 'claude-opus-4-8',
      max_tokens: 4096,
      system: systemPrompt(),
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status} : ${await res.text()}`)
  const data = await res.json()
  const text = (data.content ?? []).find((b: { type: string }) => b.type === 'text')?.text ?? ''
  return parseDraft(text)
}

async function buildOpenAI(prompt: string, config: AgentConfig): Promise<DraftGraph> {
  const base = config.baseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  })
  if (!res.ok) throw new Error(`Provider ${res.status} : ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  return parseDraft(text)
}

/** Point d'entrée : génère une architecture selon la config (provider). */
export async function buildArchitecture(
  prompt: string,
  config: AgentConfig,
): Promise<BuildResult> {
  let draft: DraftGraph
  switch (config.provider) {
    case 'anthropic':
      draft = await buildAnthropic(prompt, config)
      break
    case 'openai':
      draft = await buildOpenAI(prompt, config)
      break
    default:
      draft = buildLocal(prompt)
  }
  return materialize(draft)
}

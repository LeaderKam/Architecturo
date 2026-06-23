import type { ArchNode, Graph, Project } from '../types'
import { STYLE_PRESET } from './presets'

/**
 * Projet d'exemple : une architecture d'intégration ServiceNow.
 * - Vue Macro : systèmes + intégrations.
 * - L'intégration « ServiceNow ↔ Jira » se déplie (drill-down) en ses
 *   composants techniques (REST Message, Scripted REST, Business Rule…).
 */

// `preset` ne pré-remplit que la couleur + l'icône : chaque nœud reste un `object`.
const n = (
  id: string,
  preset: string,
  label: string,
  position: { x: number; y: number },
  extra: Partial<ArchNode['data']> = {},
): ArchNode => {
  const p = STYLE_PRESET[preset]
  return {
    id,
    type: 'arch',
    position,
    data: { label, kind: 'object', color: p?.color, icon: p?.icon, fields: [], ...extra },
  }
}

const DETAIL_ID = 'g_jira_detail'
const RM_DETAIL_ID = 'g_rm_detail'
const ROOT_ID = 'g_macro'

const macro: Graph = {
  id: ROOT_ID,
  title: 'Vue Macro — Intégrations',
  nodes: [
    n('sys_snow', 'system', 'ServiceNow', { x: 80, y: 200 }, {
      description: 'Instance ITSM principale',
    }),
    n('sys_jira', 'system', 'Jira', { x: 700, y: 80 }, {
      description: 'Suivi des développements',
    }),
    n('sys_ad', 'system', 'Active Directory', { x: 700, y: 360 }, {
      description: 'Annuaire d\'identités',
    }),
    n('int_jira', 'integration', 'ServiceNow ↔ Jira', { x: 400, y: 120 }, {
      description: 'Synchro bidirectionnelle des incidents/tickets',
      childGraphId: DETAIL_ID,
      fields: [
        { id: 'f1', key: 'Direction', value: 'Bidirectionnelle' },
        { id: 'f2', key: 'Protocole', value: 'REST / JSON' },
      ],
    }),
    n('int_ad', 'integration', 'Synchro Utilisateurs AD', { x: 400, y: 380 }, {
      description: 'Import quotidien des utilisateurs',
      fields: [{ id: 'f1', key: 'Fréquence', value: 'Quotidienne 02:00' }],
    }),
  ],
  edges: [
    { id: 'em1', source: 'sys_snow', target: 'int_jira', animated: true },
    { id: 'em2', source: 'int_jira', target: 'sys_jira', animated: true },
    { id: 'em3', source: 'sys_snow', target: 'int_ad', animated: true },
    { id: 'em4', source: 'int_ad', target: 'sys_ad', animated: true },
  ],
}

const jiraDetail: Graph = {
  id: DETAIL_ID,
  title: 'ServiceNow ↔ Jira — détail',
  parentGraphId: ROOT_ID,
  nodes: [
    n('br', 'businessRule', 'BR: Incident → Jira', { x: 80, y: 80 }, {
      description: 'After insert/update sur incident, déclenche l\'appel sortant.',
      fields: [
        { id: 'f1', key: 'Table', value: 'incident' },
        { id: 'f2', key: 'When', value: 'after / async' },
      ],
    }),
    n('rm', 'restMessage', 'REST Message: Jira Create Issue', { x: 460, y: 80 }, {
      description: 'POST /rest/api/2/issue vers Jira. Double-cliquez pour voir sa composition.',
      childGraphId: RM_DETAIL_ID,
      fields: [
        { id: 'f1', key: 'Method', value: 'POST' },
        { id: 'f2', key: 'Auth', value: 'Basic / API token' },
      ],
    }),
    n('sr', 'scriptedRest', 'Scripted REST: Jira Webhook', { x: 80, y: 320 }, {
      description: 'Reçoit les webhooks Jira et met à jour l\'incident.',
      fields: [{ id: 'f1', key: 'Path', value: '/api/x_jira/webhook' }],
    }),
    n('tbl', 'table', 'incident', { x: 460, y: 340 }, {
      description: 'Table cible mise à jour par le webhook.',
    }),
    n('tm', 'transformMap', 'Transform: Jira → Incident', { x: 820, y: 340 }, {
      description: 'Mappe les champs Jira vers l\'incident.',
    }),
  ],
  edges: [
    { id: 'ed1', source: 'br', target: 'rm', animated: true, label: 'appelle' },
    { id: 'ed2', source: 'sr', target: 'tm', animated: true, label: 'transmet' },
    { id: 'ed3', source: 'tm', target: 'tbl', animated: true, label: 'écrit' },
    { id: 'ed4', source: 'br', target: 'tbl', label: 'lit' },
  ],
}

// --- Niveau 3 : composition technique du REST Message ---
const rmDetail: Graph = {
  id: RM_DETAIL_ID,
  title: 'REST Message — composition',
  parentGraphId: DETAIL_ID,
  nodes: [
    n('ep', 'api', 'Endpoint Jira', { x: 80, y: 80 }, {
      description: 'https://jira/rest/api/2/issue',
      fields: [{ id: 'f1', key: 'Base URL', value: 'https://jira.example.com' }],
    }),
    n('post', 'function', 'Méthode POST: Create Issue', { x: 460, y: 80 }, {
      description: 'Construit le payload et envoie la requête.',
      fields: [{ id: 'f1', key: 'Content-Type', value: 'application/json' }],
    }),
    n('auth', 'service', 'Authentification', { x: 460, y: 320 }, {
      description: 'Jeton API en en-tête Authorization.',
      fields: [{ id: 'f1', key: 'Header', value: 'Authorization: Bearer …' }],
    }),
    n('hdr', 'custom', 'Headers & Variables', { x: 80, y: 320 }, {
      description: 'Variables substituées : ${short_description}, ${priority}.',
    }),
  ],
  edges: [
    { id: 'er1', source: 'post', target: 'ep', label: 'cible' },
    { id: 'er2', source: 'auth', target: 'post', label: 'sécurise' },
    { id: 'er3', source: 'hdr', target: 'post', label: 'alimente' },
  ],
}

export function sampleProject(): Project {
  const ts = new Date().toISOString()
  return {
    id: 'p_sample',
    name: 'Exemple — Intégrations ServiceNow',
    version: 1,
    rootGraphId: ROOT_ID,
    graphs: { [ROOT_ID]: macro, [DETAIL_ID]: jiraDetail, [RM_DETAIL_ID]: rmDetail },
    createdAt: ts,
    updatedAt: ts,
  }
}

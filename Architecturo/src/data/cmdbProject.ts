import type { ArchNode, Graph, Project } from '../types'
import { STYLE_PRESET } from './presets'

/**
 * Exemple de cartographie CMDB (style ServiceNow).
 * - Vue macro : services métier et services applicatifs + dépendances.
 * - Drill-down : les CI (Configuration Items) qui composent un service
 *   applicatif et leurs relations (« Dépend de », « Hébergé sur »…).
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

const MACRO = 'g_cmdb_macro'
const WEB_CIS = 'g_cmdb_web_cis'

const macro: Graph = {
  id: MACRO,
  title: 'CMDB — Services & dépendances',
  nodes: [
    n('bs_ecom', 'businessService', 'Service métier : E-commerce', { x: 80, y: 80 }, {
      description: 'Service métier critique exposé aux clients.',
      fields: [
        { id: 'f1', key: 'Criticité', value: '1 - Critique' },
        { id: 'f2', key: 'Responsable', value: 'Équipe Digital' },
      ],
    }),
    n('bs_rh', 'businessService', 'Service métier : Portail RH', { x: 80, y: 360 }, {
      description: 'Portail interne des ressources humaines.',
      fields: [{ id: 'f1', key: 'Criticité', value: '3 - Modérée' }],
    }),
    n('as_web', 'appService', 'App : Site Web Vente', { x: 480, y: 80 }, {
      description: 'Service applicatif du tunnel de vente. Voir ses CI.',
      childGraphId: WEB_CIS,
      fields: [{ id: 'f1', key: 'Environnement', value: 'Production' }],
    }),
    n('as_sap', 'appService', 'App : SAP RH', { x: 480, y: 360 }, {
      description: 'Service applicatif RH (paie, congés).',
    }),
    n('db_ecom', 'database', 'BD : DB-ECOM-PROD', { x: 880, y: 80 }, {
      description: 'Base transactionnelle e-commerce.',
      fields: [{ id: 'f1', key: 'SGBD', value: 'PostgreSQL 15' }],
    }),
  ],
  edges: [
    { id: 'e1', source: 'bs_ecom', target: 'as_web', label: 'Dépend de' },
    { id: 'e2', source: 'bs_rh', target: 'as_sap', label: 'Dépend de' },
    { id: 'e3', source: 'as_web', target: 'db_ecom', label: 'Se connecte à' },
  ],
}

const webCis: Graph = {
  id: WEB_CIS,
  title: 'Site Web Vente — CI',
  parentGraphId: MACRO,
  nodes: [
    n('lb', 'loadBalancer', 'LB-PROD-01', { x: 80, y: 200 }, {
      description: 'Répartiteur de charge en frontal.',
      fields: [{ id: 'f1', key: 'VIP', value: '10.0.0.10' }],
    }),
    n('web1', 'server', 'WEB-PROD-01', { x: 440, y: 80 }, {
      description: 'Serveur web (nginx).',
      fields: [{ id: 'f1', key: 'OS', value: 'RHEL 9' }],
    }),
    n('web2', 'server', 'WEB-PROD-02', { x: 440, y: 320 }, {
      description: 'Serveur web (nginx).',
      fields: [{ id: 'f1', key: 'OS', value: 'RHEL 9' }],
    }),
    n('app1', 'server', 'APP-PROD-01', { x: 800, y: 200 }, {
      description: 'Serveur applicatif (Node.js).',
    }),
    n('san', 'storage', 'SAN-PROD-01', { x: 1140, y: 200 }, {
      description: 'Baie de stockage partagée.',
    }),
  ],
  edges: [
    { id: 'c1', source: 'lb', target: 'web1', label: 'Équilibre vers' },
    { id: 'c2', source: 'lb', target: 'web2', label: 'Équilibre vers' },
    { id: 'c3', source: 'web1', target: 'app1', label: 'Appelle' },
    { id: 'c4', source: 'web2', target: 'app1', label: 'Appelle' },
    { id: 'c5', source: 'app1', target: 'san', label: 'Hébergé sur' },
  ],
}

export function cmdbProject(): Project {
  const ts = new Date().toISOString()
  return {
    id: 'p_cmdb',
    name: 'Cartographie CMDB — exemple',
    version: 1,
    rootGraphId: MACRO,
    graphs: { [MACRO]: macro, [WEB_CIS]: webCis },
    createdAt: ts,
    updatedAt: ts,
  }
}

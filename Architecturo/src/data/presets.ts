/**
 * Presets de style utilisés UNIQUEMENT pour amorcer les projets d'exemple.
 * Ce ne sont pas des « types » : chaque nœud reste un `object` librement
 * éditable. La clé (ex. 'restMessage') sert juste à pré-remplir couleur + icône.
 */
export const STYLE_PRESET: Record<string, { color: string; icon: string }> = {
  // génériques / intégration
  system: { color: '#818cf8', icon: 'boxes' },
  integration: { color: '#22d3ee', icon: 'cable' },
  api: { color: '#34d399', icon: 'plug' },
  service: { color: '#38bdf8', icon: 'cog' },
  function: { color: '#facc15', icon: 'braces' },
  database: { color: '#2dd4bf', icon: 'database' },
  storage: { color: '#94a3b8', icon: 'harddrive' },
  table: { color: '#9ca3af', icon: 'table' },
  custom: { color: '#d1d5db', icon: 'component' },
  // ServiceNow
  businessRule: { color: '#f472b6', icon: 'workflow' },
  restMessage: { color: '#34d399', icon: 'send' },
  scriptedRest: { color: '#f59e0b', icon: 'code' },
  transformMap: { color: '#c084fc', icon: 'shuffle' },
  // CMDB
  businessService: { color: '#f59e0b', icon: 'building' },
  appService: { color: '#a78bfa', icon: 'layers' },
  server: { color: '#60a5fa', icon: 'server' },
  loadBalancer: { color: '#2dd4bf', icon: 'waypoints' },
}

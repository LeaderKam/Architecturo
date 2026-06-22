/** Configuration de l'agent : provider + identifiants. Stockée en local. */

export type ProviderId = 'local' | 'anthropic' | 'openai'

export interface AgentConfig {
  provider: ProviderId
  apiKey: string
  /** Modèle à utiliser (ignoré pour le provider local). */
  model: string
  /** URL de base pour un provider compatible OpenAI (ex. http://localhost:11434/v1). */
  baseUrl: string
}

export interface ProviderMeta {
  id: ProviderId
  label: string
  needsKey: boolean
  needsBaseUrl: boolean
  defaultModel: string
  /** Lien doc pour récupérer une clé, si pertinent. */
  help?: string
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'local',
    label: 'Heuristique locale (sans clé)',
    needsKey: false,
    needsBaseUrl: false,
    defaultModel: '',
  },
  {
    id: 'anthropic',
    label: 'Claude (Anthropic)',
    needsKey: true,
    needsBaseUrl: false,
    defaultModel: 'claude-opus-4-8',
    help: 'console.anthropic.com → API Keys',
  },
  {
    id: 'openai',
    label: 'Compatible OpenAI (OpenAI, Ollama, LM Studio…)',
    needsKey: true,
    needsBaseUrl: true,
    defaultModel: 'gpt-4o-mini',
    help: 'Renseignez l\'URL de base /v1 et la clé du fournisseur',
  },
]

export function providerMeta(id: ProviderId): ProviderMeta {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]
}

const STORAGE_KEY = 'architecturo:agent-config'

export const defaultConfig: AgentConfig = {
  provider: 'local',
  apiKey: '',
  model: '',
  baseUrl: 'https://api.openai.com/v1',
}

export function loadConfig(): AgentConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultConfig
    return { ...defaultConfig, ...JSON.parse(raw) }
  } catch {
    return defaultConfig
  }
}

export function saveConfig(config: AgentConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    /* ignore */
  }
}

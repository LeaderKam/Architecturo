import { useState } from 'react'
import { Sparkles, X, Wand2, Loader2, Settings2, AlertTriangle } from 'lucide-react'
import { useStore } from '../store'
import { buildArchitecture } from './builder'
import { useReactFlow } from '@xyflow/react'
import {
  PROVIDERS,
  loadConfig,
  providerMeta,
  saveConfig,
  type AgentConfig,
  type ProviderId,
} from './config'

const EXAMPLES = [
  'Intégration ServiceNow vers Jira : business rule sur incident qui appelle un REST Message sortant.',
  'API entrante (Scripted REST) recevant un webhook, puis transform map vers la table incident.',
  'Microservice de paiement publiant sur un bus d\'événements, consommé par un service de notification.',
]

export function AgentPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const append = useStore((s) => s.appendToCurrentGraph)
  const { fitView } = useReactFlow()
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState<AgentConfig>(() => loadConfig())

  const meta = providerMeta(config.provider)

  const update = (patch: Partial<AgentConfig>) => {
    const next = { ...config, ...patch }
    setConfig(next)
    saveConfig(next)
  }

  const onProviderChange = (provider: ProviderId) => {
    const m = providerMeta(provider)
    update({ provider, model: config.model || m.defaultModel })
  }

  const run = async () => {
    if (!prompt.trim()) return
    if (meta.needsKey && !config.apiKey.trim()) {
      setShowSettings(true)
      setError('Renseignez votre clé API dans les réglages.')
      return
    }
    setBusy(true)
    setResult(null)
    setError(null)
    try {
      const built = await buildArchitecture(prompt, config)
      append(built.nodes, built.edges)
      setResult(built.rationale)
      setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 60)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="absolute inset-0 z-20 flex animate-fade-in justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-[420px] animate-scale-in flex-col border-l border-line bg-panel shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <Sparkles size={15} />
            </span>
            <div>
              <h2 className="text-[13px] font-semibold text-slate-100">Agent constructeur</h2>
              <p className="text-[10px] text-slate-500">{meta.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings((v) => !v)}
              title="Réglages du provider"
              className={`rounded-md p-1.5 transition-colors ${
                showSettings ? 'bg-panel-2 text-accent' : 'text-slate-500 hover:bg-panel-2 hover:text-slate-300'
              }`}
            >
              <Settings2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-500 hover:bg-panel-2 hover:text-slate-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="space-y-3 border-b border-line bg-panel-2/50 px-4 py-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-400">Provider</span>
              <select
                value={config.provider}
                onChange={(e) => onProviderChange(e.target.value as ProviderId)}
                className="ipt"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            {meta.needsBaseUrl && (
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-400">URL de base</span>
                <input
                  value={config.baseUrl}
                  onChange={(e) => update({ baseUrl: e.target.value })}
                  className="ipt"
                  placeholder="https://api.openai.com/v1"
                />
              </label>
            )}

            {meta.needsKey && (
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-400">Clé API</span>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => update({ apiKey: e.target.value })}
                  className="ipt"
                  placeholder="sk-…"
                  autoComplete="off"
                />
                {meta.help && (
                  <span className="mt-1 block text-[10px] text-slate-500">{meta.help}</span>
                )}
              </label>
            )}

            {meta.needsKey && (
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-400">Modèle</span>
                <input
                  value={config.model}
                  onChange={(e) => update({ model: e.target.value })}
                  className="ipt"
                  placeholder={meta.defaultModel}
                />
              </label>
            )}

            {meta.needsKey && (
              <p className="text-[10px] leading-relaxed text-slate-500">
                La clé est stockée en local sur cet appareil et envoyée uniquement au provider.
                Elle n'est jamais incluse dans l'export ou le partage.
              </p>
            )}
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scroll-thin">
          <p className="text-[12px] leading-relaxed text-slate-400">
            Décrivez l'intégration à construire. L'agent génère les composants et leurs
            relations directement dans la vue courante.
          </p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="ipt resize-none"
            placeholder="Ex. : intégration ServiceNow → Jira avec business rule et REST message sortant…"
          />

          <button
            onClick={run}
            disabled={busy || !prompt.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            {busy ? 'Génération…' : 'Générer l\'architecture'}
          </button>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] leading-relaxed text-rose-200">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[12px] leading-relaxed text-emerald-200">
              {result}
            </div>
          )}

          <div>
            <div className="mb-1.5 text-[11px] font-medium text-slate-500">Exemples</div>
            <div className="space-y-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="block w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-left text-[11px] leading-snug text-slate-400 transition-colors hover:border-accent hover:text-slate-200"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

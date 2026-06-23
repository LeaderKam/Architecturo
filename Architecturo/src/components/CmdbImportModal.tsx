import { useRef, useState } from 'react'
import { Database, Upload, X } from 'lucide-react'
import { useStore } from '../store'
import { parseCmdb } from '../lib/cmdbImport'

const SAMPLE = `{
  "result": [
    { "parent": {"display_value": "App : Site Web Vente", "sys_class_name": "cmdb_ci_service_auto"},
      "child":  {"display_value": "LB-PROD-01", "sys_class_name": "cmdb_ci_lb"},
      "type":   {"display_value": "Depends on::Used by"} },
    { "parent": {"display_value": "LB-PROD-01"},
      "child":  {"display_value": "WEB-PROD-01", "sys_class_name": "cmdb_ci_server"},
      "type":   {"display_value": "Balanced by::Balances"} }
  ]
}`

export function CmdbImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const loadProject = useStore((s) => s.loadProject)
  const [text, setText] = useState('')
  const [hierarchical, setHierarchical] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const doImport = (raw: string) => {
    try {
      const { project, ciCount, relCount, levels } = parseCmdb(raw, 'Import CMDB', { hierarchical })
      const niv = levels > 1 ? ` · ${levels} niveaux` : ''
      project.name = `Import CMDB — ${ciCount} CI / ${relCount} relations${niv}`
      loadProject(project)
      setText('')
      setError(null)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => doImport(String(reader.result))
    reader.readAsText(file)
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <Database size={16} />
            </span>
            <h2 className="text-[13px] font-semibold text-slate-100">Importer une CMDB</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-panel-2 hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 scroll-thin">
          <p className="text-[12px] leading-relaxed text-slate-400">
            Collez un export de la table <code className="text-slate-300">cmdb_rel_ci</code> (JSON
            de l'API REST avec <code className="text-slate-300">sysparm_display_value=true</code>,
            ou CSV avec colonnes <em>parent / child / type</em>). Chaque CI devient un objet,
            chaque relation un lien orienté.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            rows={12}
            placeholder={SAMPLE}
            className="ipt resize-none font-mono text-[11px] leading-relaxed"
          />

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setText(SAMPLE)}
              className="text-[11px] text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
            >
              Insérer un exemple
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-400">
              <input
                type="checkbox"
                checked={hierarchical}
                onChange={(e) => setHierarchical(e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              Générer les niveaux (drill-down par CI)
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[12px] font-medium text-slate-300 transition-colors hover:bg-panel-2 hover:text-slate-100"
          >
            <Upload size={14} /> Charger un fichier (.json / .csv)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            onChange={onFile}
            className="hidden"
          />
          <button
            onClick={() => doImport(text)}
            disabled={!text.trim()}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Database size={14} /> Importer
          </button>
        </div>
      </div>
    </div>
  )
}

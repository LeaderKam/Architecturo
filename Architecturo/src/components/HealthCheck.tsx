import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import { useStore } from '../store'
import { validateProject } from '../lib/validate'

/** Pastille « santé du schéma » : liste les problèmes et permet d'y aller. */
export function HealthCheck() {
  const project = useStore((s) => s.project)
  const revealNode = useStore((s) => s.revealNode)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const issues = useMemo(() => validateProject(project), [project])
  const errors = issues.filter((i) => i.level === 'error').length
  const ok = issues.length === 0

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Santé du schéma"
        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
          ok
            ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
            : errors > 0
              ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
              : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
        }`}
      >
        {ok ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}
        <span className="hidden sm:inline">{ok ? 'OK' : `${issues.length}`}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-80 animate-scale-in overflow-hidden rounded-lg border border-line bg-panel-2 shadow-panel">
          <div className="border-b border-line px-3 py-2 text-[11px] font-semibold text-slate-300">
            Santé du schéma
          </div>
          {ok ? (
            <div className="flex items-center gap-2 px-3 py-4 text-[12px] text-emerald-400">
              <CheckCircle2 size={15} /> Aucun problème détecté.
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1 scroll-thin">
              {issues.map((i) => (
                <li key={i.id}>
                  <button
                    onClick={() => {
                      revealNode(i.graphId, i.nodeId ?? '')
                      setOpen(false)
                    }}
                    className="flex w-full items-start gap-2 px-3 py-1.5 text-left text-[12px] text-slate-300 transition-colors hover:bg-panel"
                  >
                    {i.level === 'error' ? (
                      <XCircle size={14} className="mt-0.5 shrink-0 text-rose-400" />
                    ) : (
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                    )}
                    <span>{i.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

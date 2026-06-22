import { useEffect, useState } from 'react'
import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { Palette } from './components/Palette'
import { Inspector } from './components/Inspector'
import { Breadcrumb } from './components/Breadcrumb'
import { AgentPanel } from './agent/AgentPanel'
import { HelpModal } from './components/HelpModal'
import { Dashboard } from './components/Dashboard'
import { useStore } from './store'
import { readProjectFromHash } from './lib/io'

export default function App() {
  const loadProject = useStore((s) => s.loadProject)
  const currentGraph = useStore((s) => s.currentGraph())
  const view = useStore((s) => s.view)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const [agentOpen, setAgentOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Au démarrage : charger un projet partagé via l'URL, s'il existe.
  useEffect(() => {
    const shared = readProjectFromHash()
    if (shared) {
      loadProject(shared)
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [loadProject])

  // Raccourcis Annuler / Refaire (hors saisie dans un champ).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  if (view === 'dashboard') return <Dashboard />

  return (
    <div className="flex h-screen animate-fade-in flex-col bg-canvas">
      <Toolbar onOpenAgent={() => setAgentOpen(true)} onOpenHelp={() => setHelpOpen(true)} />

      <div className="flex min-h-0 flex-1">
        {/* Palette gauche */}
        <aside className="w-60 shrink-0 border-r border-line bg-panel">
          <Palette />
        </aside>

        {/* Zone centrale */}
        <main className="relative min-w-0 flex-1">
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-3 border-b border-line bg-panel/80 px-4 py-2 backdrop-blur">
            <Breadcrumb />
            <span className="ml-auto text-[11px] text-slate-500">
              {currentGraph.nodes.length} objets · {currentGraph.edges.length} liens
            </span>
          </div>
          <div className="absolute inset-0 pt-[41px]">
            <Canvas />
          </div>
          <AgentPanel open={agentOpen} onClose={() => setAgentOpen(false)} />
          <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        </main>

        {/* Inspecteur droite */}
        <aside className="w-72 shrink-0 border-l border-line bg-panel">
          <Inspector />
        </aside>
      </div>
    </div>
  )
}

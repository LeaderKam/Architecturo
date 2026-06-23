import { useEffect, useState } from 'react'
import { Minimize2 } from 'lucide-react'
import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { Palette } from './components/Palette'
import { Inspector } from './components/Inspector'
import { Breadcrumb } from './components/Breadcrumb'
import { SearchBox } from './components/SearchBox'
import { HealthCheck } from './components/HealthCheck'
import { CmdbImportModal } from './components/CmdbImportModal'
import { OverviewModal } from './components/OverviewModal'
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
  const duplicateNode = useStore((s) => s.duplicateNode)
  const [agentOpen, setAgentOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [cmdbOpen, setCmdbOpen] = useState(false)
  const [overviewOpen, setOverviewOpen] = useState(false)
  const [presenting, setPresenting] = useState(false)

  // Au démarrage : charger un projet partagé via l'URL, s'il existe.
  useEffect(() => {
    const shared = readProjectFromHash()
    if (shared) {
      loadProject(shared)
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [loadProject])

  // Raccourcis clavier (hors saisie dans un champ).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && presenting) {
        setPresenting(false)
        return
      }
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (k === 'd') {
        const id = useStore.getState().selectedNodeId
        if (id) {
          e.preventDefault()
          duplicateNode(id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, duplicateNode, presenting])

  if (view === 'dashboard') return <Dashboard />

  return (
    <div className="flex h-screen animate-fade-in flex-col bg-canvas">
      {!presenting && (
        <Toolbar
          onOpenAgent={() => setAgentOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
          onPresent={() => setPresenting(true)}
          onImportCmdb={() => setCmdbOpen(true)}
          onOverview={() => setOverviewOpen(true)}
        />
      )}

      <div className="flex min-h-0 flex-1">
        {/* Palette gauche */}
        {!presenting && (
          <aside className="w-60 shrink-0 border-r border-line bg-panel">
            <Palette />
          </aside>
        )}

        {/* Zone centrale */}
        <main className="relative min-w-0 flex-1">
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-3 border-b border-line bg-panel/80 px-4 py-2 backdrop-blur">
            <Breadcrumb />
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-[11px] text-slate-500 sm:inline">
                {currentGraph.nodes.length} objets · {currentGraph.edges.length} liens
              </span>
              {presenting ? (
                <button
                  onClick={() => setPresenting(false)}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-panel-2 hover:text-slate-100"
                >
                  <Minimize2 size={13} /> Quitter (Échap)
                </button>
              ) : (
                <>
                  <HealthCheck />
                  <SearchBox />
                </>
              )}
            </div>
          </div>
          <div className="absolute inset-0 pt-[41px]">
            <Canvas />
          </div>
          <AgentPanel open={agentOpen} onClose={() => setAgentOpen(false)} />
          <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
          <CmdbImportModal open={cmdbOpen} onClose={() => setCmdbOpen(false)} />
        </main>

        {/* Inspecteur droite */}
        {!presenting && (
          <aside className="w-72 shrink-0 border-l border-line bg-panel">
            <Inspector />
          </aside>
        )}
      </div>

      <OverviewModal open={overviewOpen} onClose={() => setOverviewOpen(false)} />
    </div>
  )
}

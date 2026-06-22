import {
  Boxes,
  Cable,
  Copy,
  Download,
  FilePlus2,
  Layers,
  PlayCircle,
  Trash2,
  Upload,
} from 'lucide-react'
import { useReactFlow } from '@xyflow/react'
import { useStore } from '../store'
import { exportProject, importProjectFromFile } from '../lib/io'
import { runGuidedTour } from '../lib/demo'
import type { Project } from '../types'

function stats(p: Project) {
  const graphs = Object.values(p.graphs)
  return {
    levels: graphs.length,
    nodes: graphs.reduce((a, g) => a + g.nodes.length, 0),
    edges: graphs.reduce((a, g) => a + g.edges.length, 0),
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function Dashboard() {
  const library = useStore((s) => s.library)
  const openProject = useStore((s) => s.openProject)
  const newProject = useStore((s) => s.newProject)
  const loadProject = useStore((s) => s.loadProject)
  const deleteProject = useStore((s) => s.deleteProject)
  const duplicateProject = useStore((s) => s.duplicateProject)
  const { fitView, setCenter } = useReactFlow()

  const projects = Object.values(library).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const handleImport = async () => {
    try {
      loadProject(await importProjectFromFile())
    } catch (e) {
      alert(`Import impossible : ${(e as Error).message}`)
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-canvas scroll-thin">
      {/* En-tête */}
      <header className="border-b border-line bg-panel/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
              <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <rect x="6" y="6" width="8" height="8" rx="1.5" />
                <rect x="18" y="18" width="8" height="8" rx="1.5" />
                <path d="M14 10h4a3 3 0 0 1 3 3v5" />
              </svg>
            </div>
            <div>
              <h1 className="text-[16px] font-semibold text-slate-100">Architecturo</h1>
              <p className="text-[11px] text-slate-500">Vos schémas d'architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => runGuidedTour({ fitView, setCenter })}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <PlayCircle size={15} /> Démo animée
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12px] font-medium text-slate-300 transition-colors hover:bg-panel-2"
            >
              <Upload size={15} /> Importer
            </button>
            <button
              onClick={newProject}
              className="flex items-center gap-1.5 rounded-lg bg-panel-2 px-3 py-2 text-[12px] font-medium text-slate-100 transition-colors hover:bg-[#252a3d]"
            >
              <FilePlus2 size={15} /> Nouveau
            </button>
          </div>
        </div>
      </header>

      {/* Grille de schémas */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const st = stats(p)
            return (
              <div
                key={p.id}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group animate-fade-up overflow-hidden rounded-2xl border border-line bg-panel transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-panel"
              >
                <button
                  onClick={() => openProject(p.id)}
                  className="block w-full p-5 text-left"
                >
                  {/* Mini aperçu décoratif */}
                  <div className="mb-4 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-panel-2 to-canvas">
                    <div className="flex items-center gap-2 text-slate-600 transition-transform group-hover:scale-110">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                        <Boxes size={18} />
                      </span>
                      <span className="h-px w-6 bg-line" />
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-panel text-slate-400">
                        <Cable size={14} />
                      </span>
                    </div>
                  </div>
                  <h3 className="truncate text-[14px] font-semibold text-slate-100">{p.name}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Modifié le {formatDate(p.updatedAt)}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Boxes size={12} /> {st.nodes} objets
                    </span>
                    <span className="flex items-center gap-1">
                      <Cable size={12} /> {st.edges} liens
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers size={12} /> {st.levels} vues
                    </span>
                  </div>
                </button>
                <div className="flex items-center gap-1 border-t border-line px-3 py-2">
                  <CardAction icon={Copy} label="Dupliquer" onClick={() => duplicateProject(p.id)} />
                  <CardAction icon={Download} label="Exporter" onClick={() => exportProject(p)} />
                  <CardAction
                    icon={Trash2}
                    label="Supprimer"
                    danger
                    onClick={() => {
                      if (confirm(`Supprimer « ${p.name} » ?`)) deleteProject(p.id)
                    }}
                  />
                </div>
              </div>
            )
          })}

          {/* Carte "nouveau" */}
          <button
            onClick={newProject}
            style={{ animationDelay: `${projects.length * 60}ms` }}
            className="flex min-h-[260px] animate-fade-up flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-slate-500 transition-colors hover:border-accent/50 hover:text-slate-300"
          >
            <FilePlus2 size={26} />
            <span className="text-[13px] font-medium">Nouveau schéma</span>
          </button>
        </div>
      </main>
    </div>
  )
}

function CardAction({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Copy
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
        danger
          ? 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-400'
          : 'text-slate-400 hover:bg-panel-2 hover:text-slate-200'
      }`}
    >
      <Icon size={13} /> {label}
    </button>
  )
}

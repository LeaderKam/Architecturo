import { useState } from 'react'
import {
  Check,
  Download,
  FilePlus2,
  HelpCircle,
  LayoutGrid,
  Share2,
  Sparkles,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '../store'
import {
  buildShareLink,
  exportProject,
  importProjectFromFile,
} from '../lib/io'

export function Toolbar({
  onOpenAgent,
  onOpenHelp,
}: {
  onOpenAgent: () => void
  onOpenHelp: () => void
}) {
  const project = useStore((s) => s.project)
  const renameProject = useStore((s) => s.renameProject)
  const newProject = useStore((s) => s.newProject)
  const loadProject = useStore((s) => s.loadProject)
  const goDashboard = useStore((s) => s.goDashboard)
  const [copied, setCopied] = useState(false)

  const handleImport = async () => {
    try {
      const p = await importProjectFromFile()
      loadProject(p)
    } catch (e) {
      alert(`Import impossible : ${(e as Error).message}`)
    }
  }

  const handleShare = async () => {
    const link = buildShareLink(project)
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('Copiez ce lien de partage :', link)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={goDashboard}
          title="Mes schémas"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white transition-transform hover:scale-105"
        >
          <LayoutGrid size={17} />
        </button>
        <div className="hidden sm:block">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Architecturo
          </div>
          <input
            value={project.name}
            onChange={(e) => renameProject(e.target.value)}
            className="-ml-1 w-64 rounded-md bg-transparent px-1 text-[14px] font-semibold text-slate-100 outline-none hover:bg-panel-2 focus:bg-panel-2"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <TbBtn onClick={newProject} icon={FilePlus2} label="Nouveau" />
        <TbBtn onClick={handleImport} icon={Upload} label="Importer" />
        <TbBtn onClick={() => exportProject(project)} icon={Download} label="Exporter" />
        <TbBtn
          onClick={handleShare}
          icon={copied ? Check : Share2}
          label={copied ? 'Copié !' : 'Partager'}
          primary={copied}
        />
        <TbBtn onClick={onOpenHelp} icon={HelpCircle} label="Aide" />
        <div className="mx-1 h-6 w-px bg-line" />
        <button
          onClick={onOpenAgent}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
        >
          <Sparkles size={14} /> Agent
        </button>
      </div>
    </header>
  )
}

function TbBtn({
  onClick,
  icon: Icon,
  label,
  primary,
}: {
  onClick: () => void
  icon: LucideIcon
  label: string
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
        primary
          ? 'text-emerald-400'
          : 'text-slate-300 hover:bg-panel-2 hover:text-slate-100'
      }`}
    >
      <Icon size={14} />
      <span className="hidden md:inline">{label}</span>
    </button>
  )
}

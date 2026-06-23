import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Download,
  FileJson,
  FileImage,
  FilePlus2,
  HelpCircle,
  LayoutGrid,
  Maximize2,
  Network,
  Redo2,
  Share2,
  Sparkles,
  Undo2,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { useReactFlow } from '@xyflow/react'
import { useStore } from '../store'
import {
  buildShareLink,
  exportProject,
  importProjectFromFile,
} from '../lib/io'
import { exportPng } from '../lib/exportImage'

export function Toolbar({
  onOpenAgent,
  onOpenHelp,
  onPresent,
}: {
  onOpenAgent: () => void
  onOpenHelp: () => void
  onPresent: () => void
}) {
  const project = useStore((s) => s.project)
  const renameProject = useStore((s) => s.renameProject)
  const newProject = useStore((s) => s.newProject)
  const loadProject = useStore((s) => s.loadProject)
  const goDashboard = useStore((s) => s.goDashboard)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const autoLayout = useStore((s) => s.autoLayout)
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)
  const rf = useReactFlow()

  const handleLayout = () => {
    autoLayout()
    // Laisse React Flow appliquer les nouvelles positions avant de recadrer.
    setTimeout(() => rf.fitView({ padding: 0.2, duration: 400 }), 0)
  }
  const [copied, setCopied] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

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
        <TbBtn onClick={undo} icon={Undo2} label="Annuler" iconOnly disabled={!canUndo} title="Annuler (Ctrl/⌘+Z)" />
        <TbBtn onClick={redo} icon={Redo2} label="Refaire" iconOnly disabled={!canRedo} title="Refaire (Ctrl/⌘+Maj+Z)" />
        <TbBtn onClick={handleLayout} icon={Network} label="Réorganiser" title="Réorganiser le schéma (agencement automatique)" />
        <div className="mx-1 h-6 w-px bg-line" />
        <TbBtn onClick={newProject} icon={FilePlus2} label="Nouveau" />
        <TbBtn onClick={handleImport} icon={Upload} label="Importer" />

        {/* Menu d'export */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-300 transition-colors hover:bg-panel-2 hover:text-slate-100"
          >
            <Download size={14} />
            <span className="hidden md:inline">Exporter</span>
            <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 z-30 mt-1 w-48 animate-scale-in overflow-hidden rounded-lg border border-line bg-panel-2 py-1 shadow-panel">
              <ExportItem icon={FileJson} label="JSON (.json)" onClick={() => { exportProject(project); setExportOpen(false) }} />
              <ExportItem icon={FileImage} label="Image PNG (.png)" onClick={() => { exportPng(rf, project.name); setExportOpen(false) }} />
            </div>
          )}
        </div>

        <TbBtn
          onClick={handleShare}
          icon={copied ? Check : Share2}
          label={copied ? 'Copié !' : 'Partager'}
          primary={copied}
        />
        <TbBtn onClick={onPresent} icon={Maximize2} label="Présenter" title="Mode présentation (Échap pour quitter)" />
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
  iconOnly,
  disabled,
  title,
}: {
  onClick: () => void
  icon: LucideIcon
  label: string
  primary?: boolean
  iconOnly?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        primary
          ? 'text-emerald-400'
          : 'text-slate-300 hover:bg-panel-2 hover:text-slate-100'
      }`}
    >
      <Icon size={14} />
      {!iconOnly && <span className="hidden md:inline">{label}</span>}
    </button>
  )
}

function ExportItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] text-slate-300 transition-colors hover:bg-panel hover:text-slate-100"
    >
      <Icon size={14} className="text-slate-500" />
      {label}
    </button>
  )
}

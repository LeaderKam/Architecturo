import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useReactFlow } from '@xyflow/react'
import { useStore } from '../store'
import { kindDef } from '../lib/nodeCatalog'
import { iconByKey } from '../lib/icons'
import type { ArchNode } from '../types'

interface Hit {
  graphId: string
  graphTitle: string
  node: ArchNode
}

export function SearchBox() {
  const project = useStore((s) => s.project)
  const revealNode = useStore((s) => s.revealNode)
  const { setCenter } = useReactFlow()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // Recherche sur l'ensemble du projet (tous les niveaux).
  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Hit[] = []
    for (const g of Object.values(project.graphs)) {
      for (const node of g.nodes) {
        const d = node.data
        const hay = [
          d.label,
          d.description ?? '',
          kindDef(d.kind).label,
          ...(d.fields ?? []).flatMap((f) => [f.key, f.value]),
        ]
          .join(' ')
          .toLowerCase()
        if (hay.includes(q)) out.push({ graphId: g.id, graphTitle: g.title, node })
        if (out.length >= 20) return out
      }
    }
    return out
  }, [query, project])

  useEffect(() => setActive(0), [query])

  // Raccourci Ctrl/⌘+K pour focaliser la recherche.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fermer au clic extérieur.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const go = (hit: Hit) => {
    revealNode(hit.graphId, hit.node.id)
    const w = 240
    const h = 110
    const cx = hit.node.position.x + w / 2
    const cy = hit.node.position.y + h / 2
    setTimeout(() => setCenter(cx, cy, { zoom: 1.5, duration: 600 }), 90)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && hits[active]) {
      go(hits[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-2 py-1 focus-within:border-accent">
        <Search size={13} className="text-slate-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher un objet…  (⌘K)"
          className="w-40 bg-transparent text-[12px] text-slate-100 outline-none placeholder:text-slate-600 lg:w-52"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="text-slate-500 hover:text-slate-300"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 z-30 mt-1 max-h-80 w-80 animate-scale-in overflow-y-auto rounded-lg border border-line bg-panel-2 py-1 shadow-panel scroll-thin">
          {hits.length === 0 && (
            <div className="px-3 py-3 text-[12px] text-slate-500">Aucun résultat.</div>
          )}
          {hits.map((hit, i) => {
            const def = kindDef(hit.node.data.kind)
            const color = hit.node.data.color ?? def.color
            const Icon = iconByKey(hit.node.data.icon) ?? def.icon
            return (
              <button
                key={`${hit.graphId}:${hit.node.id}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(hit)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  i === active ? 'bg-panel' : 'hover:bg-panel'
                }`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${color}22`, color }}
                >
                  <Icon size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-slate-100">
                    {hit.node.data.label}
                  </span>
                  <span className="block truncate text-[10px] text-slate-500">
                    {def.label} · {hit.graphTitle}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { ChevronRight, Home } from 'lucide-react'
import { useStore } from '../store'

export function Breadcrumb() {
  const path = useStore((s) => s.path)
  const project = useStore((s) => s.project)
  const goToPathIndex = useStore((s) => s.goToPathIndex)

  return (
    <div className="flex items-center gap-1 overflow-x-auto text-[13px] scroll-thin">
      {path.map((gid, i) => {
        const g = project.graphs[gid]
        const isLast = i === path.length - 1
        return (
          <div key={gid} className="flex items-center gap-1 whitespace-nowrap">
            {i > 0 && <ChevronRight size={14} className="text-slate-600" />}
            <button
              onClick={() => goToPathIndex(i)}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors ${
                isLast
                  ? 'bg-panel-2 font-medium text-slate-100'
                  : 'text-slate-400 hover:bg-panel-2 hover:text-slate-200'
              }`}
            >
              {i === 0 && <Home size={13} />}
              {g?.title ?? 'Vue'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

import { toPng, toSvg } from 'html-to-image'
import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react'

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'schema'
  )
}

/**
 * Exporte la vue courante en image (PNG ou SVG). Recadre sur l'ensemble des
 * nœuds (recette officielle React Flow : on rend le viewport à la bonne
 * échelle/position vers une image de la taille du conteneur).
 */
export async function exportImage(format: 'png' | 'svg', nodes: Node[], name: string) {
  if (nodes.length === 0) {
    alert('Rien à exporter : cette vue est vide.')
    return
  }
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null
  const container = document.querySelector('.react-flow') as HTMLElement | null
  if (!viewport || !container) return

  const W = Math.max(container.clientWidth, 800)
  const H = Math.max(container.clientHeight, 600)
  const bounds = getNodesBounds(nodes)
  const { x, y, zoom } = getViewportForBounds(bounds, W, H, 0.3, 2, 0.15)

  const options = {
    backgroundColor: '#0c0e14',
    width: W,
    height: H,
    style: {
      width: `${W}px`,
      height: `${H}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
    cacheBust: true,
  }

  const dataUrl = format === 'png' ? await toPng(viewport, options) : await toSvg(viewport, options)
  download(dataUrl, `${slug(name)}.${format}`)
}

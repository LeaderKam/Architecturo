import { toPng } from 'html-to-image'
import type { ReactFlowInstance } from '@xyflow/react'

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

// On exclut le « chrome » du canvas (minimap, contrôles, attribution).
const SKIP = ['react-flow__minimap', 'react-flow__controls', 'react-flow__attribution', 'react-flow__panel']
const filter = (node: HTMLElement) => {
  if (!(node instanceof Element)) return true
  return !SKIP.some((c) => node.classList?.contains(c))
}

/**
 * Exporte la vue courante en PNG haute résolution.
 * On recadre (fitView) pour tout afficher puis on capture le rendu réel du
 * canvas — ce qui garantit la présence des liens et des flèches — avant de
 * restaurer la position de la caméra.
 */
export async function exportPng(rf: ReactFlowInstance, name: string) {
  if (rf.getNodes().length === 0) {
    alert('Rien à exporter : cette vue est vide.')
    return
  }
  const container = document.querySelector('.react-flow') as HTMLElement | null
  if (!container) return

  const viewport = rf.getViewport()
  rf.fitView({ padding: 0.12, duration: 0 })
  // Laisser le temps au rendu (et aux polices) de se stabiliser.
  await new Promise((r) => setTimeout(r, 320))

  try {
    const dataUrl = await toPng(container, {
      pixelRatio: 2,
      backgroundColor: '#0c0e14',
      filter,
      cacheBust: true,
    })
    download(dataUrl, `${slug(name)}.png`)
  } catch (e) {
    alert(`Export impossible : ${(e as Error).message}`)
  } finally {
    rf.setViewport(viewport)
  }
}

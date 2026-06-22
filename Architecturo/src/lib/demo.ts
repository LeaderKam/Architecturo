import type { FitViewOptions, SetCenterOptions } from '@xyflow/react'
import { useStore } from '../store'
import { sampleProject } from '../data/sampleProject'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface Camera {
  fitView: (opts?: FitViewOptions) => void
  setCenter: (x: number, y: number, opts?: SetCenterOptions) => void
}

/**
 * Visite guidée cinématique : charge l'exemple ServiceNow puis plonge en
 * profondeur (Vue globale → Intégration Jira → composition du REST Message),
 * caméra qui fonce dans chaque objet avant de révéler son intérieur.
 */
export async function runGuidedTour({ fitView, setCenter }: Camera) {
  const s = useStore.getState()
  s.loadProject(sampleProject()) // mode éditeur, vue globale (macro)

  await wait(650)
  fitView({ duration: 650, padding: 0.25 })

  // Niveau 2 : on fonce dans l'intégration Jira (nœud int_jira ≈ x400,y120)
  await wait(1500)
  setCenter(520, 180, { zoom: 2.5, duration: 520 })
  await wait(560)
  useStore.getState().drillInto('int_jira')
  await wait(220)
  fitView({ duration: 700, padding: 0.25 })

  // Niveau 3 : on fonce dans le REST Message (nœud rm ≈ x460,y80)
  await wait(1700)
  setCenter(580, 140, { zoom: 2.5, duration: 520 })
  await wait(560)
  useStore.getState().drillInto('rm')
  await wait(220)
  fitView({ duration: 700, padding: 0.25 })

  await wait(1500)
  fitView({ duration: 600, padding: 0.2 })
}

import type { Project } from '../types'

/** Validation minimale d'un objet importé. */
export function isProject(x: unknown): x is Project {
  if (!x || typeof x !== 'object') return false
  const p = x as Partial<Project>
  return (
    typeof p.id === 'string' &&
    typeof p.rootGraphId === 'string' &&
    !!p.graphs &&
    typeof p.graphs === 'object' &&
    !!p.rootGraphId &&
    !!(p.graphs as Record<string, unknown>)[p.rootGraphId]
  )
}

/** Télécharge le projet en .json. */
export function exportProject(project: Project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug(project.name)}.architecturo.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Ouvre un sélecteur de fichier et renvoie le projet importé. */
export function importProjectFromFile(): Promise<Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error('Aucun fichier'))
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result))
          if (!isProject(data)) throw new Error('Format invalide')
          resolve(data as Project)
        } catch (e) {
          reject(e)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    }
    input.click()
  })
}

/** Encode le projet dans un lien partageable (#p=...) — UTF-8 safe. */
export function buildShareLink(project: Project): string {
  const json = JSON.stringify(project)
  const b64 = bytesToB64(new TextEncoder().encode(json))
  const url = new URL(window.location.href)
  url.hash = `p=${b64}`
  return url.toString()
}

/** Lit un projet depuis le hash de l'URL, s'il existe. */
export function readProjectFromHash(): Project | null {
  const hash = window.location.hash.replace(/^#/, '')
  const params = new URLSearchParams(hash)
  const b64 = params.get('p')
  if (!b64) return null
  try {
    const json = new TextDecoder().decode(b64ToBytes(b64))
    const data = JSON.parse(json)
    return isProject(data) ? (data as Project) : null
  } catch {
    return null
  }
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'schema'
}

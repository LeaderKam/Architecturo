import {
  X,
  MousePointerClick,
  Layers,
  Cable,
  Sparkles,
  Share2,
  PlusSquare,
} from 'lucide-react'

const SECTIONS = [
  {
    icon: PlusSquare,
    title: 'Créer un objet',
    body: 'Glissez un type depuis la palette de gauche sur le canvas, ou cliquez dessus pour l\'ajouter au centre. Les types sont regroupés par catégorie : Générique, Intégration, ServiceNow.',
  },
  {
    icon: MousePointerClick,
    title: 'Éditer un objet',
    body: 'Cliquez sur un objet : le panneau de droite permet de modifier son nom, son type, sa description et ses propriétés clé/valeur.',
  },
  {
    icon: Cable,
    title: 'Relier deux objets',
    body: 'Survolez un objet : 4 points de connexion apparaissent (haut, bas, gauche, droite). Tirez depuis n\'importe lequel vers un autre objet — autant de liens que vous voulez, dans n\'importe quel sens.',
  },
  {
    icon: Cable,
    title: 'Sens d\'un lien',
    body: 'Cliquez sur un lien pour l\'éditer : choisissez le sens (unique →, bidirectionnel ↔, sans flèche) et donnez-lui un libellé (ex. « appelle », « écrit »).',
  },
  {
    icon: Layers,
    title: 'Vue détaillée (dive deep)',
    body: 'Double-cliquez sur un objet (ou « Créer une vue détaillée » dans l\'inspecteur) pour ouvrir un sous-schéma de ses composants internes. Le fil d\'Ariane en haut permet de remonter.',
  },
  {
    icon: Sparkles,
    title: 'Agent constructeur',
    body: 'Bouton « Agent » : décrivez une intégration en langage naturel. En réglages, choisissez votre provider (Claude, compatible OpenAI…) et votre clé pour une génération IA ; ou laissez l\'heuristique locale (sans clé).',
  },
  {
    icon: Share2,
    title: 'Exporter, importer, partager',
    body: 'Exportez le schéma en .json, réimportez-le pour le visualiser, ou générez un lien de partage (le schéma est encodé dans l\'URL). Tout est sauvegardé automatiquement en local.',
  },
]

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-2xl animate-scale-in flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-semibold text-slate-100">Guide — prise en main</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-panel-2 hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 overflow-y-auto px-5 py-5 sm:grid-cols-2 scroll-thin">
          {SECTIONS.map((s) => (
            <div key={s.title} className="rounded-xl border border-line bg-panel-2 p-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <s.icon size={15} />
                </span>
                <h3 className="text-[13px] font-semibold text-slate-100">{s.title}</h3>
              </div>
              <p className="text-[12px] leading-relaxed text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

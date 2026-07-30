import { AlertTriangle, ArrowRight } from "lucide-react"

export default function ProfileCompletionBanner({ percent, onDismiss }) {
  if (percent >= 70) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
      <div className="p-1.5 rounded-full bg-amber-100 flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800">
          Votre profil est complété à {percent}%
        </p>
        <p className="text-xs text-amber-600 mt-1">
          Complétez votre profil pour profiter de toutes les fonctionnalités.
        </p>
        <a
          href="/parametres"
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 mt-2 underline underline-offset-2"
        >
          Compléter mon profil <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

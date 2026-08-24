import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react"

export default function ProfileCompletionBanner({ percent, onDismiss }) {
  const complete = percent >= 70

  return (
    <div
      className={`rounded-2xl p-4 flex items-start gap-3 border ${
        complete
          ? "bg-emerald-50 border-emerald-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className={`p-1.5 rounded-full flex-shrink-0 mt-0.5 ${complete ? "bg-emerald-100" : "bg-amber-100"}`}>
        {complete ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${complete ? "text-emerald-800" : "text-amber-800"}`}>
          Votre profil est complété à {percent}%
        </p>
        <p className={`text-xs mt-1 ${complete ? "text-emerald-600" : "text-amber-600"}`}>
          {complete
            ? "Votre profil est bien complété."
            : "Complétez votre profil pour profiter de toutes les fonctionnalités."}
        </p>
        <a
          href="/parametres"
          className={`inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 mt-2 ${
            complete ? "text-emerald-700 hover:text-emerald-800" : "text-amber-700 hover:text-amber-800"
          }`}
        >
          Gérer mon profil <ArrowRight className="w-3 h-3" />
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

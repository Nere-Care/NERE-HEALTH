import { useState } from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";

const DISMISS_KEY = "nere_twofa_banner_dismissed";

export default function TwoFactorPromptBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1"
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl p-4 flex items-start gap-3 border bg-blue-50 border-blue-200">
      <div className="p-1.5 rounded-full flex-shrink-0 mt-0.5 bg-blue-100">
        <ShieldCheck className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-800">
          Sécurisez votre compte
        </p>
        <p className="text-xs mt-1 text-blue-600">
          Activez la double authentification pour protéger l'accès à vos données médicales.
        </p>
        <a
          href="/parametres#securite"
          className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 mt-2 text-blue-700 hover:text-blue-800"
        >
          Activer la 2FA <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      <button onClick={handleDismiss} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

import { AlertTriangle } from 'lucide-react';

export default function AccountStatusBanner({ statut, suspendMessage }) {
  const isBanned = statut === "banni";
  const isSuspended = statut === "suspendu";

  if (!isBanned && !isSuspended) return null;

  return (
    <div className={`rounded-xl border p-4 mb-6 flex items-center gap-3 ${
      isBanned
        ? "bg-red-500/10 border-red-500/30 text-red-400"
        : "bg-orange-500/10 border-orange-500/30 text-orange-400"
    }`}>
      <AlertTriangle size={20} />
      <div>
        <p className="font-semibold">
          {isBanned ? "Compte banni" : "Compte suspendu"}
        </p>
        <p className="text-sm opacity-80">
          {isBanned
            ? "Votre compte a été banni. Veuillez contacter l'administration."
            : suspendMessage || "Votre compte est suspendu."}
        </p>
      </div>
    </div>
  );
}

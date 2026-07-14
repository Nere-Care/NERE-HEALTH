import { Bell, FileText, Calendar, CreditCard, FlaskConical, Clock, Stethoscope, MessageCircle, CheckCircle } from 'lucide-react';

export const NOTIF_CONFIG = {
  rappel_rdv:             { icon: Calendar,       couleur: "bg-blue-100 text-blue-500" },
  confirmation_rdv:       { icon: CheckCircle,    couleur: "bg-green-100 text-green-500" },
  annulation_rdv:         { icon: Calendar,       couleur: "bg-red-100 text-red-500" },
  confirmation_paiement:  { icon: CreditCard,     couleur: "bg-purple-100 text-purple-500" },
  echec_paiement:         { icon: CreditCard,     couleur: "bg-red-100 text-red-500" },
  remboursement:          { icon: CreditCard,     couleur: "bg-green-100 text-green-500" },
  nouveau_message:        { icon: FileText,       couleur: "bg-orange-100 text-orange-500" },
  resultat_labo_disponible: { icon: FlaskConical, couleur: "bg-green-100 text-green-500" },
  ordonnance_prete:       { icon: Clock,          couleur: "bg-red-100 text-red-500" },
  alerte_systeme:         { icon: Bell,           couleur: "bg-gray-100 text-gray-500" },
  compte_valide:          { icon: CheckCircle,    couleur: "bg-green-100 text-green-500" },
  compte_rejete:          { icon: Bell,           couleur: "bg-red-100 text-red-500" },
  nouveaux_avis:          { icon: Stethoscope,    couleur: "bg-blue-100 text-blue-500" },
};

export const DEFAULT_CONFIG = { icon: Bell, couleur: "bg-blue-100 text-blue-500" };

export function getConfig(type) {
  // Retourne toujours DEFAULT_CONFIG si le type est inconnu ou undefined
  if (!type) return DEFAULT_CONFIG;
  return NOTIF_CONFIG[type] || DEFAULT_CONFIG;
}

export function tempsRelatif(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "A l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} heure${h > 1 ? "s" : ""}`;
  const j = Math.floor(h / 24);
  if (j === 1) return "Hier";
  return `Il y a ${j} jours`;
}
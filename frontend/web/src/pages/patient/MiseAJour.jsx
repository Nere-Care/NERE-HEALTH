// pages/MiseAJour.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const details = {
  1: { icon: "🔄", titre: "Mise à jour système", desc: "Nouvelles fonctionnalités de consultation et amélioration des performances globales de la plateforme.", date: "Il y a 2h", contenu: "Cette mise à jour apporte de nouvelles fonctionnalités pour les consultations en ligne, une meilleure gestion des rendez-vous et des performances améliorées sur tous les appareils." },
  2: { icon: "🔒", titre: "Politique de confidentialité", desc: "Modifications de la protection des données.", date: "Il y a 1 jour", contenu: "Nous avons mis à jour notre politique de confidentialité conformément aux nouvelles réglementations. Vos données restent protégées et ne sont jamais partagées sans votre consentement." },
  3: { icon: "💳", titre: "Système de paiement", desc: "Les nouveaux paiements mobiles sont intégrés.", date: "Il y a 3 jours", contenu: "MTN MoMo et Orange Money sont désormais disponibles pour régler vos consultations directement depuis l'application." },
  4: { icon: "🎯", titre: "Nouveaux médecins", desc: "15 nouveaux spécialistes ont rejoint la plateforme.", date: "Il y a 5 jours", contenu: "Nous accueillons 15 nouveaux spécialistes incluant des cardiologues, neurologues et pédiatres pour mieux vous servir." },
};

export default function MiseAJour({ darkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = details[id];

  if (!item) return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-500 mb-4">
        <ArrowLeft size={18} /> Retour
      </button>
      <p>Mise à jour introuvable.</p>
    </div>
  );

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-500 mb-6">
        <ArrowLeft size={18} /> Retour
      </button>

      <div className={`max-w-2xl mx-auto rounded-3xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl">{item.icon}</div>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{item.titre}</h1>
            <p className="text-xs text-gray-400 mt-1">{item.date}</p>
          </div>
        </div>

        <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          {item.contenu}
        </p>
      </div>
    </div>
  );
}
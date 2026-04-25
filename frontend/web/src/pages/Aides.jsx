import { Search, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, BookOpen, Video, FileQuestion } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  { question: "Comment prendre un rendez-vous ?", reponse: "Allez dans Annuaire Médecins, choisissez un médecin et cliquez sur Consulter pour prendre rendez-vous." },
  { question: "Comment accéder à mes dossiers médicaux ?", reponse: "Dans le menu à gauche, cliquez sur Dossiers Patient pour accéder à toutes vos informations médicales." },
  { question: "Comment démarrer une téléconsultation ?", reponse: "Cliquez sur Téléconsultation dans le menu, puis rejoignez votre session au moment du rendez-vous." },
  { question: "Comment modifier mes informations personnelles ?", reponse: "Allez dans Paramètres puis cliquez sur Profil pour modifier vos informations." },
  { question: "Comment renouveler une ordonnance ?", reponse: "Dans Dossiers Patient, onglet Prescriptions, cliquez sur Renouveler à côté du médicament concerné." },
];

export default function Aide() {
  const [ouvert, setOuvert] = useState(null);
  const [recherche, setRecherche] = useState("");

  const faqsFiltrees = faqs.filter(f =>
    f.question.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="p-4">

      {/* Titre */}
      <h1 className="text-lg font-bold text-blue-600 mb-6">Centre d'Aide</h1>

      {/* Bannière */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <h2 className="text-xl font-bold mb-1">Comment pouvons-nous vous aider ?</h2>
        <p className="text-sm text-blue-100 mb-4">Trouvez rapidement une réponse à vos questions</p>
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une question..."
            className="outline-none text-sm text-gray-700 w-full"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-blue-50">
          <div className="bg-blue-100 p-3 rounded-xl">
            <BookOpen size={20} className="text-blue-500" />
          </div>
          <p className="text-xs font-semibold text-gray-700">Guide utilisateur</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-green-50">
          <div className="bg-green-100 p-3 rounded-xl">
            <Video size={20} className="text-green-500" />
          </div>
          <p className="text-xs font-semibold text-gray-700">Tutoriels vidéo</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-purple-50">
          <div className="bg-purple-100 p-3 rounded-xl">
            <FileQuestion size={20} className="text-purple-500" />
          </div>
          <p className="text-xs font-semibold text-gray-700">FAQ complète</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700">Questions fréquentes</h2>
        </div>
        {faqsFiltrees.map((faq, index) => (
          <div key={index} className="border-b border-gray-50 last:border-0">
            <button
              onClick={() => setOuvert(ouvert === index ? null : index)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 text-left"
            >
              <span className="text-sm font-medium text-gray-700">{faq.question}</span>
              {ouvert === index
                ? <ChevronUp size={16} className="text-blue-500 flex-shrink-0" />
                : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
              }
            </button>
            {ouvert === index && (
              <div className="px-6 pb-4">
                <p className="text-sm text-gray-500 bg-blue-50 rounded-xl p-3">{faq.reponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contacter le support */}
      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Contacter le support</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
            <MessageCircle size={18} className="text-blue-500" />
            <div>
              <p className="text-xs font-semibold text-gray-700">Chat en direct</p>
              <p className="text-xs text-gray-400">Disponible 24/7</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
            <Phone size={18} className="text-green-500" />
            <div>
              <p className="text-xs font-semibold text-gray-700">Téléphone</p>
              <p className="text-xs text-gray-400">+237 xxx xxx xxx</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
            <Mail size={18} className="text-purple-500" />
            <div>
              <p className="text-xs font-semibold text-gray-700">Email</p>
              <p className="text-xs text-gray-400">support@nere.com</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
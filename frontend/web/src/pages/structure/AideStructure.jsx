import { Search, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, BookOpen, Video, FileQuestion } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../LanguageContext';

const faqs = [
  { question: "Comment ajouter un nouveau patient ?", reponse: "Allez dans la section Patients, cliquez sur + Nouveau Patient et remplissez le formulaire d'inscription." },
  { question: "Comment gérer les rendez-vous ?", reponse: "Dans la section Rendez-vous, vous pouvez voir, confirmer, annuler ou reprogrammer tous les rendez-vous." },
  { question: "Comment envoyer un message à un patient ?", reponse: "Allez dans Messages, cherchez le patient et cliquez sur Nouveau Message." },
  { question: "Comment modifier les informations de la structure ?", reponse: "Allez dans Paramètres puis cliquez sur Informations pour modifier les données de votre structure." },
  { question: "Comment gérer le personnel médical ?", reponse: "Dans Paramètres, section Personnel, vous pouvez ajouter, modifier ou supprimer des membres du personnel." },
  { question: "Comment voir les statistiques ?", reponse: "Le Tableau de Bord affiche toutes les statistiques en temps réel : patients, rendez-vous, taux d'occupation." },
];

export default function AideStructure({ darkMode }) {
  const { langue } = useLanguage();
  const [ouvert, setOuvert] = useState(null);
  const [recherche, setRecherche] = useState("");

  const faqsFiltrees = faqs.filter(f =>
    f.question.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <h1 className="text-lg font-bold text-blue-600 mb-6">
        {langue === 'fr' ? "Centre d'Aide" : "Help Center"}
      </h1>

      {/* Bannière */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <h2 className="text-xl font-bold mb-1">
          {langue === 'fr' ? "Comment pouvons-nous vous aider ?" : "How can we help you?"}
        </h2>
        <p className="text-sm text-blue-100 mb-4">
          {langue === 'fr' ? "Trouvez rapidement une réponse à vos questions" : "Find answers to your questions quickly"}
        </p>
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder={langue === 'fr' ? "Rechercher une question..." : "Search a question..."}
            className="outline-none text-sm text-gray-700 w-full"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: BookOpen, label: langue === 'fr' ? "Guide administrateur" : "Admin Guide", bg: "bg-blue-100", color: "text-blue-500", hover: darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50" },
          { icon: Video, label: langue === 'fr' ? "Tutoriels vidéo" : "Video Tutorials", bg: "bg-green-100", color: "text-green-500", hover: darkMode ? "hover:bg-gray-700" : "hover:bg-green-50" },
          { icon: FileQuestion, label: "FAQ", bg: "bg-purple-100", color: "text-purple-500", hover: darkMode ? "hover:bg-gray-700" : "hover:bg-purple-50" },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={`rounded-2xl shadow p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${item.hover}
              ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className={`p-3 rounded-xl ${item.bg}`}>
                <Icon size={20} className={item.color} />
              </div>
              <p className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className={`rounded-2xl shadow overflow-hidden mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            {langue === 'fr' ? "Questions fréquentes" : "Frequently Asked Questions"}
          </h2>
        </div>
        {faqsFiltrees.map((faq, index) => (
          <div key={index} className={`border-b last:border-0 ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
            <button
              onClick={() => setOuvert(ouvert === index ? null : index)}
              className={`w-full flex items-center justify-between px-6 py-4 text-left transition-all
                ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
            >
              <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                {faq.question}
              </span>
              {ouvert === index
                ? <ChevronUp size={16} className="text-blue-500 flex-shrink-0" />
                : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
              }
            </button>
            {ouvert === index && (
              <div className="px-6 pb-4">
                <p className={`text-sm rounded-xl p-3 ${darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-gray-500"}`}>
                  {faq.reponse}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Support */}
      <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h2 className={`text-sm font-bold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
          {langue === 'fr' ? "Contacter le support" : "Contact Support"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: MessageCircle, label: langue === 'fr' ? "Chat en direct" : "Live Chat", sub: langue === 'fr' ? "Disponible 24/7" : "Available 24/7", bg: darkMode ? "bg-gray-700" : "bg-blue-50", color: "text-blue-500" },
            { icon: Phone, label: langue === 'fr' ? "Téléphone" : "Phone", sub: "+237 xxx xxx xxx", bg: darkMode ? "bg-gray-700" : "bg-green-50", color: "text-green-500" },
            { icon: Mail, label: "Email", sub: "support@nere.com", bg: darkMode ? "bg-gray-700" : "bg-purple-50", color: "text-purple-500" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className={`flex items-center gap-3 rounded-xl p-3 ${item.bg}`}>
                <Icon size={18} className={item.color} />
                <div>
                  <p className={`text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
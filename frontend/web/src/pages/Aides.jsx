import { Search, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, BookOpen, Video, FileQuestion } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../LanguageContext';

const faqs = [
  { question: "Comment prendre un rendez-vous ?", reponse: "Allez dans Annuaire Médecins, choisissez un médecin et cliquez sur Consulter pour prendre rendez-vous." },
  { question: "Comment accéder à mes dossiers médicaux ?", reponse: "Dans le menu à gauche, cliquez sur Ma Santé pour accéder à toutes vos informations médicales." },
  { question: "Comment démarrer une téléconsultation ?", reponse: "Cliquez sur Téléconsultation dans le menu, puis rejoignez votre session au moment du rendez-vous." },
  { question: "Comment modifier mes informations personnelles ?", reponse: "Allez dans Paramètres puis cliquez sur Profil pour modifier vos informations." },
  { question: "Comment renouveler une ordonnance ?", reponse: "Dans Ma Santé, onglet Prescriptions, cliquez sur Renouveler à côté du médicament concerné." },
];

export default function Aide({ darkMode }) {
  const { t } = useLanguage();
  const [ouvert, setOuvert] = useState(null);
  const [recherche, setRecherche] = useState("");

  const faqsFiltrees = faqs.filter(f =>
    f.question.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <h1 className="text-lg font-bold text-blue-600 mb-6">{t.aideTitre}</h1>

      {/* Bannière */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <h2 className="text-xl font-bold mb-1">{t.commentAider}</h2>
        <p className="text-sm text-blue-100 mb-4">Trouvez rapidement une réponse à vos questions</p>
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder={t.rechercherQuestion}
            className="outline-none text-sm text-gray-700 w-full"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: BookOpen, label: t.guideUtilisateur, color: "bg-blue-100 text-blue-500", hover: darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50" },
          { icon: Video, label: t.tutoriels, color: "bg-green-100 text-green-500", hover: darkMode ? "hover:bg-gray-700" : "hover:bg-green-50" },
          { icon: FileQuestion, label: t.faq, color: "bg-purple-100 text-purple-500", hover: darkMode ? "hover:bg-gray-700" : "hover:bg-purple-50" },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={`rounded-2xl shadow p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${item.hover}
              ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className={`p-3 rounded-xl ${item.color.split(' ')[0]}`}>
                <Icon size={20} className={item.color.split(' ')[1]} />
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
            {t.questionsFrequentes}
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
          {t.contacterSupport}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: MessageCircle, label: t.chatDirect, sub: t.disponible, color: "bg-blue-50", iconColor: "text-blue-500" },
            { icon: Phone, label: "Téléphone", sub: "+237 xxx xxx xxx", color: "bg-green-50", iconColor: "text-green-500" },
            { icon: Mail, label: "Email", sub: "support@nere.com", color: "bg-purple-50", iconColor: "text-purple-500" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className={`flex items-center gap-3 rounded-xl p-3
                ${darkMode ? "bg-gray-700" : item.color}`}>
                <Icon size={18} className={item.iconColor} />
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
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  Mail,
  BookOpen,
  Video,
  FileQuestion
} from "lucide-react";

import { useState } from "react";

const faqs = [
  {
    question: "Comment prendre un rendez-vous ?",
    reponse:
      "Allez dans Annuaire Médecins, choisissez un médecin et cliquez sur Consulter pour prendre rendez-vous."
  },
  {
    question: "Comment accéder à mes dossiers médicaux ?",
    reponse:
      "Dans le menu, cliquez sur Ma Santé pour accéder à vos informations médicales."
  },
  {
    question: "Comment démarrer une téléconsultation ?",
    reponse:
      "Cliquez sur Téléconsultation puis rejoignez la session à l'heure du rendez-vous."
  },
  {
    question: "Comment modifier mes informations ?",
    reponse:
      "Allez dans Paramètres > Profil pour modifier vos données personnelles."
  },
  {
    question: "Comment renouveler une ordonnance ?",
    reponse:
      "Dans Ma Santé > Prescriptions, cliquez sur Renouveler."
  }
];

export default function Aide({ darkMode }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [search, setSearch] = useState("");

  const filteredFaqs = faqs.filter((f) =>
    f.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition
      ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
    >
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-blue-500 mb-6">
        Centre d’aide
      </h1>

      {/* SEARCH BANNER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Comment pouvons-nous vous aider ?
        </h2>

        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une question..."
            className="w-full outline-none text-sm text-gray-700"
          />
        </div>
      </div>

      {/* SHORTCUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: BookOpen, label: "Guide utilisateur", color: "text-blue-500" },
          { icon: Video, label: "Tutoriels vidéo", color: "text-green-500" },
          { icon: FileQuestion, label: "FAQ", color: "text-purple-500" }
        ].map((item, i) => {
          const Icon = item.icon;

          return (
            <div
              key={i}
              className={`p-4 rounded-2xl border cursor-pointer transition
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
              hover:shadow`}
            >
              <Icon className={`w-6 h-6 ${item.color}`} />
              <p className="mt-2 text-sm font-medium">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div
        className={`rounded-2xl border overflow-hidden
        ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold">
          Questions fréquentes
        </div>

        {filteredFaqs.map((faq, index) => (
          <div
            key={index}
            className="border-b border-gray-100 dark:border-gray-700"
          >
            <button
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
              className="w-full flex justify-between items-center p-4 text-left"
            >
              <span className="text-sm font-medium">{faq.question}</span>

              {openIndex === index ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {openIndex === index && (
              <div className="px-4 pb-4 text-sm text-gray-500">
                {faq.reponse}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SUPPORT */}
      <div
        className={`mt-6 p-5 rounded-2xl border
        ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <h2 className="font-semibold mb-4">Contacter le support</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

  {/* CHAT */}
  <div
    className={`flex items-center gap-3 p-3 rounded-xl border transition
    ${darkMode
      ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
      : "bg-blue-50 border-blue-100 hover:bg-blue-100"
    }`}
  >
    <MessageCircle
      className={`w-5 h-5 ${darkMode ? "text-blue-400" : "text-blue-500"}`}
    />
    <div>
      <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
        Chat
      </p>
      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        Disponible 24/7
      </p>
    </div>
  </div>

  {/* PHONE */}
  <div
    className={`flex items-center gap-3 p-3 rounded-xl border transition
    ${darkMode
      ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
      : "bg-green-50 border-green-100 hover:bg-green-100"
    }`}
  >
    <Phone
      className={`w-5 h-5 ${darkMode ? "text-green-400" : "text-green-500"}`}
    />
    <div>
      <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
        Téléphone
      </p>
      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        +237 XXX XXX XXX
      </p>
    </div>
  </div>

  {/* EMAIL */}
  <div
    className={`flex items-center gap-3 p-3 rounded-xl border transition
    ${darkMode
      ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
      : "bg-purple-50 border-purple-100 hover:bg-purple-100"
    }`}
  >
    <Mail
      className={`w-5 h-5 ${darkMode ? "text-purple-400" : "text-purple-500"}`}
    />
    <div>
      <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
        Email
      </p>
      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        support@nere.com
      </p>
    </div>
  </div>

</div>
          
      </div>
    </div>
  );
}
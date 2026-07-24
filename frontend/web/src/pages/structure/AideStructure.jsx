import { Search, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, BookOpen, Video, FileQuestion, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { sendSupportTicket } from '../../services/support';

const faqs = [
  { question: "Comment ajouter un nouveau patient ?", reponse: "Allez dans la section Patients, cliquez sur + Nouveau Patient et remplissez le formulaire d'inscription." },
  { question: "Comment gérer les rendez-vous ?", reponse: "Dans la section Rendez-vous, vous pouvez voir, confirmer, annuler ou reprogrammer tous les rendez-vous." },
  { question: "Comment envoyer un message à un patient ?", reponse: "Allez dans Messages, cherchez le patient et cliquez sur Nouveau Message." },
  { question: "Comment modifier les informations de la structure ?", reponse: "Allez dans Paramètres puis cliquez sur Informations pour modifier les données de votre structure." },
  { question: "Comment gérer le personnel médical ?", reponse: "Dans Paramètres, section Personnel, vous pouvez ajouter, modifier ou supprimer des membres du personnel." },
  { question: "Comment voir les statistiques ?", reponse: "Le Tableau de Bord affiche toutes les statistiques en temps réel : patients, rendez-vous, taux d'occupation." },
];

export default function AideStructure({ darkMode }) {
  const [ouvert, setOuvert] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const faqsFiltrees = faqs.filter(f =>
    f.question.toLowerCase().includes(recherche.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sujet.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setSending(true);
    try {
      await sendSupportTicket({ sujet: sujet.trim(), message: message.trim() });
      toast.success("Message envoyé au support");
      setSujet("");
      setMessage("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const fieldClass = `flex items-center gap-3 border rounded-xl px-4 py-3 transition ${
    darkMode ? "border-gray-600 focus-within:border-blue-500" : "border-gray-300 focus-within:border-blue-500"
  }`;

  const inputClass = `w-full bg-transparent outline-none text-sm ${
    darkMode ? "text-gray-200 placeholder-gray-500" : "text-gray-700 placeholder-gray-400"
  }`;

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <h1 className="text-lg font-bold text-blue-600 mb-6">
        Centre d'Aide
      </h1>

      {/* Bannière */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <h2 className="text-xl font-bold mb-1">
          Comment pouvons-nous vous aider ?
        </h2>
        <p className="text-sm text-blue-100 mb-4">
          Trouvez rapidement une réponse à vos questions
        </p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: BookOpen, label: "Guide administrateur", bg: "bg-blue-100", color: "text-blue-500", hover: darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50" },
          { icon: Video, label: "Tutoriels vidéo", bg: "bg-green-100", color: "text-green-500", hover: darkMode ? "hover:bg-gray-700" : "hover:bg-green-50" },
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
            Questions fréquentes
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

      {/* Contacter le support */}
      <div className={`rounded-2xl shadow p-5 mb-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h2 className={`text-sm font-bold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
          Contacter le support
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
          <div>
            <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Sujet *
            </label>
            <div className={fieldClass}>
              <MessageCircle size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="Résumé de votre problème"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre problème en détail..."
              rows={4}
              className={`w-full border rounded-xl px-4 py-3 outline-none resize-none transition text-sm ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:border-blue-500"
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {sending ? "Envoi..." : "Envoyer"}
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Phone, label: "Téléphone", sub: "+237 xxx xxx xxx", bg: darkMode ? "bg-gray-700" : "bg-green-50", color: "text-green-500" },
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

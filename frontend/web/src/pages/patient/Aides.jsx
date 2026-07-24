import { Search, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, BookOpen, Video, FileQuestion, Send, Loader2, Paperclip, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sendSupportTicket, getCategories, uploadTicketFile } from '../../services/support';

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
  const [ouvert, setOuvert] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [categories, setCategories] = useState([]);
  const [categorieId, setCategorieId] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => {
        console.error("Erreur chargement catégories:", err);
      });
  }, []);

  const filteredFaqs = faqs.filter((f) =>
    f.question.toLowerCase().includes(recherche.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categorieId || sujet.trim().length < 3 || message.trim().length < 10) {
      toast.error("Veuillez remplir tous les champs (sujet : 3 car. min, message : 10 car. min)");
      return;
    }
    setSending(true);
    try {
      let piece_jointe_url = null;
      if (file) {
        const uploaded = await uploadTicketFile(file);
        piece_jointe_url = uploaded.url;
      }
      await sendSupportTicket({
        categorie_id: categorieId,
        sujet: sujet.trim(),
        description: message.trim(),
        piece_jointe_url,
      });
      toast.success("Ticket de support créé avec succès");
      setCategorieId("");
      setSujet("");
      setMessage("");
      setFile(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const inputClass = `w-full bg-transparent outline-none text-sm ${
    darkMode ? "text-gray-200 placeholder-gray-500" : "text-gray-700 placeholder-gray-400"
  }`;

  const fieldClass = `flex items-center gap-3 border rounded-xl px-4 py-3 transition ${
    darkMode ? "border-gray-600 focus-within:border-blue-500" : "border-gray-300 focus-within:border-blue-500"
  }`;

  return (
    <div className={`p-9 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <h1 className="text-lg font-bold text-blue-600 mb-6">
        Centre d'aide
      </h1>

      {/* Bannière */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <h2 className="text-xl font-bold mb-1">
          Comment pouvons-nous vous aider ?
        </h2>
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

      {/* SHORTCUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: BookOpen,     label: "Guide utilisateur", color: "bg-blue-100 text-blue-500",   hover: darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50" },
          { icon: Video,        label: "Tutoriels vidéo",   color: "bg-green-100 text-green-500", hover: darkMode ? "hover:bg-gray-700" : "hover:bg-green-50" },
          { icon: FileQuestion, label: "FAQ",               color: "bg-purple-100 text-purple-500", hover: darkMode ? "hover:bg-gray-700" : "hover:bg-purple-50" },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={`rounded-2xl shadow p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${item.hover}
              ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className={`p-3 rounded-xl ${item.color.split(' ')[0]}`}>
                <Icon size={20} className={item.color.split(' ')[1]} />
              </div>
              <p className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {item.label}
              </p>
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

        {filteredFaqs.map((faq, index) => (
          <div key={index} className={`border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <button
              onClick={() => setOuvert(ouvert === index ? null : index)}
              className={`w-full flex justify-between items-center p-4 text-left transition-all
                ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
            >
              <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                {faq.question}
              </span>
              {ouvert === index ? (
                <ChevronUp size={16} className="text-blue-500 flex-shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
              )}
            </button>
            {ouvert === index && (
              <div className="px-4 pb-4">
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
              Catégorie *
            </label>
            <select
              value={categorieId}
              onChange={(e) => setCategorieId(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-700 focus:border-blue-500"
              }`}
            >
              <option value="">Sélectionnez une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>

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
            <p className={`text-xs mt-1 ${sujet.trim().length > 0 && sujet.trim().length < 3 ? "text-red-400" : darkMode ? "text-gray-500" : "text-gray-400"}`}>
              {sujet.trim().length}/3 caractères minimum
            </p>
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
            <p className={`text-xs mt-1 ${message.trim().length > 0 && message.trim().length < 10 ? "text-red-400" : darkMode ? "text-gray-500" : "text-gray-400"}`}>
              {message.trim().length}/10 caractères minimum
            </p>
          </div>

          {/* Pièce jointe */}
          <div>
            <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Pièce jointe <span className="font-normal">(optionnel — max 10 Mo)</span>
            </label>
            {file ? (
              <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${darkMode ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"}`}>
                <Paperclip size={16} className="text-blue-400 flex-shrink-0" />
                <span className={`text-sm flex-1 truncate ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  {file.name}
                </span>
                <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} Ko</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 rounded-lg hover:bg-red-100 text-red-400 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition ${
                darkMode ? "border-gray-600 hover:border-blue-500" : "border-gray-300 hover:border-blue-500"
              }`}>
                <Paperclip size={16} className="text-gray-400 flex-shrink-0" />
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Ajouter un fichier (image, PDF, document...)
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 10 * 1024 * 1024) {
                        toast.error("Fichier trop volumineux (max 10 Mo)");
                        return;
                      }
                      setFile(f);
                    }
                  }}
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={sending || !categorieId || sujet.trim().length < 3 || message.trim().length < 10}
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
            { icon: Phone,  label: "Téléphone",      sub: "+237 xxx xxx xxx",        color: "bg-green-50",  iconColor: "text-green-500" },
            { icon: Mail,   label: "Email",          sub: "support@nere.com",        color: "bg-purple-50", iconColor: "text-purple-500" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className={`flex items-center gap-3 rounded-xl p-3 ${darkMode ? "bg-gray-700" : item.color}`}>
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

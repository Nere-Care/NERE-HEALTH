import { useState } from 'react';
import { Search, Send } from 'lucide-react';

const conversations = [
  { id: 1, nom: "Dr. Ngassa Pierre", role: "Dentiste", message: "Bonjour, comment vous sentez-vous ?", heure: "09:24", nonLu: 2 },
  { id: 2, nom: "Clinique du Wouri", role: "Structure de santé", message: "Votre rendez-vous est confirmé", heure: "08:41", nonLu: 0 },
  { id: 3, nom: "Dr. Kamdem Marie", role: "Cardiologue", message: "Vos résultats sont disponibles", heure: "Hier", nonLu: 1 },
];

const messagesData = [
  { id: 1, convId: 1, expediteur: "medecin", texte: "Bonjour ! Comment vous sentez-vous ?", heure: "09:00" },
  { id: 2, convId: 1, expediteur: "patient", texte: "Je me sens mieux merci.", heure: "09:05" },
  { id: 3, convId: 2, expediteur: "medecin", texte: "Votre rendez-vous est confirmé.", heure: "08:41" },
];

export default function Messages({ darkMode }) {
  const [convActive, setConvActive] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const messages = convActive
    ? messagesData.filter(m => m.convId === convActive.id)
    : [];

  const envoyerMessage = () => {
    if (!newMessage.trim() || !convActive) return;

    messagesData.push({
      id: messagesData.length + 1,
      convId: convActive.id,
      expediteur: "patient",
      texte: newMessage,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });

    setNewMessage("");
  };

  return (
    <div className={`flex h-[calc(100vh-80px)] overflow-hidden
      ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* LISTE CONVERSATIONS */}
      <div className={`w-full md:w-72 border-r flex flex-col
        ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>

        <div className="p-4 border-b border-gray-100">
          <h1 className={`font-bold mb-3 ${darkMode ? "text-white" : "text-blue-600"}`}>
            Messages
          </h1>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl
            ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <Search size={14} className="text-gray-400" />
            <input
              placeholder="Rechercher..."
              className={`bg-transparent outline-none text-sm w-full
                ${darkMode ? "text-white" : "text-gray-800"}`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setConvActive(conv)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer
                ${convActive?.id === conv.id
                  ? (darkMode ? "bg-gray-700" : "bg-blue-50")
                  : (darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50")
                }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                {conv.nom.charAt(0)}
              </div>

              <div className="flex-1">
                <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {conv.nom}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {conv.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ZONE CHAT */}
      <div className={`flex-1 flex flex-col
        ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

        {/* SI AUCUNE CONVERSATION */}
        {!convActive && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Clique sur une conversation pour commencer 💬
          </div>
        )}

        {/* CHAT */}
        {convActive && (
          <>
            {/* HEADER */}
            <div className={`p-4 border-b flex justify-between items-center
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>

              <p className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {convActive.nom}
              </p>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.expediteur === "patient" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`px-4 py-2 rounded-xl text-sm
                    ${msg.expediteur === "patient"
                      ? "bg-blue-500 text-white"
                      : darkMode ? "bg-gray-700 text-white" : "bg-white shadow"
                    }`}
                  >
                    {msg.texte}
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT */}
            <div className={`p-3 flex gap-2 border-t
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>

              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
                placeholder="Écrire un message..."
                className={`flex-1 px-4 py-2 rounded-xl text-sm outline-none
                  ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100"}`}
              />

              <button
                onClick={envoyerMessage}
                className="bg-blue-500 text-white px-4 rounded-xl"
              >
                Send
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
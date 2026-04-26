import { useState } from 'react';
import { Search, Send, Phone, Video, MoreVertical } from 'lucide-react';

const conversations = [
  { id: 1, nom: "Dr. Ngassa Pierre", role: "Dentiste", message: "Bonjour, comment vous sentez-vous ?", heure: "09:24", nonLu: 2, actif: true },
  { id: 2, nom: "Clinique du Wouri", role: "Structure de santé", message: "Votre rendez-vous est confirmé", heure: "08:41", nonLu: 0, actif: false },
  { id: 3, nom: "Dr. Kamdem Marie", role: "Cardiologue", message: "Vos résultats sont disponibles", heure: "Hier", nonLu: 1, actif: false },
  { id: 4, nom: "Hôpital Central", role: "Structure de santé", message: "Rappel de votre consultation", heure: "Hier", nonLu: 0, actif: false },
  { id: 5, nom: "Dr. Bello Ahmed", role: "Généraliste", message: "N'oubliez pas votre traitement", heure: "Lundi", nonLu: 0, actif: false },
];

const messagesData = [
  { id: 1, expediteur: "medecin", texte: "Bonjour ! Comment vous sentez-vous aujourd'hui ?", heure: "09:00" },
  { id: 2, expediteur: "patient", texte: "Bonjour Docteur, je me sens mieux depuis hier merci.", heure: "09:05" },
  { id: 3, expediteur: "medecin", texte: "Bien ! Continuez à prendre votre traitement régulièrement.", heure: "09:10" },
  { id: 4, expediteur: "patient", texte: "D'accord Docteur. J'ai une question sur le dosage de l'Amoxiceline.", heure: "09:15" },
  { id: 5, expediteur: "medecin", texte: "Vous devez prendre 250ml matin et soir après les repas pendant 2 mois.", heure: "09:18" },
  { id: 6, expediteur: "patient", texte: "Merci beaucoup Docteur !", heure: "09:20" },
  { id: 7, expediteur: "medecin", texte: "De rien ! N'hésitez pas si vous avez d'autres questions. Bonne journée 😊", heure: "09:24" },
];

export default function Messages() {
  const [convActive, setConvActive] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(messagesData);

  const envoyerMessage = () => {
    if (newMessage.trim() === "") return;
    setMessages([...messages, {
      id: messages.length + 1,
      expediteur: "patient",
      texte: newMessage,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage("");
  };

  return (
    <div className="flex h-screen" style={{ height: "calc(100vh - 80px)" }}>

      {/* Colonne gauche - Liste conversations */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-blue-600 mb-3">Messages</h1>
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setConvActive(conv)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-all
                ${convActive.id === conv.id ? "bg-blue-50 border-r-2 border-blue-500" : ""}`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                {conv.nom.charAt(0)}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-gray-800 truncate">{conv.nom}</p>
                  <p className="text-xs text-gray-400 flex-shrink-0">{conv.heure}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400 truncate">{conv.message}</p>
                  {conv.nonLu > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                      {conv.nonLu}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone chat */}
      <div className="flex-1 flex flex-col bg-gray-50">

        {/* Header chat */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {convActive.nom.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{convActive.nom}</p>
              <p className="text-xs text-green-500 font-medium">{convActive.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-blue-50 rounded-xl hover:bg-blue-100">
              <Phone size={16} className="text-blue-500" />
            </button>
            <button className="p-2 bg-blue-50 rounded-xl hover:bg-blue-100">
              <Video size={16} className="text-blue-500" />
            </button>
            <button className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200">
              <MoreVertical size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.expediteur === "patient" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm
                ${msg.expediteur === "patient"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 shadow rounded-bl-none"
                }`}
              >
                <p>{msg.texte}</p>
                <p className={`text-xs mt-1 text-right ${msg.expediteur === "patient" ? "text-blue-100" : "text-gray-400"}`}>
                  {msg.heure}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Zone saisie */}
        <div className="bg-white px-4 py-3 border-t border-gray-100 flex items-center gap-3">
          <input
            type="text"
            placeholder="Écrire un message..."
            className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
          />
          <button
            onClick={envoyerMessage}
            className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600"
          >
            <Send size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
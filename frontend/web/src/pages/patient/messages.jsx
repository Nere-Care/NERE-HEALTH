import { useState } from 'react';

import {
  Search,
  Send,
  ArrowLeft,
  Phone,
  Video,
  Paperclip,
} from 'lucide-react';

const conversationsInitiales = [
  {
    id: 1,
    nom: "Dr. Ngassa Pierre",
    role: "Dentiste",
    message: "Bonjour, comment vous sentez-vous ?",
    heure: "09:24",
    nonLu: 2,
  },

  {
    id: 2,
    nom: "Clinique du Wouri",
    role: "Structure de santé",
    message: "Votre rendez-vous est confirmé",
    heure: "08:41",
    nonLu: 0,
  },

  {
    id: 3,
    nom: "Dr. Kamdem Marie",
    role: "Cardiologue",
    message: "Vos résultats sont disponibles",
    heure: "Hier",
    nonLu: 1,
  },
];

const messagesInitials = [
  {
    id: 1,
    convId: 1,
    expediteur: "medecin",
    texte: "Bonjour ! Comment vous sentez-vous ?",
    heure: "09:00",
  },

  {
    id: 2,
    convId: 1,
    expediteur: "patient",
    texte: "Je me sens mieux merci.",
    heure: "09:05",
  },

  {
    id: 3,
    convId: 2,
    expediteur: "medecin",
    texte: "Votre rendez-vous est confirmé.",
    heure: "08:41",
  },
];

export default function Messages({ darkMode }) {

  const [conversations, setConversations] =
    useState(conversationsInitiales);

  const [messagesData, setMessagesData] =
    useState(messagesInitials);

  const [convActive, setConvActive] =
    useState(null);

  const [newMessage, setNewMessage] =
    useState("");

  const messages = convActive
    ? messagesData.filter(
        (m) => m.convId === convActive.id
      )
    : [];

  // 🔹 Ouvrir conversation
  const ouvrirConversation = (conv) => {

    setConvActive(conv);

    // enlever badge non lu
    const updated = conversations.map((c) =>
      c.id === conv.id
        ? { ...c, nonLu: 0 }
        : c
    );

    setConversations(updated);
  };

  // 🔹 Envoyer message
  const envoyerMessage = () => {

    if (!newMessage.trim() || !convActive)
      return;

    const nouveau = {
      id: Date.now(),
      convId: convActive.id,
      expediteur: "patient",
      texte: newMessage,
      heure: new Date().toLocaleTimeString(
        'fr-FR',
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      ),
    };

    setMessagesData([
      ...messagesData,
      nouveau,
    ]);

    setNewMessage("");
  };

  return (

    <div
      className={`h-[calc(100vh-80px)] flex overflow-hidden
        ${
          darkMode
            ? "bg-gray-900"
            : "bg-gray-50"
        }`}
    >

      {/* 🔹 LISTE CONVERSATIONS */}
      <div
        className={`
          ${
            convActive
              ? "hidden md:flex"
              : "flex"
          }

          flex-col
          w-full md:w-80
          border-r

          ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }
        `}
      >

        {/* HEADER */}
        <div className="p-4 border-b border-gray-200">

          <h1 className="text-2xl font-bold text-blue-500">
            Messages
          </h1>

          {/* Recherche */}
          <div
            className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl
              ${
                darkMode
                  ? "bg-gray-700"
                  : "bg-gray-100"
              }`}
          >
            <Search
              size={16}
              className="text-gray-400"
            />

            <input
              type="text"
              placeholder="Rechercher..."
              className={`bg-transparent outline-none text-sm w-full
                ${
                  darkMode
                    ? "text-white placeholder-gray-400"
                    : "text-gray-800"
                }`}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">

          {conversations.map((conv) => (

            <button
              key={conv.id}

              onClick={() =>
                ouvrirConversation(conv)
              }

              className={`w-full flex items-center gap-3 px-4 py-4 transition-all text-left

                ${
                  darkMode
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                }`}
            >

              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                {conv.nom.charAt(0)}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">

                <div className="flex items-center justify-between">

                  <p
                    className={`font-semibold truncate
                      ${
                        darkMode
                          ? "text-white"
                          : "text-gray-800"
                      }`}
                  >
                    {conv.nom}
                  </p>

                  <span className="text-xs text-gray-400">
                    {conv.heure}
                  </span>

                </div>

                <p className="text-xs text-gray-400">
                  {conv.role}
                </p>

                <div className="flex items-center justify-between mt-1">

                  <p className="text-sm text-gray-400 truncate">
                    {conv.message}
                  </p>

                  {conv.nonLu > 0 && (

                    <div className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {conv.nonLu}
                    </div>

                  )}

                </div>

              </div>

            </button>

          ))}

        </div>

      </div>

      {/* 🔹 DISCUSSION */}
      {convActive && (

        <div className="flex flex-col flex-1">

          {/* HEADER DISCUSSION */}
          <div
            className={`p-4 border-b flex items-center justify-between
              ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
          >

            <div className="flex items-center gap-3">

              {/* Retour mobile */}
              <button
                onClick={() =>
                  setConvActive(null)
                }

                className="md:hidden"
              >
                <ArrowLeft
                  size={22}
                  className={
                    darkMode
                      ? "text-white"
                      : "text-gray-700"
                  }
                />
              </button>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {convActive.nom.charAt(0)}
              </div>

              <div>

                <p
                  className={`font-bold
                    ${
                      darkMode
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                >
                  {convActive.nom}
                </p>

                <p className="text-xs text-green-500">
                  En ligne
                </p>

              </div>

            </div>

            {/* Icônes */}
            <div className="flex items-center gap-4">

              <button>
                <Phone
                  size={20}
                  className="text-blue-500"
                />
              </button>

              <button>
                <Video
                  size={20}
                  className="text-blue-500"
                />
              </button>

            </div>

          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

            {messages.map((msg) => (

              <div
                key={msg.id}

                className={`flex
                  ${
                    msg.expediteur === "patient"
                      ? "justify-end"
                      : "justify-start"
                  }`}
              >

                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm

                    ${
                      msg.expediteur === "patient"

                        ? "bg-blue-500 text-white"

                        : darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-white shadow"
                    }`}
                >

                  <p>{msg.texte}</p>

                  <p
                    className={`text-[10px] mt-1 text-right

                      ${
                        msg.expediteur === "patient"
                          ? "text-blue-100"
                          : "text-gray-400"
                      }`}
                  >
                    {msg.heure}
                  </p>

                </div>

              </div>

            ))}

          </div>

          {/* INPUT */}
          <div
            className={`p-3 border-t flex items-center gap-3

              ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
          >

            <button>
              <Paperclip
                size={20}
                className="text-gray-400"
              />
            </button>

            <input
              value={newMessage}

              onChange={(e) =>
                setNewMessage(e.target.value)
              }

              onKeyDown={(e) =>
                e.key === "Enter" &&
                envoyerMessage()
              }

              placeholder="Écrire un message..."

              className={`flex-1 px-4 py-2 rounded-full text-sm outline-none

                ${
                  darkMode
                    ? "bg-gray-700 text-white placeholder-gray-400"
                    : "bg-gray-100 text-gray-800"
                }`}
            />

            <button
              onClick={envoyerMessage}

              className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-all"
            >
              <Send size={18} />
            </button>

          </div>

        </div>

      )}

    </div>
  );
}
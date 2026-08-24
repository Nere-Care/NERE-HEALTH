import { useState } from "react";
import { Search } from "lucide-react";
import ChatFilters from "./ChatFilters";
import ConversationItem from "../conversation/ConversationItem";

export default function ChatSidebar({
  conversations,
  selectedChat,
  setSelectedChat,
  darkMode,
  currentUserId,
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = conversations
    .filter((chat) => {
      if (activeFilter === "Unread") return chat.unread > 0;
      if (activeFilter === "Sent") return chat.demande_avis_id && chat.demande_medecin_demandeur_id === currentUserId;
      if (activeFilter === "Received") return chat.demande_avis_id && chat.demande_medecin_demandeur_id !== currentUserId;
      if (activeFilter === "Doctors") return chat.demande_avis_id;
      if (activeFilter === "Patients") return !chat.demande_avis_id;
      return true;
    })
    .filter((chat) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (chat.name && chat.name.toLowerCase().includes(q)) ||
        (chat.demande_motif && chat.demande_motif.toLowerCase().includes(q)) ||
        (chat.demande_specialite &&
          chat.demande_specialite.toLowerCase().includes(q))
      );
    });

  return (
    /*
      flex-col on this panel:
        • "fixed" header zone (flex-shrink-0): title + search + filters
        • scrollable list (flex-1 overflow-y-auto)
    */
    <div
      className={`flex flex-col w-full md:w-[340px] min-h-0 border-r flex-shrink-0
        ${selectedChat !== null ? "hidden md:flex" : "flex"}
        ${darkMode ? "bg-gray-950 border-gray-800" : "bg-gray-50 border-gray-200"}`}
    >
      {/* ── Fixed top: title + search + filters ─────────────── */}
      <div
        className={`flex-shrink-0 px-4 pt-4 pb-3 space-y-3 border-b
          ${darkMode ? "bg-gray-950 border-gray-800" : "bg-gray-50 border-gray-200"}`}
      >
        <h1 className="text-lg font-bold text-blue-500">Messages</h1>

        {/* Search input */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl
          ${darkMode ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className={`flex-1 bg-transparent outline-none text-sm
              ${darkMode ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`}
          />
        </div>

        {/* Filters */}
        <ChatFilters
          active={activeFilter}
          setActive={setActiveFilter}
          darkMode={darkMode}
        />
      </div>

      {/* ── Scrollable list ──────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2 px-2 space-y-1">
        {filtered.length === 0 && (
          <p
            className={`text-sm text-center py-10
              ${darkMode ? "text-gray-500" : "text-gray-400"}`}
          >
            Aucune conversation
          </p>
        )}
        {filtered.map((chat) => (
          <ConversationItem
            key={chat.id}
            chat={chat}
            isSelected={selectedChat === chat.id}
            onClick={() => setSelectedChat(chat.id)}
            darkMode={darkMode}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

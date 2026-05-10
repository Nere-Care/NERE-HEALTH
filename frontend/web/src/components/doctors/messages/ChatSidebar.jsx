import { useState } from "react";
import ChatFilters from "./ChatFilters";
import ChatHorizontalList from "./ChatHorizontalList";
import ConversationItem from "../conversation/ConversationItem";

export default function ChatSidebar({
  conversations,
  selectedChat,
  setSelectedChat,
  darkMode,
}) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = conversations.filter((chat) => {
    if (activeFilter === "Unread") return chat.unread > 0;
    if (activeFilter === "Doctors") return chat.role === "Doctor";
    if (activeFilter === "Patients") return chat.role === "Patient";
    if (activeFilter === "Laboratory") return chat.role === "Laboratory";
    return true;
  });

  return (
    <div
      className={`w-full md:w-[360px] flex flex-col border-r
      ${selectedChat !== null ? "hidden md:flex" : "flex"}
      ${darkMode ? "bg-gray-900 border-gray-800" : "bg-gray-100 border-gray-200"}`}
    >
      <div className="p-3 space-y-3">
        <h1 className="text-lg text-blue-500 font-semibold">Messages</h1>

        <ChatHorizontalList conversations={conversations} darkMode={darkMode} />

        <ChatFilters
          active={activeFilter}
          setActive={setActiveFilter}
          darkMode={darkMode}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.map((chat) => (
          <ConversationItem
            key={chat.id}
            chat={chat}
            isSelected={selectedChat === chat.id}
            onClick={() => setSelectedChat(chat.id)}
            darkMode={darkMode}
          />
        ))}
      </div>
    </div>
  );
}
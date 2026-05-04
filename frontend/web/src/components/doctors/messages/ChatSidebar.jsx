import ChatFilters from "./ChatFilters";
import ChatHorizontalList from "./ChatHorizontalList";
import ConversationItem from "../conversation/ConversationItem";
import { useState } from "react";

export default function ChatSidebar({
  conversations,
  selectedChat,
  setSelectedChat,
  darkMode,
}) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredChats = conversations.filter((chat) => {
    if (activeFilter === "Unread") return chat.unread > 0;
    if (activeFilter === "Doctors") return chat.role === "Doctor";
    if (activeFilter === "Patients") return chat.role === "Patient";
    if (activeFilter === "Laboratory") return chat.role === "Laboratory";
    return true;
  });

  return (
    <div
  className={`
    w-full md:w-[360px] flex flex-col border-r
    ${selectedChat !== null ? "hidden md:flex" : "flex"}
    ${darkMode ? "bg-gray-900 border-gray-700" : "bg-[#F7F9FC] border-gray-300"}
  `}
   >

      <div className="p-3 md:p-4 space-y-3">
        <h1 className="text-lg text-blue-500">Chats</h1>

        <ChatHorizontalList conversations={conversations} darkMode={darkMode} />

        <ChatFilters active={activeFilter} setActive={setActiveFilter} darkMode={darkMode} />
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2">
        {filteredChats.map((chat) => (
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
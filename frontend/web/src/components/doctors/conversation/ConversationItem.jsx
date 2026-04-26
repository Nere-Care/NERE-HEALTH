import React from "react";

export default function ConversationItem({
  chat,
  isSelected,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        flex gap-3 p-3 rounded-2xl cursor-pointer transition
        ${isSelected ? "bg-white shadow" : "hover:bg-white/70"}
      `}
    >
      {/* AVATAR */}
      <img
        src={chat.avatar}
        className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover"
        alt="avatar"
      />

      {/* CONTENT */}
      <div className="flex-1 min-w-0">

        {/* TOP ROW */}
        <div className="flex justify-between items-center gap-2">

          <p className="text-sm font-semibold truncate">
            {chat.name}
          </p>

          <span className="text-[10px] md:text-[11px] text-gray-400 whitespace-nowrap">
            {chat.time}
          </span>

        </div>

        {/* ROLE + UNREAD */}
        <div className="flex justify-between items-center">

          <p className="text-xs text-gray-500 truncate">
            {chat.role}
          </p>

          {chat.unread > 0 && (
            <span className="bg-blue-600 text-white text-[10px] md:text-xs px-2 rounded-full">
              {chat.unread}
            </span>
          )}

        </div>

        {/* LAST MESSAGE */}
        <p className="text-xs md:text-sm text-gray-600 truncate">
          {chat.lastMessage}
        </p>

      </div>
    </div>
  );
}
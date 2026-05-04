import React from "react";

export default function ConversationItem({
  chat,
  isSelected,
  onClick,
  darkMode,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        flex gap-3
        p-2.5 sm:p-3 md:p-3.5
        rounded-2xl cursor-pointer
        transition active:scale-[0.98]

        ${isSelected
          ? darkMode
            ? "bg-gray-700 shadow"
            : "bg-white shadow"
          : darkMode
            ? "hover:bg-gray-700"
            : "hover:bg-white/70"
        }
      `}
    >
      {/* AVATAR */}
      <img
        src={chat.avatar}
        className="
          w-9 h-9
          sm:w-10 sm:h-10
          md:w-11 md:h-11
          rounded-full object-cover
          flex-shrink-0
        "
      />

      {/* CONTENT */}
      <div className="flex-1 min-w-0">

        {/* TOP ROW */}
        <div className="flex justify-between items-center gap-2">
          <p className="text-[13px] sm:text-sm font-semibold truncate">
            {chat.name}
          </p>

          <span
            className={`
              text-[9px] sm:text-[10px] md:text-[11px]
              whitespace-nowrap flex-shrink-0
              ${darkMode ? "text-gray-400" : "text-gray-400"}
            `}
          >
            {chat.time}
          </span>
        </div>

        {/* ROLE + UNREAD */}
        <div className="flex justify-between items-center mt-[2px]">
          <p
            className={`
              text-[10px] sm:text-[11px] md:text-xs
              truncate
              ${darkMode ? "text-gray-300" : "text-gray-500"}
            `}
          >
            {chat.role}
          </p>

          {chat.unread > 0 && (
            <span
              className="
                bg-blue-600 text-white
                text-[9px] sm:text-[10px] md:text-xs
                px-1.5 sm:px-2
                rounded-full
                min-w-[16px]
                text-center
              "
            >
              {chat.unread}
            </span>
          )}
        </div>

        {/* LAST MESSAGE */}
        <p
          className={`
            text-[10px] sm:text-[11px] md:text-sm
            truncate mt-[2px]
            ${darkMode ? "text-gray-300" : "text-gray-600"}
          `}
        >
          {chat.lastMessage}
        </p>

      </div>
    </div>
  );
}
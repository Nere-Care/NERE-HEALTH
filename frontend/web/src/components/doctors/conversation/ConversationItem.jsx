export default function ConversationItem({
  chat,
  isSelected,
  onClick,
  darkMode,
}) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 p-3 rounded-xl cursor-pointer transition
      ${
        isSelected
          ? darkMode
            ? "bg-gray-700"
            : "bg-white shadow"
          : darkMode
          ? "hover:bg-gray-800"
          : "hover:bg-gray-200"
      }`}
    >
      <img
        src={chat.avatar}
        className="w-10 h-10 rounded-full object-cover"
      />

      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <p className="text-sm font-semibold truncate">{chat.name}</p>
          <span className="text-xs text-gray-400">{chat.time}</span>
        </div>

        <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
      </div>
    </div>
  );
}
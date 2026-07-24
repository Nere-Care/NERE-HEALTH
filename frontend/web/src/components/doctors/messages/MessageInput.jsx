import { Send, Lock } from "lucide-react";

export default function MessageInput({
  message,
  setMessage,
  onSend,
  onKeyDown,
  isBlocked,
  isClosed,
  darkMode,
}) {
  const disabled = isBlocked || isClosed;
  return (
    <div
      className={`flex-shrink-0 flex flex-col gap-0 border-t
      ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
    >
      {isClosed && (
        <div className={`flex items-center gap-2 px-4 py-2 text-xs font-medium
          ${darkMode ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-600"}`}>
          <Lock size={12} />
          Conversation fermée — les patients ne peuvent plus envoyer de messages
        </div>
      )}
      <div className="flex items-center gap-2 p-3">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className={`flex-1 px-4 py-2.5 rounded-full outline-none text-sm ${
            darkMode ? "bg-gray-700 text-white placeholder-gray-400" : "bg-gray-100 text-gray-800 placeholder-gray-400"
          }`}
          placeholder={
            isClosed
              ? "Conversation fermée par le médecin"
              : isBlocked
              ? "Conversation bloquée"
              : "Écrivez votre message..."
          }
        />
        <button
          onClick={onSend}
          disabled={disabled || !message.trim()}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            disabled || !message.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

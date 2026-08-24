import { getStoredUser } from "../../../services/auth";
import { getUserTimezone } from "../../../utils/timezone";

function decodeMsg(data) {
  try {
    return decodeURIComponent(escape(atob(data)));
  } catch {
    return data || "";
  }
}

export default function ChatMessage({ msg, darkMode }) {
  const currentUser = getStoredUser();
  const isMine = String(msg.expediteur_id) === String(currentUser?.id);

  if (msg.type === "systeme") {
    return (
      <div className="flex justify-center my-2">
        <div
          className={`px-4 py-1.5 rounded-xl text-xs text-center max-w-[80%] ${
            darkMode
              ? "bg-gray-800 text-gray-400"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {decodeMsg(msg.contenu_chiffre)}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div
        className={`max-w-[75%] px-3 py-2 text-sm ${
          isMine
            ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
            : "bg-gray-200 text-gray-900 rounded-2xl rounded-bl-md"
        }`}
      >
        <p className="break-words whitespace-pre-wrap">{decodeMsg(msg.contenu_chiffre)}</p>
        <p
          className={`text-[10px] mt-1 text-right ${
            isMine ? "text-blue-200" : "text-gray-500"
          }`}
        >
          {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: getUserTimezone(),
          })}
        </p>
      </div>
    </div>
  );
}

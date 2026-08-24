import {
  CalendarDays,
  Clock3,
  Video,
  MapPin,
  PhoneCall,
  MessageSquare,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRelativeBeneficiary } from "../../../utils/proche";

export default function AppointmentListCard({
  item,
  getStatusStyle,
  darkMode,
  onReschedule,
  onOpenChat,
  onOpenPatient,
  onNavigatePatient,
}) {
  const navigate = useNavigate();
  const procheBeneficiaire = getRelativeBeneficiary(item);
  return (
    <div
      className={`border rounded-2xl p-4 transition-colors duration-300 ${
        darkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      }`}
    >

      {/* MOBILE CARD */}
      <div className="flex flex-col gap-4 lg:hidden">

        <div className="flex items-center gap-3">
          <img
  src={item.patientImage}
  alt={item.patientName}
  onClick={() => onOpenPatient(item)}
  className="
    w-12 h-12 rounded-full object-cover
    cursor-pointer hover:scale-105 transition
  "
/>

          <div>
            <p
              onClick={onNavigatePatient}
              className={`font-semibold text-sm cursor-pointer hover:underline ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {item.patientName}
            </p>
            {procheBeneficiaire && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-md mt-0.5">
                <User size={10} /> Pour : {procheBeneficiaire}
              </span>
            )}

            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-xs ${getStatusStyle(
                item.status,
                darkMode
              )}`}
            >
              {item.status}
            </span>
          </div>
        </div>

        <div
          className={`grid grid-cols-2 gap-3 text-sm ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >

          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {item.date}
          </div>

          <div className="flex items-center gap-2">
            <Clock3 className="w-4 h-4" />
            {item.time}
          </div>

          <div className="flex items-center gap-2 col-span-2">
            {item.type === "Teleconsultation" ? (
              <>
                <Video
                  className={`w-4 h-4 ${
                    darkMode ? "text-blue-400" : "text-blue-500"
                  }`}
                />
                Teleconsultation
              </>
            ) : (
              <>
                <MapPin
                  className={`w-4 h-4 ${
                    darkMode ? "text-green-400" : "text-green-600"
                  }`}
                />
                In-person
              </>
            )}
          </div>

        </div>

        <div className="flex flex-wrap gap-2">

          {(() => {
            const hoursUntil = item.dateHeureDebut ? (new Date(item.dateHeureDebut) - new Date()) / (1000 * 60 * 60) : 0;
            const canReschedule = hoursUntil >= 48 && ["confirme", "en_attente"].includes(item.statut);
            return canReschedule ? (
              <button
                className={`px-3 py-2 rounded-xl text-xs border transition ${
                  darkMode
                    ? "border-green-500 text-green-400 hover:bg-gray-700"
                    : "border-green-600 text-green-600 hover:bg-green-50"
                }`}
                onClick={() => onReschedule(item)}
              >
                Reschedule
              </button>
            ) : (
              <button disabled title="Reprogrammation impossible moins de 48h avant le rendez-vous"
                className={`px-3 py-2 rounded-xl text-xs border transition cursor-not-allowed ${
                  darkMode ? "border-gray-600 text-gray-500" : "border-gray-300 text-gray-400"
                }`}>
                Reschedule
              </button>
            );
          })()}

          <button
            className={`px-3 py-2 rounded-xl text-xs flex items-center gap-1 border transition ${
              darkMode
                ? "border-blue-500 text-blue-400 hover:bg-gray-700"
                : "border-blue-600 text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => onOpenChat && onOpenChat(item)}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Message
          </button>

          {item.type === "Teleconsultation" && (
            <button
              className={`px-3 py-2 rounded-xl text-xs flex items-center gap-1 text-white transition ${
                darkMode
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              onClick={() => navigate("/Teleconsultation")}
            >
              <PhoneCall className="w-4 h-4" />
              Join
            </button>
          )}

        </div>

      </div>

      {/* DESKTOP ROW */}
      <div className="hidden lg:grid grid-cols-6 items-center gap-4">

        <div className="col-span-1 flex items-center gap-3 min-w-0">
          <img
  src={item.patientImage}
  alt={item.patientName}
  onClick={() => onOpenPatient(item)}
  className="
    w-12 h-12 rounded-full object-cover
    cursor-pointer hover:scale-105 transition
  "
/>

          <div className="min-w-0 flex-1">
            <span
              onClick={onNavigatePatient}
              className={`font-semibold truncate block cursor-pointer hover:underline ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {item.patientName}
            </span>
            {procheBeneficiaire && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.5 rounded mt-0.5 truncate max-w-full">
                <User size={10} /> Pour: {procheBeneficiaire}
              </span>
            )}
          </div>
        </div>

        <div className="col-span-1">
          <span
            className={`px-3 py-1 rounded-full text-xs ${getStatusStyle(
              item.status,
              darkMode
            )}`}
          >
            {item.status}
          </span>
        </div>

        <div
          className={`col-span-1 flex items-center gap-2 text-sm ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          {item.date}
        </div>

        <div
          className={`col-span-1 flex items-center gap-2 text-sm ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          <Clock3 className="w-4 h-4" />
          {item.time}
        </div>

        <div
          className={`col-span-1 flex items-center gap-2 text-sm ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {item.type === "Teleconsultation" ? (
            <>
              <Video
                className={`w-4 h-4 ${
                  darkMode ? "text-blue-400" : "text-blue-500"
                }`}
              />
              Teleconsultation
            </>
          ) : (
            <>
              <MapPin
                className={`w-4 h-4 ${
                  darkMode ? "text-green-400" : "text-green-600"
                }`}
              />
              In-person
            </>
          )}
        </div>

        <div className="col-span-1 flex gap-2 justify-end">

          {(() => {
            const hoursUntil = item.dateHeureDebut ? (new Date(item.dateHeureDebut) - new Date()) / (1000 * 60 * 60) : 0;
            const canReschedule = hoursUntil >= 48 && ["confirme", "en_attente"].includes(item.statut);
            return canReschedule ? (
              <button
                className={`px-3 py-1 rounded-xl text-xs border transition ${
                  darkMode
                    ? "border-green-500 text-green-400 hover:bg-gray-700"
                    : "border-green-600 text-green-600 hover:bg-green-50"
                }`}
                onClick={() => onReschedule(item)}
              >
                Reschedule
              </button>
            ) : (
              <button disabled title="Reprogrammation impossible moins de 48h avant le rendez-vous"
                className={`px-3 py-1 rounded-xl text-xs border transition cursor-not-allowed ${
                  darkMode ? "border-gray-600 text-gray-500" : "border-gray-300 text-gray-400"
                }`}>
                Reschedule
              </button>
            );
          })()}

          <button
            className={`px-3 py-1 rounded-xl text-xs flex items-center gap-1 border transition ${
              darkMode
                ? "border-blue-500 text-blue-400 hover:bg-gray-700"
                : "border-blue-600 text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => onOpenChat && onOpenChat(item)}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Message
          </button>

          {item.type === "Teleconsultation" && (
            <button
              className={`px-3 py-1 rounded-xl text-xs flex items-center gap-1 text-white transition ${
                darkMode
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              onClick={() => navigate("/teleconsultation")}
            >
              <PhoneCall className="w-4 h-4" />
              Join
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
import {
  CalendarDays,
  Clock3,
  Video,
  MapPin,
  PhoneCall,
} from "lucide-react";

export default function AppointmentListCard({
  item,
  getStatusStyle,
  darkMode,
}) {
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
            className="w-12 h-12 rounded-full object-cover"
          />

          <div>
            <p
              className={`font-semibold text-sm ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {item.patientName}
            </p>

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

          <button
            className={`px-3 py-2 rounded-xl text-xs border transition ${
              darkMode
                ? "border-green-500 text-green-400 hover:bg-gray-700"
                : "border-green-600 text-green-600 hover:bg-green-50"
            }`}
          >
            Reschedule
          </button>

          {item.type === "Teleconsultation" && (
            <button
              className={`px-3 py-2 rounded-xl text-xs flex items-center gap-1 text-white transition ${
                darkMode
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-green-600 hover:bg-green-700"
              }`}
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
            className="w-12 h-12 rounded-full object-cover"
          />

          <span
            className={`font-semibold truncate ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {item.patientName}
          </span>
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

          <button
            className={`px-3 py-1 rounded-xl text-xs border transition ${
              darkMode
                ? "border-green-500 text-green-400 hover:bg-gray-700"
                : "border-green-600 text-green-600 hover:bg-green-50"
            }`}
          >
            Reschedule
          </button>

          {item.type === "Teleconsultation" && (
            <button
              className={`px-3 py-1 rounded-xl text-xs flex items-center gap-1 text-white transition ${
                darkMode
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-green-600 hover:bg-green-700"
              }`}
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
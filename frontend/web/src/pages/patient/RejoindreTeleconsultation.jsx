import { useParams, useNavigate } from "react-router-dom";
import VideoCallRoom from "../../components/doctors/teleconsultation/VideoCallRoom";

export default function RejoindreTeleconsultation({ darkMode }) {
  const { rdvId } = useParams();
  const navigate = useNavigate();

  return (
    <div className={`p-4 sm:p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <h1 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
        Teleconsultation en cours
      </h1>
      <VideoCallRoom
        rdvId={rdvId}
        isInitiator={false}
        onEnd={() => navigate("/Patient-dashboard")}
        darkMode={darkMode}
      />
    </div>
  );
}
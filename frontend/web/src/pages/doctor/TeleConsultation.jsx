import { useState } from "react";
import IdleScreen from "../../components/doctors/teleconsultation/IdleScreen";
import CallScreen from "../../components/doctors/teleconsultation/CallScreen";

export default function TeleConsultation({ darkMode }) {
  const [inCall, setInCall] = useState(false);

  return (
    <>
      {inCall ? (
        <CallScreen darkMode={darkMode} endCall={() => setInCall(false)} />
      ) : (
        <IdleScreen darkMode={darkMode} startCall={() => setInCall(true)} />
      )}
    </>
  );
}
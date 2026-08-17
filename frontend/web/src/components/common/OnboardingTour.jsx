import { useState, useEffect } from "react";
import { Joyride, STATUS } from "react-joyride";


export default function OnboardingTour({ steps, tourId, darkMode, run }) {
  const [runTour, setRunTour] = useState(false);
  const storageKey = `tour_${tourId}_completed`;

  useEffect(() => {
    const isCompleted = localStorage.getItem(storageKey);

    if (run) {
      setRunTour(true);
    } else if (!isCompleted) {
      // Décalage pour s'assurer que le DOM et la Sidebar sont prêts
      const timer = setTimeout(() => setRunTour(true), 400);
      return () => clearTimeout(timer);
    }
  }, [run, storageKey]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [
      STATUS?.FINISHED || "finished",
      STATUS?.SKIPPED || "skipped",
    ];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem(storageKey, "true");
    }
  };

  // Styles modernisés adaptés au Light / Dark Mode
  const joyrideStyles = {
    options: {
      zIndex: 10000,
      primaryColor: "#3b82f6", // Blue-500
      backgroundColor: darkMode ? "#0f172a" : "#ffffff", // Slate-900 / Pure White
      textColor: darkMode ? "#f8fafc" : "#0f172a", // Slate-50 / Slate-900
      arrowColor: darkMode ? "#0f172a" : "#ffffff",
      overlayColor: darkMode ? "rgba(15, 23, 42, 0.75)" : "rgba(15, 23, 42, 0.45)",
      beaconSize: 36,
    },
    tooltip: {
      borderRadius: "16px",
      padding: 0,
      boxShadow: darkMode
        ? "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
        : "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
      border: darkMode ? "1px solid #334155" : "1px solid #f1f5f9",
      maxWidth: "380px",
      overflow: "hidden",
    },
    tooltipContainer: {
      lineHeight: 1.6,
      textAlign: "left",
      padding: "24px 24px 16px 24px",
    },
    tooltipTitle: {
      fontSize: "1.05rem",
      fontWeight: "700",
      marginBottom: "8px",
      letterSpacing: "-0.01em",
      color: darkMode ? "#f8fafc" : "#0f172a",
    },
    tooltipContent: {
      fontSize: "0.9rem",
      color: darkMode ? "#94a3b8" : "#475569",
    },
    buttonNext: {
      backgroundColor: "#2563eb", // Blue-600
      color: "#ffffff",
      borderRadius: "10px",
      padding: "8px 18px",
      fontSize: "0.85rem",
      fontWeight: "600",
      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
      border: "none",
      outline: "none",
      transition: "all 0.2s ease",
    },
    buttonBack: {
      color: darkMode ? "#94a3b8" : "#64748b",
      fontSize: "0.85rem",
      fontWeight: "500",
      marginRight: "8px",
      outline: "none",
    },
    buttonSkip: {
      color: darkMode ? "#64748b" : "#94a3b8",
      fontSize: "0.85rem",
      fontWeight: "500",
      outline: "none",
    },
    progressBar: {
      backgroundColor: darkMode ? "#1e293b" : "#f1f5f9",
      height: "4px",
      borderRadius: "2px",
      margin: "0 24px 20px 24px",
    },
    progressBarFill: {
      backgroundColor: "#2563eb",
      height: "4px",
      borderRadius: "2px",
      transition: "width 0.3s ease",
    },
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      disableOverlayClose={true}
      spotlightPadding={6}
      floaterProps={{
        disableAnimation: false,
      }}
      callback={handleJoyrideCallback}
      styles={joyrideStyles}
      locale={{
        back: "Précédent",
        close: "Fermer",
        last: "C'est parti !",
        next: "Suivant",
        skip: "Passer",
      }}
    />
  );
}
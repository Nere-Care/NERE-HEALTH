const DEFAULT_TZ = "Africa/Douala";

function getAccountTimezone() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.timezone) return user.timezone;
    }
  } catch {
    // ignore
  }
  return DEFAULT_TZ;
}

export function getUserTimezone() {
  try {
    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (deviceTimezone) return deviceTimezone;
  } catch (e) {
    // ignore
  }
  return getAccountTimezone();
}

export function slotToUTCISO(dateStr, timeStr, tzName) {
  if (!dateStr || !timeStr) return new Date().toISOString();

  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);

  const refUTC = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));

  const tz = tzName || "UTC";
  const inTZ = refUTC.toLocaleString("en-US", { timeZone: tz });
  const inUTC = refUTC.toLocaleString("en-US", { timeZone: "UTC" });

  const offsetMs = new Date(inTZ) - new Date(inUTC);

  return new Date(refUTC.getTime() - offsetMs).toISOString();
}

export function slotWallTimeInTZ(dateStr, timeStr, fromTz, toTz) {
  if (!dateStr || !timeStr) return timeStr;
  const instant = slotToUTCISO(dateStr, timeStr, fromTz);
  return new Date(instant).toLocaleTimeString("fr-FR", {
    timeZone: toTz,
    hour: "2-digit",
    minute: "2-digit",
  });
}

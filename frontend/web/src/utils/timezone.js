export function getUserTimezone() {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    return u?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }
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

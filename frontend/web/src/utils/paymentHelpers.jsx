export const exportToCSV = (data, filename = "payments") => {
  if (!data?.length) return;
  const headers = Object.keys(data[0]).filter(k => k !== "id" && k !== "receipt");
  const csv = [
    headers.join(","),
    ...data.map(row => headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadPDF = async (url, filename = "receipt.pdf") => {
  if (!url) return false;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch {
    window.open(url, "_blank");
    return false;
  }
};
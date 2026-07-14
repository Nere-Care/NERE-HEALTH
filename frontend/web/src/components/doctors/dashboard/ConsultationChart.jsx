import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ConsultationChart({ darkMode, data = [] }) {
  const total = data.reduce((acc, d) => acc + (d.total || 0), 0);

  return (
    <div className={`rounded-2xl p-4 sm:p-5 border transition h-[260px] sm:h-[300px] lg:h-[340px] flex flex-col min-h-0
      ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-black"}`}>

      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="font-semibold text-sm sm:text-base">Consultations mensuelles</h2>
        <span className="text-xs font-medium text-blue-500">{total} total</span>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: darkMode ? "#9ca3af" : "#374151" }} />
            <YAxis tick={{ fontSize: 11, fill: darkMode ? "#9ca3af" : "#374151" }} />
            <Tooltip contentStyle={{
              backgroundColor: darkMode ? "#1f2937" : "#fff",
              border: "none", borderRadius: "10px",
            }} />
            <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
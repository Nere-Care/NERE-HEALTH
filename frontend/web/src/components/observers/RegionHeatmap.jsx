import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { region: "Littoral", cases: 1200 },
  { region: "Centre", cases: 900 },
  { region: "Nord", cases: 600 },
  { region: "Ouest", cases: 400 },
];

export default function RegionHeatmap({ darkMode }) {
  return (
    <div className={`p-4 rounded-xl border
      ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
    `}>

      <h3 className="font-semibold mb-3">Regional Distribution</h3>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="region" stroke={darkMode ? "#aaa" : "#333"} />
          <YAxis stroke={darkMode ? "#aaa" : "#333"} />
          <Tooltip />
          <Bar dataKey="cases" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}
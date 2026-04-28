import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", cases: 400 },
  { month: "Feb", cases: 800 },
  { month: "Mar", cases: 600 },
  { month: "Apr", cases: 1200 },
];

export default function EpidemicTrendChart({ darkMode }) {
  return (
    <div className={`p-4 rounded-xl border
      ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
    `}>

      <h3 className="font-semibold mb-3">Disease Evolution</h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="month" stroke={darkMode ? "#aaa" : "#333"} />
          <YAxis stroke={darkMode ? "#aaa" : "#333"} />
          <Tooltip />
          <Line type="monotone" dataKey="cases" stroke="#3b82f6" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}
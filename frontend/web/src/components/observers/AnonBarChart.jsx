import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function AnonBarChart({ data, darkMode, height = 250, color = "#3b82f6" }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <XAxis 
          dataKey={data[0]?.region || data[0]?.age || data[0]?.type || "label"} 
          stroke={darkMode ? "#64748b" : "#94a3b8"} 
          fontSize={11}
          interval={0}
          angle={-10}
          textAnchor="end"
          height={60}
        />
        <YAxis stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: darkMode ? "#1e293b" : "#fff",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        />
        <Bar dataKey={Object.keys(data[0] || {}).find(k => k !== "region" && k !== "age" && k !== "type" && k !== "label") || "value"} fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
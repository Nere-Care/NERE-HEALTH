import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
} from "recharts";

export default function AnonLineChart({
  data = [],
  darkMode = false,
  height = 250,
  lineColor = "#3b82f6",
  dataKey = "value",
  xAxisKey = "label",
  showDots = false,
  showGrid = true,
  fillArea = true,
}) {

  const gradientId = `line-gradient-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
        >

          {/* Gradient SVG natif */}
          {fillArea && (
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={lineColor}
                  stopOpacity={0.25}
                />

                <stop
                  offset="95%"
                  stopColor={lineColor}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
          )}

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? "#334155" : "#e2e8f0"}
              vertical={false}
            />
          )}

          <XAxis
            dataKey={xAxisKey}
            stroke={darkMode ? "#64748b" : "#94a3b8"}
            fontSize={12}
            tickLine={false}
            axisLine={{
              stroke: darkMode ? "#475569" : "#cbd5e1",
            }}
          />

          <YAxis
            stroke={darkMode ? "#64748b" : "#94a3b8"}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value.toLocaleString("fr-FR")
            }
            domain={["auto", "auto"]}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: darkMode
                ? "#1e293b"
                : "#ffffff",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              color: darkMode ? "#f8fafc" : "#0f172a",
              fontSize: "13px",
              padding: "10px 14px",
            }}
            formatter={(value) => [
              `${Number(value).toLocaleString("fr-FR")}`,
              "Estimation lissée",
            ]}
            labelFormatter={(label) =>
              `Période: ${label}`
            }
          />

          {fillArea && (
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="none"
              fill={`url(#${gradientId})`}
            />
          )}

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={3}
            dot={showDots}
            activeDot={{
              r: 6,
              fill: lineColor,
              stroke: darkMode ? "#0f172a" : "#ffffff",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block"></span>
        Tendances lissées • Bruit statistique appliqué pour anonymisation
      </p>
    </div>
  );
}
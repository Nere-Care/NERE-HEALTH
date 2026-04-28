import StatCard from "./StatCard";
import { stats } from "../../../constants/doctors/DasboardData";

export default function StatsSection({ darkMode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((item, i) => (
        <StatCard key={i} item={item} darkMode={darkMode} />
      ))}
    </div>
  );
}
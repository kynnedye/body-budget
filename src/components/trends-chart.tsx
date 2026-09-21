"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Metric = { id: string; name: string; color: string };
type TrendRow = {
  date: string;
  label: string;
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  [key: string]: string | number | null;
};

export function TrendsChart({
  rows,
  metrics,
  hasLogs,
}: {
  rows: TrendRow[];
  metrics: Metric[];
  hasLogs: boolean;
}) {
  const [metricId, setMetricId] = useState(metrics[0]?.id ?? "");
  const metric = useMemo(
    () => metrics.find((item) => item.id === metricId),
    [metricId, metrics],
  );

  if (!hasLogs) {
    return <p className="empty">Log a few days and your patterns will start appearing here. Missed days will stay on the axis as gaps.</p>;
  }

  return (
    <>
      <div className="section-heading">
        <div><h2>Your reserves over time</h2><p>Mood and energy, with one input or symptom layered in.</p></div>
        {metrics.length > 0 && (
          <select className="field" style={{ width: 190, marginTop: 0 }} value={metricId} onChange={(event) => setMetricId(event.target.value)}>
            {metrics.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        )}
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 8, left: -22, bottom: 4 }}>
            <CartesianGrid stroke="#ddd8ca" strokeDasharray="4 5" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#74796f", fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, "auto"]} tick={{ fill: "#74796f", fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 14, borderColor: "#ddd8ca", background: "#fffdf8" }} />
            <Legend />
            <Line type="monotone" dataKey="mood" name="Mood" stroke="#e0a83f" strokeWidth={3} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="energy" name="Energy" stroke="#667966" strokeWidth={3} dot={{ r: 3 }} />
            {metric && <Line type="monotone" dataKey={metric.id} name={metric.name} stroke={metric.color} strokeWidth={2} dot={{ r: 2 }} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

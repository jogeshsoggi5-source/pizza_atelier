import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import { formatPrice } from "@/lib/menu-data";

// SVG presentation attributes can't read CSS variables, so the brand colors are spelled out.
const colors = {
  revenue: "#D62828", // --tomato
  orders: "#8A6420", // deep gold, 4.5:1 on white
  grid: "#EFE6D8",
  axis: "#8C7B6B",
  cursor: "rgba(0,0,0,0.04)",
};

const axisTick = { fontSize: 11, fill: colors.axis };

function ChartTooltip({
  active,
  payload,
  format,
}: TooltipProps<number, string> & { format: (row: Record<string, unknown>) => [string, string] }) {
  if (!active || !payload?.length) return null;
  const [title, value] = format(payload[0].payload as Record<string, unknown>);
  return (
    <div className="rounded-lg border border-black/[0.06] bg-card px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground">{title}</p>
      <p className="mt-0.5 font-semibold text-foreground">{value}</p>
    </div>
  );
}

const compactINR = (v: number) =>
  v >= 1000 ? `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `₹${v}`;

/** Single-series bar chart of revenue per day. */
export function RevenueChart({
  data,
  height = 260,
}: {
  data: { label: string; fullLabel: string; revenue: number; orders: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -8 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke={colors.grid} />
        <XAxis
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={12}
        />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compactINR} width={52} />
        <Tooltip
          cursor={{ fill: colors.cursor }}
          content={
            <ChartTooltip
              format={(row) => [
                String(row.fullLabel),
                `${formatPrice(Number(row.revenue))} · ${row.orders} order${row.orders === 1 ? "" : "s"}`,
              ]}
            />
          }
        />
        <Bar dataKey="revenue" fill={colors.revenue} radius={[4, 4, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Single-series bar chart of order counts per hour. */
export function HourlyChart({
  data,
  height = 220,
}: {
  data: { label: string; orders: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap="18%">
        <CartesianGrid vertical={false} stroke={colors.grid} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} minTickGap={8} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip
          cursor={{ fill: colors.cursor }}
          content={
            <ChartTooltip
              format={(row) => [String(row.label), `${row.orders} order${row.orders === 1 ? "" : "s"}`]}
            />
          }
        />
        <Bar dataKey="orders" fill={colors.orders} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

import { useMemo } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { MetricHistoryEntry } from "@/hooks/use-metric-history"

interface MetricTrendChartProps {
  history: MetricHistoryEntry[]
  accentColor: string
}

export function MetricTrendChart({ history, accentColor }: MetricTrendChartProps) {
  const chartData = useMemo(() => {
    return history.map((entry) => {
      const numericValue = entry.percent
        ?? parseFloat(entry.value.replace(/[^0-9.]/g, ""))
        ?? 0
      return {
        time: new Date(entry.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
        value: numericValue,
        status: entry.status,
        displayValue: entry.value,
      }
    })
  }, [history])

  if (chartData.length < 2) {
    return (
      <div className="flex h-[80px] items-center justify-center">
        <p className="text-xs text-[#F8FAFC]/30">Not enough data for a trend yet</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
        <defs>
          <linearGradient id={`gradient-${accentColor}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity={0.4} />
            <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fill: "rgba(248,250,252,0.3)", fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const point = payload[0].payload
            return (
              <div className="rounded-md border border-[#0A1C14] bg-[#040D0A] px-2 py-1 text-xs">
                <span className="text-[#F8FAFC]/80">{point.displayValue}</span>
                <span className="ml-1 text-[#F8FAFC]/40">{point.time}</span>
              </div>
            )
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={accentColor}
          strokeWidth={1.5}
          fill={`url(#gradient-${accentColor})`}
          dot={false}
          activeDot={{ r: 3, fill: accentColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

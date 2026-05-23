/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, Typography, Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import SpeedIcon from "@mui/icons-material/Speed";
import MemoryIcon from "@mui/icons-material/Memory";
import RouterIcon from "@mui/icons-material/Router";
import { MetricTelemetry } from "../../types";

interface MetricsLineChartProps {
  history: MetricTelemetry[];
}

type ChartViewMetric = "all" | "cpu" | "memory" | "network" | "latency";

const MetricsLineChart: React.FC<MetricsLineChartProps> = ({ history }) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartViewMetric>("all");

  const handleMetricChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMetric: ChartViewMetric | null
  ) => {
    if (newMetric !== null) {
      setSelectedMetric(newMetric);
    }
  };

  // Format data for Recharts, memoizing to prevent expensive re-mappers
  const chartData = useMemo(() => {
    return history.map((m) => {
      const date = new Date(m.timestamp);
      const timeStr = date.toLocaleTimeString(undefined, {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return {
        ...m,
        timeLabel: timeStr,
        // formatted versions if needed for tooltip or display
      };
    });
  }, [history]);

  // Clean custom tooltip component to preserve layout unity with MUI clean theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: "#1e293b",
            color: "#ffffff",
            border: "1px solid #334155",
            borderRadius: "8px",
            p: 1.5,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontFamily: "monospace",
            fontSize: "0.75rem",
          }}
        >
          <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "#94a3b8", fontWeight: 700 }}>
            Timestamp: {label}
          </Typography>
          {payload.map((entry: any, index: number) => {
            let unit = "";
            if (entry.name.includes("CPU") || entry.name.includes("Memory")) unit = "%";
            else if (entry.name.includes("Net")) unit = " KB/s";
            else if (entry.name.includes("Latency")) unit = " ms";

            return (
              <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1, my: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: entry.color || entry.stroke,
                  }}
                />
                <span style={{ color: "#e2e8f0" }}>{entry.name}:</span>
                <span style={{ color: entry.color || entry.stroke, fontWeight: 700 }}>
                  {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
                  {unit}
                </span>
              </Box>
            );
          })}
        </Box>
      );
    }
    return null;
  };

  return (
    <Card id="metrics-chart-card" sx={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "none" }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box id="chart-card-title">
            <Typography variant="h6" sx={{ color: "#1e293b", fontWeight: 700, fontSize: "1.05rem" }}>
              TELEMETRY HISTOGRAM
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Dynamic Rolling View of Main Machine Metrics
            </Typography>
          </Box>

          <ToggleButtonGroup
            id="chart-metric-selector"
            value={selectedMetric}
            exclusive
            onChange={handleMetricChange}
            size="small"
            sx={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              p: "3px",
              flexWrap: "wrap",
              alignSelf: { xs: "flex-start", sm: "center" },
              "& .MuiToggleButton-root": {
                color: "#64748b",
                border: "none",
                borderRadius: "6px",
                p: "6px 12px",
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "none",
                "&.Mui-selected": {
                  color: "#ffffff",
                  background: "#3b82f6",
                  "&:hover": {
                    background: "#2563eb",
                  },
                },
                "&:hover": {
                  background: "#f1f5f9",
                },
              },
            }}
          >
            <ToggleButton value="all">
              <TimelineIcon sx={{ fontSize: 14, mr: 0.5 }} /> Summary
            </ToggleButton>
            <ToggleButton value="cpu">
              <SpeedIcon sx={{ fontSize: 14, mr: 0.5 }} /> CPU
            </ToggleButton>
            <ToggleButton value="memory">
              <MemoryIcon sx={{ fontSize: 14, mr: 0.5 }} /> Memory
            </ToggleButton>
            <ToggleButton value="network">
              <RouterIcon sx={{ fontSize: 14, mr: 0.5 }} /> Network
            </ToggleButton>
            <ToggleButton value="latency">
              <TimelineIcon sx={{ fontSize: 14, mr: 0.5 }} /> Latency
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ height: 320, width: "100%", position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Clean premium color gradients for filling area ranges */}
                <linearGradient id="gradientCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientMemory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientNetIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientNetOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              
              <XAxis
                dataKey="timeLabel"
                tickLine={false}
                axisLine={false}
                stroke="#64748b"
                fontSize={10}
                fontFamily="monospace"
                dy={10}
                interval="preserveStartEnd"
                minTickGap={80}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="#64748b"
                fontSize={10}
                fontFamily="monospace"
                dx={-5}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "inherit",
                  color: "#1e293b",
                }}
              />

              {/* RENDER LINES DYNAMICALLY BASED ON VIEW PORT FILTER OPTIONS */}
              {(selectedMetric === "all" || selectedMetric === "cpu") && (
                <Area
                  type="monotone"
                  name="CPU Load"
                  dataKey="cpuLoad"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradientCpu)"
                  activeDot={{ r: 5 }}
                />
              )}

              {(selectedMetric === "all" || selectedMetric === "memory") && (
                <Area
                  type="monotone"
                  name="Memory Util"
                  dataKey="memoryUtilization"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradientMemory)"
                  activeDot={{ r: 5 }}
                />
              )}

              {selectedMetric === "network" && (
                <Area
                  type="monotone"
                  name="Net flow IN"
                  dataKey="networkIn"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradientNetIn)"
                  activeDot={{ r: 5 }}
                />
              )}

              {selectedMetric === "network" && (
                <Area
                  type="monotone"
                  name="Net flow OUT"
                  dataKey="networkOut"
                  stroke="#ec4899"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradientNetOut)"
                  activeDot={{ r: 5 }}
                />
              )}

              {(selectedMetric === "all" || selectedMetric === "latency") && (
                <Area
                  type="monotone"
                  name="Latency"
                  dataKey="responseTimeMs"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradientLatency)"
                  activeDot={{ r: 5 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default React.memo(MetricsLineChart);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box } from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import MemoryIcon from "@mui/icons-material/Memory";
import StorageIcon from "@mui/icons-material/Storage";
import TimerIcon from "@mui/icons-material/Timer";

// Import types
import { MetricTelemetry, SystemInfo } from "../../types";

// Import core MetricCard component
import MetricCard from "../MetricCard";

interface MetricsVitalsProps {
  currentMetric: MetricTelemetry | null;
  systemInfo: SystemInfo | null;
  sparklines: {
    cpu: number[];
    memory: number[];
    disk: number[];
    latency: number[];
  };
  getMetricStatus: (
    metricType: "cpu" | "memory" | "disk" | "responseTime",
    value: number
  ) => "healthy" | "warning" | "critical";
}

export default function MetricsVitals({
  currentMetric,
  systemInfo,
  sparklines,
  getMetricStatus,
}: MetricsVitalsProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" },
        gap: 2.5,
      }}
    >
      <MetricCard
        title="CPU Load"
        value={
          currentMetric && typeof currentMetric.cpuLoad === "number"
            ? currentMetric.cpuLoad.toFixed(1)
            : "--"
        }
        unit="%"
        percent={
          currentMetric && typeof currentMetric.cpuLoad === "number"
            ? currentMetric.cpuLoad
            : 0
        }
        subtitle={`${systemInfo?.totalCores || 4} Cores Configured`}
        icon={<SpeedIcon />}
        color="#3b82f6"
        status={
          currentMetric
            ? getMetricStatus("cpu", currentMetric.cpuLoad)
            : "healthy"
        }
        secondaryValue={
          currentMetric && typeof currentMetric.requestsPerSecond === "number"
            ? `${currentMetric.requestsPerSecond.toFixed(1)} req/sec`
            : undefined
        }
        sparklineData={sparklines.cpu}
      />

      <MetricCard
        title="Memory Usage"
        value={
          currentMetric && typeof currentMetric.memoryUsed === "number"
            ? currentMetric.memoryUsed.toFixed(2)
            : "--"
        }
        unit=" GB"
        percent={
          currentMetric && typeof currentMetric.memoryUtilization === "number"
            ? currentMetric.memoryUtilization
            : 0
        }
        subtitle={`of ${systemInfo?.totalMemGb || "--"} GB Total`}
        icon={<MemoryIcon />}
        color="#10b981"
        status={
          currentMetric
            ? getMetricStatus("memory", currentMetric.memoryUtilization)
            : "healthy"
        }
        secondaryValue={
          currentMetric && typeof currentMetric.memoryFree === "number"
            ? `${currentMetric.memoryFree.toFixed(2)} GB free`
            : undefined
        }
        sparklineData={sparklines.memory}
      />

      <MetricCard
        title="Disk Storage"
        value={
          currentMetric && typeof currentMetric.diskUsed === "number"
            ? currentMetric.diskUsed.toFixed(1)
            : "--"
        }
        unit=" GB"
        percent={
          currentMetric && typeof currentMetric.diskUtilization === "number"
            ? currentMetric.diskUtilization
            : 0
        }
        subtitle={
          currentMetric && typeof currentMetric.diskTotal === "number"
            ? `of ${currentMetric.diskTotal.toFixed(1)} GB Partition`
            : "of -- GB Partition"
        }
        icon={<StorageIcon />}
        color="#ec4899"
        status={
          currentMetric
            ? getMetricStatus("disk", currentMetric.diskUtilization)
            : "healthy"
        }
        secondaryValue={
          currentMetric &&
          typeof currentMetric.diskTotal === "number" &&
          typeof currentMetric.diskUsed === "number"
            ? `${(currentMetric.diskTotal - currentMetric.diskUsed).toFixed(
                1
              )} GB free`
            : undefined
        }
        sparklineData={sparklines.disk}
      />

      <MetricCard
        title="Response Time"
        value={
          currentMetric && typeof currentMetric.responseTimeMs === "number"
            ? currentMetric.responseTimeMs.toFixed(0)
            : "--"
        }
        unit=" ms"
        percent={
          currentMetric && typeof currentMetric.responseTimeMs === "number"
            ? Math.min(100, currentMetric.responseTimeMs / 10)
            : 0
        }
        subtitle="Average request latency"
        icon={<TimerIcon />}
        color="#f59e0b"
        status={
          currentMetric
            ? getMetricStatus("responseTime", currentMetric.responseTimeMs)
            : "healthy"
        }
        secondaryValue={
          currentMetric ? `${currentMetric.activeConnections} active connections` : undefined
        }
        sparklineData={sparklines.latency}
      />
    </Box>
  );
}

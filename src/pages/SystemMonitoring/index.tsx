import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import DashboardHeader from "../../components/DashboardHeader";
import MetricsVitals from "../../components/MetricsVitals";
import ServerSpecs from "../../components/ServerSpecs";
import { useTelemetrySocket } from "../../hooks/useTelemetrySocket";
import { MetricTelemetry } from "../../types";

const MetricsLineChart = lazy(
  () => import("../../components/MetricsLineChart"),
);

const getMetricStatus = (
  metricType: "cpu" | "memory" | "disk" | "responseTime",
  value: number,
) => {
  const limits = {
    cpu: 80,
    memory: 85,
    disk: 90,
    responseTime: 400,
  };

  const warningLimit = limits[metricType];

  if (value <= warningLimit) {
    return "healthy";
  }

  if (
    (metricType === "responseTime" && value >= 500) ||
    (metricType !== "responseTime" && value >= 90)
  ) {
    return "critical";
  }

  return "warning";
};

export default function SystemMonitoring() {
  const {
    connected,
    latencyMs,
    metricsHistory,
    systemInfo,
    serverUptime,
  } = useTelemetrySocket();

  const [folderMetrics, setFolderMetrics] = useState<{
    totalSizeMb: number;
    fileCount: number;
    dirCount: number;
    nodeModulesSizeMb: number;
    srcFolderSizeMb: number;
    staticFilesCount: number;
  } | null>(null);

  useEffect(() => {
    const fetchFolderMetrics = async () => {
      try {
        const response = await fetch("/api/folder-metrics");
        const data = await response.json();

        if (data.success) {
          setFolderMetrics(data.metrics);
        }
      } catch (error) {
        console.error(
          "Error fetching workspace folder metrics:",
          error,
        );
      }
    };

    fetchFolderMetrics();
  }, []);

  const currentMetric = useMemo<MetricTelemetry | null>(
    () => metricsHistory.at(-1) ?? null,
    [metricsHistory],
  );

  const sparklines = useMemo(() => {
    const recentMetrics = metricsHistory.slice(-12);

    return {
      cpu: recentMetrics.map((metric) => metric.cpuLoad),
      memory: recentMetrics.map(
        (metric) => metric.memoryUtilization,
      ),
      disk: recentMetrics.map(
        (metric) => metric.diskUtilization,
      ),
      latency: recentMetrics.map(
        (metric) => metric.responseTimeMs,
      ),
    };
  }, [metricsHistory]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        px: { xs: 2, md: 3 },
        py: 3,
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "45vw",
          height: "45vw",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(59,130,246,0.01) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "12%",
          right: "5%",
          width: "40vw",
          height: "40vw",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(168,85,247,0.01) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <Stack
        spacing={3}
        sx={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <DashboardHeader
          connected={connected}
          latencyMs={latencyMs}
          systemInfo={systemInfo}
          serverUptime={serverUptime}
          activeAlertCount={0}
        />

        <ServerSpecs
          systemInfo={systemInfo}
          folderMetrics={folderMetrics}
        />

        <MetricsVitals
          currentMetric={currentMetric}
          systemInfo={systemInfo}
          sparklines={sparklines}
          getMetricStatus={getMetricStatus}
        />

        <Suspense
          fallback={
            <Paper
              elevation={0}
              sx={{
                height: 320,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <CircularProgress size={30} />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Initializing live histogram charts...
              </Typography>
            </Paper>
          }
        >
          <MetricsLineChart history={metricsHistory} />
        </Suspense>
      </Stack>
    </Box>
  );
}
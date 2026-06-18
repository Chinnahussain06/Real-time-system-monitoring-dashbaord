import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import {
  Container,
  Box,
  CircularProgress,
  Typography
} from "@mui/material";

import {
  MetricTelemetry,
  SystemInfo,
  ClientToServerMsg,
  ServerToClientMsg,
} from "../../types";

import DashboardHeader from "../../components/DashboardHeader";
import ServerSpecs from "../../components/ServerSpecs";
import MetricsVitals from "../../components/MetricsVitals";

const MetricsLineChart = lazy(
  () => import("../../components/MetricsLineChart"),
);



export default function SystemMonitoring() {
  const [connected, setConnected] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [metricsHistory, setMetricsHistory] = useState<MetricTelemetry[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [serverUptime, setServerUptime] = useState<number>(0);
  const [folderMetrics, setFolderMetrics] = useState<{
    totalSizeMb: number;
    fileCount: number;
    dirCount: number;
    nodeModulesSizeMb: number;
    srcFolderSizeMb: number;
    staticFilesCount: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/folder-metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFolderMetrics(data.metrics);
        }
      })
      .catch((err) =>
        console.error("Error fetching workspace folder metrics:", err),
      );
  }, []);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingStartRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentMetric = useMemo<MetricTelemetry | null>(() => {
    return metricsHistory.length > 0
      ? metricsHistory[metricsHistory.length - 1]
      : null;
  }, [metricsHistory]);

  const connectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/api/telemetry`;
    console.log(`Connecting to WebSocket address: ${wsUrl}`);

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log(
        "WebSocket connected successfully with system-telemetry host.",
      );
      setConnected(true);

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      pingIntervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          pingStartRef.current = Date.now();
          const pingMsg: ClientToServerMsg = { type: "ping" };
          socket.send(JSON.stringify(pingMsg));
        }
      }, 3000);
    };

    socket.onmessage = (event) => {
      try {
        const message: ServerToClientMsg = JSON.parse(event.data);

        switch (message.type) {
          case "pong": {
            if (pingStartRef.current > 0) {
              const rtt = Date.now() - pingStartRef.current;
              setLatencyMs(rtt);
            }
            break;
          }
          case "sync_history": {
            setMetricsHistory(message.history);
            setSystemInfo(message.systemInfo);
            if (message.history.length > 0) {
              setServerUptime(
                message.history[message.history.length - 1].uptime,
              );
            }
            break;
          }
          case "metric_tick": {
            const freshTick = message.metric;
            setMetricsHistory((prev) => {
              const updated = [...prev, freshTick];
              if (updated.length > 60) {
                updated.shift();
              }
              return updated;
            });
            setServerUptime(freshTick.uptime);
            break;
          }
        }
      } catch (err) {
        console.error("Failed to parse incoming WebSocket frame payload:", err);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket socket connection closed.");
      setConnected(false);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting socket reconnect cycle...");
          connectWebSocket();
        }, 3000);
      }
    };

    socket.onerror = (err) => {
      console.error("A WebSocket connection error occurred:", err);
    };
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  const getMetricStatus = (
    metricType: "cpu" | "memory" | "disk" | "responseTime",
    value: number,
  ) => {
    let warningLimit = 80;
    if (metricType === "cpu") warningLimit = 80;
    else if (metricType === "memory") warningLimit = 85;
    else if (metricType === "disk") warningLimit = 90;
    else if (metricType === "responseTime") warningLimit = 400;

    if (value > warningLimit) {
      if (metricType === "responseTime" && value >= 500) return "critical";
      if (metricType !== "responseTime" && value >= 90) return "critical";
      return "warning";
    }
    return "healthy";
  };

  const sparklines = useMemo(() => {
    const subset = metricsHistory.slice(-12);
    return {
      cpu: subset.map((m) => m.cpuLoad),
      memory: subset.map((m) => m.memoryUtilization),
      disk: subset.map((m) => m.diskUtilization),
      latency: subset.map((m) => m.responseTimeMs),
    };
  }, [metricsHistory]);

  return (
  
      <Box
        id="app-root-container"
        sx={{
          minHeight: "100vh",
          background: "#f8fafc",
          pb: 8,
          position: "relative",
          overflow: "hidden",
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
              "radial-gradient(ellipse, rgba(59, 130, 246, 0.01) 0%, transparent 65%)",
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
              "radial-gradient(ellipse, rgba(168, 85, 247, 0.01) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <Container
          id="app-viewport-container"
          maxWidth={false}
          disableGutters
          sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 3.2 }}
        >
          <section id="banner-section">
            <DashboardHeader
              connected={connected}
              latencyMs={latencyMs}
              systemInfo={systemInfo}
              serverUptime={serverUptime}
              activeAlertCount={0}
            />
          </section>

          <section id="specs-section">
            <ServerSpecs
              systemInfo={systemInfo}
              folderMetrics={folderMetrics}
            />
          </section>

          <section id="vitals-section">
            <MetricsVitals
              currentMetric={currentMetric}
              systemInfo={systemInfo}
              sparklines={sparklines}
              getMetricStatus={getMetricStatus}
            />
          </section>

          <section id="charts-workspace" style={{ width: "100%" }}>
            <Suspense
              fallback={
                <Box
                  sx={{
                    height: 320,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    gap: 1.5,
                  }}
                >
                  <CircularProgress size={30} color="primary" />
                  <Typography
                    variant="body2"
                    sx={{ color: "#64748b", fontWeight: 500 }}
                  >
                    Initializing live histogram charts...
                  </Typography>
                </Box>
              }
            >
              <MetricsLineChart history={metricsHistory} />
            </Suspense>
          </section>
        </Container>
      </Box>
    
  );
}

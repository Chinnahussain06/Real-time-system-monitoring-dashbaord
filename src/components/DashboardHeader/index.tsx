import React, { useEffect, useState } from "react";
import { Box, Chip, Typography, Tooltip } from "@mui/material";
import TerminalIcon from "@mui/icons-material/Terminal";
import { SystemInfo } from "../../types";

interface DashboardHeaderProps {
  connected: boolean;
  latencyMs: number;
  systemInfo: SystemInfo | null;
  serverUptime: number; // in seconds
  activeAlertCount: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  connected,
  latencyMs,
  systemInfo,
  serverUptime,
  activeAlertCount,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString() + " UTC");
    };
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  const formatUptime = (secs: number) => {
    if (secs <= 0) return "0s";
    const d = Math.floor(secs / (3600 * 24));
    const h = Math.floor((secs % (3600 * 24)) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
  };

  return (
    <Box
      id="dashboard-header-container"
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "stretch", md: "center" },
        padding: "16px 24px",
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        borderRadius: "12px 12px 0 0",
        gap: 2,
      }}
    >
      <Box
        id="brand-stack"
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 1.5,
          alignItems: "center",
        }}
      >
        <Box
          id="brand-logo-glow"
          sx={{
            width: 34,
            height: 34,
            borderRadius: "6px",
            background: "#1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TerminalIcon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>
        <Box id="brand-text">
          <Typography
            id="brand-title"
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#1e293b",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            SYSTEM MONITORING
          </Typography>
          <Typography
            id="brand-subtitle"
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem" }}
          >
            Real-time System Metrics & Telemetry Feed
          </Typography>
        </Box>
      </Box>

      <Box
        id="status-actions-stack"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "flex-end",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1.5,
            alignItems: "center",
          }}
        >
          <Tooltip
            title={
              connected ? `RTT Latency: ${latencyMs}ms` : "Server disconnected"
            }
          >
            <Chip
              id="conn-status-chip"
              label={connected ? `CONNECTED (${latencyMs}ms)` : "DISCONNECTED"}
              color={
                connected ? (latencyMs > 200 ? "warning" : "success") : "error"
              }
              size="small"
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: "0.72rem",
                borderRadius: "6px",
                borderColor: connected
                  ? latencyMs > 200
                    ? "rgba(245, 158, 11, 0.4)"
                    : "rgba(16, 185, 129, 0.4)"
                  : "rgba(239, 68, 68, 0.4)",
                background: connected
                  ? latencyMs > 200
                    ? "rgba(245, 158, 11, 0.05)"
                    : "rgba(16, 185, 129, 0.05)"
                  : "rgba(239, 68, 68, 0.05)",
                color: connected
                  ? latencyMs > 200
                    ? "#b45309"
                    : "#047857"
                  : "#b91c1c",
              }}
            />
          </Tooltip>

          {activeAlertCount > 0 && (
            <Chip
              id="alert-indicator-chip"
              label={`${activeAlertCount} ACTIVE INCIDENTS`}
              color="error"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.72rem",
                borderRadius: "6px",
                background: "linear-gradient(90deg, #ef4444, #dc2626)",
                boxShadow: "0 0 12px rgba(239, 68, 68, 0.2)",
                animation: "pulse 2s infinite ease-in-out",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.75 },
                },
              }}
            />
          )}
        </Box>

        <Box
          id="metrics-time-pill"
          sx={{
            display: "flex",
            alignItems: "center",
            padding: "6px 14px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            background: "#f8fafc",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2.5,
              alignItems: "center",
            }}
          >
            <Box id="pill-uptime" sx={{ minWidth: "fit-content" }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "0.68rem",
                  whiteSpace: "nowrap",
                }}
              >
                SYSTEM UPTIME
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#1e293b",
                  fontFamily: "monospace",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {formatUptime(serverUptime)}
              </Typography>
            </Box>

            <Box
              id="pill-divider"
              sx={{
                width: "1px",
                minWidth: "1px",
                height: 24,
                bgcolor: "#cbd5e1",
              }}
            />

            <Box id="pill-clock" sx={{ minWidth: "fit-content" }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "0.68rem",
                  whiteSpace: "nowrap",
                }}
              >
                UTC WALL CLOCK
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#3b82f6",
                  fontFamily: "monospace",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {currentTime || "--:--:--"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(DashboardHeader);



import React from "react";
import { Card, CardContent, Typography, Box, LinearProgress } from "@mui/material";

interface MetricCardProps {
  title: string;
  value: string | number;
  percent: number; // 0 - 100 for progress indicator
  unit?: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string; // e.g., '#3b82f6'
  status: "healthy" | "warning" | "critical";
  secondaryValue?: string;
  sparklineData?: number[]; // optional mini indicator
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  percent,
  unit = "",
  subtitle,
  icon,
  color,
  status,
  secondaryValue,
  sparklineData,
}) => {
  const getCardStatusStyles = () => {
    switch (status) {
      case "critical":
        return {
          border: "1px solid #ef4444",
          boxShadow: "none",
          glowingDot: "#ef4444",
          backgroundColor: "#fffafb",
          progressColor: "error",
        };
      case "warning":
        return {
          border: "1px solid #f59e0b",
          boxShadow: "none",
          glowingDot: "#f59e0b",
          backgroundColor: "#fffdf5",
          progressColor: "warning",
        };
      case "healthy":
      default:
        return {
          border: "1px solid #e2e8f0",
          boxShadow: "none",
          glowingDot: "#10b981",
          backgroundColor: "#ffffff",
          progressColor: "success",
        };
    }
  };

  const statusStyle = getCardStatusStyles();

  return (
    <Card
      id={`metric-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
      sx={{
        background: statusStyle.backgroundColor,
        borderRadius: "12px",
        border: statusStyle.border,
        boxShadow: "none",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.25s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          background: statusStyle.backgroundColor,
        },
      }}
    >
      <CardContent sx={{ padding: "20px !important" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
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
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: `${color}12`,
                border: `1px solid ${color}1a`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: color,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700, fontSize: "0.82rem" }}>
                {title}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 500 }}>
                {subtitle}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 1,
            }}
          >
            <span className="relative flex h-2 w-2">
              {status !== "healthy" && (
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: statusStyle.glowingDot }}
                />
              )}
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: statusStyle.glowingDot }}
              />
            </span>
            <Typography
              variant="caption"
              sx={{
                color: status === "healthy" ? "#10b981" : status === "warning" ? "#d97706" : "#dc2626",
                fontWeight: 700,
                fontSize: "0.68rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {status}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2, mt: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "baseline",
              gap: 0.5,
              position: "relative",
            }}
          >
            <Typography variant="h4" sx={{ color: "#1e293b", fontWeight: 800, fontSize: "2.1rem", tracking: "-0.03em" }}>
              {value}
            </Typography>
            {unit && (
              <Typography variant="body1" sx={{ color: "#475569", fontWeight: 600, fontSize: "1.1rem" }}>
                {unit}
              </Typography>
            )}
            {secondaryValue && (
              <Typography
                variant="caption"
                sx={{
                  color: "#94a3b8",
                  fontWeight: 500,
                  marginLeft: "auto",
                  alignSelf: "flex-end",
                }}
              >
                {secondaryValue}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              mb: 0.6,
            }}
          >
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
              UTILIZATION
            </Typography>
            <Typography variant="caption" sx={{ color: color, fontWeight: 700, fontFamily: "monospace" }}>
              {typeof percent === "number" && !isNaN(percent) ? `${percent.toFixed(1)}%` : "--%"}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={typeof percent === "number" && !isNaN(percent) ? percent : 0}
            sx={{
              height: 6,
              borderRadius: "3px",
              bgcolor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              "& .MuiLinearProgress-bar": {
                borderRadius: "3px",
                background: color,
              },
            }}
          />
        </Box>

        {sparklineData && sparklineData.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              height: 24,
              mt: 2,
              gap: "2px",
              opacity: 0.55,
            }}
          >
            {sparklineData.map((val, mapIdx) => {
              const maxVal = Math.max(...sparklineData);
              const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
              return (
                <Box
                  key={mapIdx}
                  sx={{
                    flex: 1,
                    height: `${Math.max(10, heightPct)}%`,
                    bgcolor: color,
                    borderRadius: "1px",
                    transition: "height 0.3s ease",
                  }}
                />
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(MetricCard);

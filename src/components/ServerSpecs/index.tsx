/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";
import MemoryIcon from "@mui/icons-material/Memory";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FolderIcon from "@mui/icons-material/Folder";
import { SystemInfo } from "../../types";

interface ServerSpecsProps {
  systemInfo: SystemInfo | null;
  folderMetrics?: {
    totalSizeMb: number;
    fileCount: number;
    dirCount: number;
    nodeModulesSizeMb: number;
    srcFolderSizeMb: number;
    staticFilesCount: number;
  } | null;
}

const ServerSpecs: React.FC<ServerSpecsProps> = ({ systemInfo, folderMetrics }) => {
  if (!systemInfo) return null;

  const formatDate = (epochMs: number) => {
    return new Date(epochMs).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const specsList = [
    {
      icon: <ComputerIcon sx={{ color: "#3b82f6", fontSize: 20 }} />,
      label: "Operating System",
      value: `${systemInfo.osType} (${systemInfo.architecture})`,
      sub: `Release: ${systemInfo.osRelease}`,
    },
    {
      icon: <MemoryIcon sx={{ color: "#10b981", fontSize: 20 }} />,
      label: "Processor Specs",
      value: systemInfo.cpuModel.replace(/\s+/g, " "),
      sub: `${systemInfo.totalCores} Unified Core Processors`,
    },
    {
      icon: <SettingsApplicationsIcon sx={{ color: "#a855f7", fontSize: 20 }} />,
      label: "Runtime Profile",
      value: `Node.js ${systemInfo.nodeVersion}`,
      sub: "V8 Sandbox Engine Active",
    },
    {
      icon: <CalendarTodayIcon sx={{ color: "#f59e0b", fontSize: 20 }} />,
      label: "Boot Epoch",
      value: formatDate(systemInfo.bootTime),
      sub: "Telemetry cycle initialization",
    },
    {
      icon: <FolderIcon sx={{ color: "#ec4899", fontSize: 20 }} />,
      label: "Workspace Folder",
      value: (folderMetrics && typeof folderMetrics.totalSizeMb === "number") ? `${folderMetrics.totalSizeMb.toFixed(2)} MB` : "Analyzing...",
      sub: (folderMetrics && typeof folderMetrics.fileCount === "number" && typeof folderMetrics.srcFolderSizeMb === "number") 
        ? `${folderMetrics.fileCount} files (${folderMetrics.srcFolderSizeMb.toFixed(2)}MB src)` 
        : "Scanning workspace directory...",
    },
  ];

  return (
    <Box
      id="server-stats-grid"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "repeat(5, 1fr)" },
        gap: 2,
      }}
    >
      {specsList.map((spec, idx) => (
        <Card
          key={idx}
          id={`spec-card-${idx}`}
          sx={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "none",
            borderRadius: "10px",
          }}
        >
          <CardContent sx={{ padding: "14px 18px !important" }}>
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
                  width: 36,
                  height: 36,
                  borderRadius: "8px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {spec.icon}
              </Box>
              <Box sx={{ width: "calc(100% - 50px)" }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#64748b",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {spec.label}
                </Typography>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    color: "#1e293b",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    mt: 0.1,
                  }}
                >
                  {spec.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#94a3b8",
                    fontSize: "0.70rem",
                    fontWeight: 500,
                    display: "block",
                    mt: 0.2,
                  }}
                >
                  {spec.sub}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default React.memo(ServerSpecs);

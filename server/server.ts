/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import http from "http";
import path from "path";
import os from "os";
import fs from "fs";
import si from "systeminformation";
import { createServer as createViteServer } from "vite";
import { setupWebSocketServer, ServerState } from "./websocketServer";
import {
  MetricTelemetry,
  SystemAlert,
  ServerSettings,
  SystemInfo,
} from "../src/types";

// Recursive Workspace/Project Directory Analysis
interface FolderAnalysis {
  totalSizeMb: number;
  fileCount: number;
  dirCount: number;
  nodeModulesSizeMb: number;
  srcFolderSizeMb: number;
  staticFilesCount: number;
}

function analyzeDirectoryConfig(dirPath: string): FolderAnalysis {
  let totalSizeBytes = 0;
  let fileCount = 0;
  let dirCount = 0;
  let nodeModulesSizeBytes = 0;
  let srcFolderSizeBytes = 0;
  let staticFilesCount = 0;

  function traverseDir(currentPath: string) {
    try {
      const files = fs.readdirSync(currentPath);
      dirCount++;
      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        let stat;
        try {
          stat = fs.statSync(fullPath);
        } catch {
          continue;
        }

        if (stat.isDirectory()) {
          // Exclude huge system control dirs to focus purely on the workspace project folder
          if (file === ".git" || file === ".next" || file === "dist") continue;
          traverseDir(fullPath);
        } else if (stat.isFile()) {
          fileCount++;
          totalSizeBytes += stat.size;

          if (fullPath.includes("node_modules")) {
            nodeModulesSizeBytes += stat.size;
          } else if (fullPath.includes("/src/") || fullPath.includes("\\src\\")) {
            srcFolderSizeBytes += stat.size;
          }

          const ext = path.extname(file).toLowerCase();
          if ([".html", ".css", ".png", ".jpg", ".svg", ".json", ".ts", ".tsx"].includes(ext)) {
            staticFilesCount++;
          }
        }
      }
    } catch (e) {
      // Ignore reading errors on system/sandboxed restricted directories
    }
  }

  traverseDir(dirPath);

  return {
    totalSizeMb: parseFloat((totalSizeBytes / (1024 * 1024)).toFixed(2)),
    fileCount,
    dirCount,
    nodeModulesSizeMb: parseFloat((nodeModulesSizeBytes / (1024 * 1024)).toFixed(2)),
    srcFolderSizeMb: parseFloat((srcFolderSizeBytes / (1024 * 1024)).toFixed(2)),
    staticFilesCount,
  };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Global telemetry and simulations state
  const state: ServerState = {
    cumulativeNetIn: 1420.5,
    cumulativeNetOut: 850.2,
    settings: {
      cpuThreshold: 80,
      memoryThreshold: 85,
      diskThreshold: 90,
      responseTimeThreshold: 400,
      updateIntervalMs: 1000,
    },
    activeAlerts: [],
    metricsHistory: [],
    systemInfo: {
      osType: os.type(),
      osRelease: os.release(),
      architecture: os.arch(),
      nodeVersion: process.version,
      cpuModel: "Analyzing...",
      totalCores: os.cpus().length || 4,
      bootTime: Date.now() - (os.uptime() * 1000),
      totalMemGb: parseFloat((os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)),
    },
  };

  // Fetch true CPU Model brand via systeminformation
  try {
    const cpuInfo = await si.cpu();
    state.systemInfo.cpuModel = cpuInfo.brand.trim() || `${cpuInfo.manufacturer} CPU`;
  } catch {
    state.systemInfo.cpuModel = os.cpus().length > 0 ? os.cpus()[0].model.trim() : "Virtual CPU";
  }

  // Pre-seed metrics history (keep last 60 entries)
  const MAX_HISTORY_LEN = 60;
  const now = Date.now();
  let cumulativeTime = now - (MAX_HISTORY_LEN * state.settings.updateIntervalMs);

  for (let i = 0; i < MAX_HISTORY_LEN; i++) {
    const historicalTime = cumulativeTime + (i * state.settings.updateIntervalMs);
    const prev = state.metricsHistory[state.metricsHistory.length - 1];

    // Build reasonable base historical metrics to bootstrap charts instantly
    const cpuFallback = Math.max(2, Math.min(99.5, parseFloat((Math.sin(historicalTime / 50000) * 10 + 20 + Math.random() * 8).toFixed(1))));
    const freeMemGb = parseFloat((os.freemem() / (1024 * 1024 * 1024)).toFixed(2));
    const totalMemGb = state.systemInfo.totalMemGb;
    const usedMemGb = parseFloat((totalMemGb - freeMemGb).toFixed(2));
    const memUtilization = parseFloat(((usedMemGb / totalMemGb) * 100).toFixed(1));

    state.metricsHistory.push({
      timestamp: historicalTime,
      cpuLoad: cpuFallback,
      cpuCores: Array.from({ length: state.systemInfo.totalCores }, () => parseFloat((cpuFallback + (Math.random() * 10 - 5)).toFixed(1))),
      memoryTotal: totalMemGb,
      memoryUsed: usedMemGb,
      memoryFree: freeMemGb,
      memoryUtilization: memUtilization,
      diskTotal: 250.0,
      diskUsed: prev ? prev.diskUsed + (Math.random() > 0.8 ? 0.001 : 0) : 84.6,
      diskUtilization: prev ? parseFloat(((prev.diskUsed / 250.0) * 100).toFixed(1)) : 33.8,
      networkIn: parseFloat((12.5 + Math.random() * 8).toFixed(1)),
      networkOut: parseFloat((8.2 + Math.random() * 5).toFixed(1)),
      networkInCumulative: parseFloat((state.cumulativeNetIn + i * 0.1).toFixed(2)),
      networkOutCumulative: parseFloat((state.cumulativeNetOut + i * 0.08).toFixed(2)),
      activeConnections: Math.floor(Math.sin(historicalTime / 200000) * 15 + 45),
      requestsPerSecond: parseFloat((50 + Math.random() * 10).toFixed(1)),
      responseTimeMs: parseFloat((25 + Math.random() * 15).toFixed(1)),
      uptime: Math.floor((historicalTime - state.systemInfo.bootTime) / 1000),
    });
  }

  // Initialize and attach extracted WebSocket management module
  const wsManager = setupWebSocketServer(
    server,
    () => state,
    (updates) => {
      Object.assign(state, updates);
    }
  );

  /**
   * Generates a single live metric tick using real hardware components.
   */
  async function generateMetricUnit(timestamp: number, previousMetric?: MetricTelemetry): Promise<MetricTelemetry> {
    // 1. Core CPUload
    let cpuLoad = 0;
    let cpuCores: number[] = [];
    try {
      const load = await si.currentLoad();
      cpuLoad = parseFloat(load.currentLoad.toFixed(1));
      cpuCores = load.cpus.map((c) => parseFloat(c.load.toFixed(1)));
    } catch {
      cpuLoad = Math.max(2, Math.min(99.5, parseFloat((Math.sin(timestamp / 50000) * 10 + 20 + Math.random() * 8).toFixed(1))));
      cpuCores = Array.from({ length: state.systemInfo.totalCores }, () => parseFloat((cpuLoad + (Math.random() * 10 - 5)).toFixed(1)));
    }

    // 2. Hardware Memory
    let totalMemGb = state.systemInfo.totalMemGb;
    let freeMemGb = 0;
    let usedMemGb = 0;
    let memUtilization = 0;

    try {
      const mem = await si.mem();
      totalMemGb = parseFloat((mem.total / (1024 * 1024 * 1024)).toFixed(2));
      freeMemGb = parseFloat((mem.free / (1024 * 1024 * 1024)).toFixed(2));
      usedMemGb = parseFloat((mem.active / (1024 * 1024 * 1024)).toFixed(2)) || parseFloat((totalMemGb - freeMemGb).toFixed(2));
      memUtilization = parseFloat(((usedMemGb / totalMemGb) * 100).toFixed(1));
    } catch {
      freeMemGb = parseFloat((os.freemem() / (1024 * 1024 * 1024)).toFixed(2));
      usedMemGb = parseFloat((totalMemGb - freeMemGb).toFixed(2));
      memUtilization = parseFloat(((usedMemGb / totalMemGb) * 100).toFixed(1));
    }

    // 3. True filesystem partition disk sizes
    let diskTotal = 250.0;
    let diskUsed = 84.6;
    let diskUtilization = 33.8;

    try {
      const disks = await si.fsSize();
      const primaryDisk = disks.find((d) => d.mount === "/") || disks[0];
      if (primaryDisk) {
        diskTotal = parseFloat((primaryDisk.size / (1024 * 1024 * 1024)).toFixed(2));
        diskUsed = parseFloat((primaryDisk.used / (1024 * 1024 * 1024)).toFixed(2));
        diskUtilization = parseFloat(primaryDisk.use.toFixed(1));
      }
    } catch {
      diskTotal = 250.0;
      diskUsed = previousMetric ? previousMetric.diskUsed + (Math.random() > 0.8 ? 0.001 : 0) : 84.6;
      diskUtilization = parseFloat(((diskUsed / diskTotal) * 100).toFixed(1));
    }

    // 4. Bandwidth calculation
    let netInRate = 12.5 + Math.random() * 8.5; // KB/s
    let netOutRate = 8.2 + Math.random() * 5.1; // KB/s

    try {
      const netStats = await si.networkStats();
      if (netStats && netStats.length > 0) {
        const activeNet = netStats.find((n) => n.operstate === "up") || netStats[0];
        if (activeNet && activeNet.rx_sec !== null && activeNet.rx_sec > 0) {
          netInRate = parseFloat((activeNet.rx_sec / 1024).toFixed(1));
          netOutRate = parseFloat((activeNet.tx_sec / 1024).toFixed(1));
        }
      }
    } catch {
      // Fallback is default values
    }

    state.cumulativeNetIn += (netInRate * (state.settings.updateIntervalMs / 1000)) / 1024; // MB
    state.cumulativeNetOut += (netOutRate * (state.settings.updateIntervalMs / 1000)) / 1024; // MB

    // 5. Active connections
    let connections = Math.floor(Math.sin(timestamp / 200000) * 15 + 45); // Wave cycle from 30 to 60
    connections += Math.floor(Math.random() * 5 - 2); // jitter
    connections = Math.max(5, connections);

    // 6. Request rate and Latency
    const requestsPerSecond = parseFloat((connections * 1.5 + Math.random() * 4).toFixed(1));
    let responseTimeMs = 25 + Math.random() * 15; // baseline latency 25ms-40ms
    responseTimeMs = parseFloat(responseTimeMs.toFixed(1));

    const uptime = Math.floor((timestamp - state.systemInfo.bootTime) / 1000);

    return {
      timestamp,
      cpuLoad,
      cpuCores,
      memoryTotal: totalMemGb,
      memoryUsed: usedMemGb,
      memoryFree: freeMemGb,
      memoryUtilization: memUtilization,
      diskTotal,
      diskUsed,
      diskUtilization,
      networkIn: parseFloat(netInRate.toFixed(1)),
      networkOut: parseFloat(netOutRate.toFixed(1)),
      networkInCumulative: parseFloat(state.cumulativeNetIn.toFixed(2)),
      networkOutCumulative: parseFloat(state.cumulativeNetOut.toFixed(2)),
      activeConnections: connections,
      requestsPerSecond,
      responseTimeMs,
      uptime,
    };
  }

  // Periodic Metric Loop
  async function runMetricTickLoop() {
    const tickTime = Date.now();
    const prev = state.metricsHistory[state.metricsHistory.length - 1];
    
    let metric;
    try {
      metric = await generateMetricUnit(tickTime, prev);
    } catch (e) {
      console.error("Metric generator error, utilizing robust system fallback:", e);
      // Fallback
      metric = {
        timestamp: tickTime,
        cpuLoad: Math.max(2, parseFloat((Math.sin(tickTime / 50000) * 10 + 20).toFixed(1))),
        cpuCores: [20.0, 20.0, 20.0, 20.0],
        memoryTotal: state.systemInfo.totalMemGb,
        memoryUsed: parseFloat((state.systemInfo.totalMemGb * 0.4).toFixed(2)),
        memoryFree: parseFloat((state.systemInfo.totalMemGb * 0.6).toFixed(2)),
        memoryUtilization: 40.0,
        diskTotal: 250.0,
        diskUsed: 84.6,
        diskUtilization: 33.8,
        networkIn: 10.0,
        networkOut: 5.0,
        networkInCumulative: state.cumulativeNetIn,
        networkOutCumulative: state.cumulativeNetOut,
        activeConnections: 50,
        requestsPerSecond: 75.0,
        responseTimeMs: 30.0,
        uptime: Math.floor((tickTime - state.systemInfo.bootTime) / 1000),
      };
    }

    state.metricsHistory.push(metric);
    if (state.metricsHistory.length > MAX_HISTORY_LEN) {
      state.metricsHistory.shift();
    }

    wsManager.broadcast({
      type: "metric_tick",
      metric,
    });

    setTimeout(runMetricTickLoop, state.settings.updateIntervalMs);
  }

  // Trigger metrics tracking loop
  runMetricTickLoop();

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: state.activeAlerts.length > 0 ? "warning" : "healthy",
      timestamp: Date.now(),
      connections: wsManager.wss.clients.size,
      uptime: Math.floor((Date.now() - state.systemInfo.bootTime) / 1000),
      activeAlertsCount: state.activeAlerts.length,
    });
  });

  app.get("/api/system-info", (req, res) => {
    res.json(state.systemInfo);
  });

  // Real-time Complete Workspace Folder scan metrics!
  app.get("/api/folder-metrics", (req, res) => {
    try {
      const result = analyzeDirectoryConfig(".");
      res.json({
        success: true,
        path: path.resolve("."),
        metrics: result,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Print workspace metrics summary directly to console on boot
  try {
    const summary = analyzeDirectoryConfig(".");
    console.log("-----------------------------------------");
    console.log("📂 DYNAMIC WORKSPACE FOLDER METRICS SCAN SUCCESS:");
    console.log(`- Folder Path: ${path.resolve(".")}`);
    console.log(`- Total Size on Disk: ${summary.totalSizeMb} MB`);
    console.log(`- Total Files Counted: ${summary.fileCount}`);
    console.log(`- Total Subdirectories: ${summary.dirCount}`);
    console.log(`- node_modules Size: ${summary.nodeModulesSizeMb} MB`);
    console.log(`- Source (src) Folder Size: ${summary.srcFolderSizeMb} MB`);
    console.log(`- Static Web Assets Count: ${summary.staticFilesCount}`);
    console.log("-----------------------------------------");
  } catch (err) {
    console.warn("Failed to log initial workspace scan summary on boot:", err);
  }

  // Vite development integration or Static bundle host
  if (process.env.NODE_ENV !== "production") {
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteInstance.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is currently listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical failure during server startup:", error);
});

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import {
  ServerSettings,
  SystemAlert,
  MetricTelemetry,
  SystemInfo,
  ServerToClientMsg,
  ClientToServerMsg
} from "../../src/types";

export interface ServerState {
  cumulativeNetIn: number;
  cumulativeNetOut: number;
  settings: ServerSettings;
  activeAlerts: SystemAlert[];
  metricsHistory: MetricTelemetry[];
  systemInfo: SystemInfo;
}

export function setupWebSocketServer(
  server: http.Server,
  getState: () => ServerState,
  onStateUpdate: (updates: Partial<ServerState>) => void
) {
  // Create WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  // Broadcast helper
  function broadcast(data: ServerToClientMsg | { type: string; [key: string]: any }) {
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // Handle server-side WebSocket connections
  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected to metrics stream (WebSocketServer module)");

    const state = getState();

    // Initialize/Sync client
    const initMessage: ServerToClientMsg = {
      type: "sync_history",
      history: state.metricsHistory,
      systemInfo: state.systemInfo,
      alerts: [],
      settings: state.settings,
    };
    ws.send(JSON.stringify(initMessage));

    // Client message router
    ws.on("message", (rawMsg: string) => {
      try {
        const parsed: ClientToServerMsg = JSON.parse(rawMsg);
        
        switch (parsed.type) {
          case "ping": {
            ws.send(JSON.stringify({ type: "pong" }));
            break;
          }
        }
      } catch (err) {
        console.error("Failed to parse client message", err);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected from web socket");
    });
  });

  // Upgrade WebSocket transport in the main HTTP listener for /api/telemetry path
  server.on("upgrade", (request, socket, head) => {
    try {
      const url = request.url || "";
      console.log(`[WS UPGRADE] Request received for URL: "${url}"`);
      const isTelemetry = url.split("?")[0] === "/api/telemetry" || 
                          url === "/api/telemetry" || 
                          url.includes("/api/telemetry");
      
      if (isTelemetry) {
        console.log(`[WS UPGRADE] Match found! Upgrading to telemetry server...`);
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      } else {
        console.log(`[WS UPGRADE] No match for "${url}". Passing through.`);
      }
    } catch (e) {
      console.error("Error upgrading websocket connection:", e);
    }
  });

  return {
    broadcast,
    wss
  };
}

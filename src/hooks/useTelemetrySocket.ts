import { useState, useEffect, useRef, useCallback } from "react";
import {
  MetricTelemetry,
  SystemInfo,
  ClientToServerMsg,
  ServerToClientMsg,
} from "../types";

export const useTelemetrySocket = () => {
  const [connected, setConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [metricsHistory, setMetricsHistory] = useState<MetricTelemetry[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [serverUptime, setServerUptime] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingStartRef = useRef(0);

  const connectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol =
      window.location.protocol === "https:" ? "wss:" : "ws:";

    const socket = new WebSocket(
      `${protocol}//${window.location.host}/api/telemetry`,
    );

    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);

      pingIntervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          pingStartRef.current = Date.now();

          const pingMsg: ClientToServerMsg = {
            type: "ping",
          };

          socket.send(JSON.stringify(pingMsg));
        }
      }, 3000);
    };

    socket.onmessage = (event) => {
      try {
        const message: ServerToClientMsg = JSON.parse(event.data);

        switch (message.type) {
          case "pong":
            setLatencyMs(Date.now() - pingStartRef.current);
            break;

          case "sync_history":
            setMetricsHistory(message.history);
            setSystemInfo(message.systemInfo);

            if (message.history.length) {
              setServerUptime(
                message.history[message.history.length - 1].uptime,
              );
            }
            break;

          case "metric_tick":
            setMetricsHistory((prev) => {
              const updated = [...prev, message.metric];
              return updated.slice(-60);
            });

            setServerUptime(message.metric.uptime);
            break;
        }
      } catch (error) {
        console.error(error);
      }
    };

    socket.onclose = () => {
      setConnected(false);

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      socketRef.current?.close();

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  return {
    connected,
    latencyMs,
    metricsHistory,
    systemInfo,
    serverUptime,
  };
};
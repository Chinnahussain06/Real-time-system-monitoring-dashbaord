

export interface MetricTelemetry {
  timestamp: number; // Unix timestamp
  cpuLoad: number; // Overall percentage usage
  cpuCores: number[]; // Load levels of individual cores (e.g. 4 cores)
  memoryTotal: number; // Total RAM in GB
  memoryUsed: number; // Used RAM in GB
  memoryFree: number; // Free RAM in GB
  memoryUtilization: number; // Memory usage percentage
  diskTotal: number; // Total storage in GB
  diskUsed: number; // Used storage in GB
  diskUtilization: number; // Disk usage percentage
  networkIn: number; // KB/s incoming traffic
  networkOut: number; // KB/s outgoing traffic
  networkInCumulative: number; // MB cumulative incoming
  networkOutCumulative: number; // MB cumulative outgoing
  activeConnections: number; // Number of concurrent users/connections
  requestsPerSecond: number; // Current web request rate
  responseTimeMs: number; // Average endpoint latency
  uptime: number; // Server uptime in seconds
}

export interface SystemAlert {
  id: string;
  metric: "cpu" | "memory" | "disk" | "network" | "responseTime";
  value: number;
  threshold: number;
  level: "warning" | "critical";
  message: string;
  timestamp: number; // Unix timestamp
}

export interface ServerSettings {
  cpuThreshold: number; // default e.g. 80%
  memoryThreshold: number; // default e.g. 85%
  diskThreshold: number; // default e.g. 90%
  responseTimeThreshold: number; // default e.g. 500ms
  updateIntervalMs: number; // default 1000ms
}

export interface SystemInfo {
  osType: string;
  osRelease: string;
  architecture: string;
  nodeVersion: string;
  cpuModel: string;
  totalCores: number;
  bootTime: number; // Uptime baseline timestamp
  totalMemGb: number;
}

export type ServerToClientMsg =
  | { type: "sync_history"; history: MetricTelemetry[]; systemInfo: SystemInfo; alerts: SystemAlert[]; settings: ServerSettings }
  | { type: "metric_tick"; metric: MetricTelemetry }
  | { type: "alert_triggered"; alert: SystemAlert }
  | { type: "alert_resolved"; alertId: string }
  | { type: "load_test_ack"; loadType: "cpu" | "memory" | "network" | "reset"; isActive: boolean }
  | { type: "settings_updated"; settings: ServerSettings }
  | { type: "pong" };

export type ClientToServerMsg =
  | { type: "trigger_load_test"; loadType: "cpu" | "memory" | "network" | "reset" }
  | { type: "update_settings"; settings: Partial<ServerSettings> }
  | { type: "ack_alert"; alertId: string }
  | { type: "clear_all_alerts" }
  | { type: "ping" };

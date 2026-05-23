

import { lazy, Suspense } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const SystemMonitoring = lazy(() => import("./pages/SystemMonitoring"));

export default function App() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "#f8fafc",
            gap: 2,
          }}
        >
          <CircularProgress size={40} sx={{ color: "#3b82f6" }} />
          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600, fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' }}>
            Starting System Monitoring console...
          </Typography>
        </Box>
      }
    >
      <SystemMonitoring />
    </Suspense>
  );
}


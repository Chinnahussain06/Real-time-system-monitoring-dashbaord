import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

const cleanMinimalTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3b82f6", // Clean blue
    },
    secondary: {
      main: "#10b981", // Success green
    },
    error: {
      main: "#ef4444", // Soft red
    },
    warning: {
      main: "#f59e0b", // Warm amber
    },
    background: {
      default: "#f8fafc", // Clean minimalist off-white background
      paper: "#ffffff", // Pure white card
    },
    text: {
      primary: "#1e293b", // Deep ink slate
      secondary: "#64748b", // Subtle gray-blue text
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "system-ui", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "none",
          borderRadius: "12px",
        },
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={cleanMinimalTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);

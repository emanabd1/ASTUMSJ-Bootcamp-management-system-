import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ChatbotWidget from "./components/ChatbotWidget";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ChatbotWidget />
      </AuthProvider>
    </BrowserRouter>
  );
}
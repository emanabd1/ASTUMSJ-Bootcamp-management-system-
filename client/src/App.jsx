import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import ChatbotWidget from "./components/ChatbotWidget";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <PreferencesProvider>
        <AuthProvider>
          <AppRoutes />
          <ChatbotWidget />
        </AuthProvider>
      </PreferencesProvider>
    </BrowserRouter>
  );
}
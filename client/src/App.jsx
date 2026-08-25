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
          <div id="google_translate_element" className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true" />
          <AppRoutes />
          <ChatbotWidget />
        </AuthProvider>
      </PreferencesProvider>
    </BrowserRouter>
  );
}
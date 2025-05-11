import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Registramos el service worker para funcionalidades PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registrado: ', registration);
    }).catch(registrationError => {
      console.log('Error al registrar SW: ', registrationError);
    });
  });
}

// Renderizado de la aplicación con el proveedor de QueryClient y Theme
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class">
      <App />
    </ThemeProvider>
  </QueryClientProvider>
);

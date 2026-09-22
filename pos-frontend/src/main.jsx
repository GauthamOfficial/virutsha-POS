import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { SnackbarProvider } from "notistack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import store from "./redux/store.js";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A till is often on flaky Wi-Fi; retry once rather than failing outright.
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider
          autoHideDuration={3000}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <App />
        </SnackbarProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { Home, Auth, NewOrder, Bills, Reports, Admin } from "./pages";
import Header from "./components/shared/Header";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader";

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuth, role } = useSelector((state) => state.user);

  if (!isAuth) return <Navigate to="/auth" replace />;
  if (adminOnly && role !== "Admin") return <Navigate to="/" replace />;

  return children;
}

function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();
  const { isAuth } = useSelector((state) => state.user);

  if (isLoading) return <FullScreenLoader />;

  const hideHeader = location.pathname === "/auth";

  return (
    <div className="min-h-screen bg-[#1f1f1f]">
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/auth" element={isAuth ? <Navigate to="/" replace /> : <Auth />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-order"
          element={
            <ProtectedRoute>
              <NewOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills"
          element={
            <ProtectedRoute>
              <Bills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute adminOnly>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

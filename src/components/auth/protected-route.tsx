import { Navigate, Outlet } from "react-router-dom";
import {
  useRegisterLoadingState,
  LoadingPriority,
} from "@/context/app-loading-context";
import { useAuth } from "@/context/auth-context";

const ProtectedRoute = () => {
  const { session, isAuthLoading } = useAuth();

  // Register auth loading as HIGH priority - we can't do anything until auth is checked
  useRegisterLoadingState("authentication", isAuthLoading, LoadingPriority.HIGH);

  if (isAuthLoading) {
    // Global loading screen will handle UI
    return <></>;
  }

  return session ? <Outlet /> : <Navigate to="/auth" />;
};

export default ProtectedRoute;

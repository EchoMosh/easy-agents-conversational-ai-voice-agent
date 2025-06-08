import { Navigate, Outlet } from "react-router-dom";
import { useRegisterLoadingState, LoadingPriority } from "@/context/app-loading-context";
import { useAuth } from "@/context/auth-context";

const ProtectedRoute = () => {
  const { session, isAuthLoading } = useAuth();

  useRegisterLoadingState("authentication", isAuthLoading, LoadingPriority.HIGH);

  if (isAuthLoading) {
    return <></>;
  }

  return session ? <Outlet /> : <Navigate to="/auth" />;
};

export default ProtectedRoute;

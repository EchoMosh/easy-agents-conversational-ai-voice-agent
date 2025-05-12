import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  useRegisterLoadingState,
  LoadingPriority,
} from "@/context/app-loading-context";
import LoadingScreen from "@/components/loading-screen";

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Register auth loading as HIGH priority - we can't do anything until auth is checked
  useRegisterLoadingState(
    "authentication",
    isCheckingAuth,
    LoadingPriority.HIGH
  );

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth session error:", error);
          if (mounted) {
            setIsAuthenticated(false);
            setIsCheckingAuth(false);
          }
          return;
        }

        if (mounted) {
          setIsAuthenticated(!!session);
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
        }
      }
    };

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change in protected route:", event);

      if (mounted) {
        setIsAuthenticated(!!session);

        if (event === "SIGNED_OUT") {
          navigate("/auth");
        }
      }
    });

    // Initial auth check
    checkAuth();

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // We don't need to manually render a loading screen anymore since the app-level
  // loading screen will show automatically while isCheckingAuth is true
  if (isCheckingAuth) {
    // Return empty fragment - the global loading state will handle rendering a loading screen
    return <></>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" />;
};

export default ProtectedRoute;


import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "../ui/loading-spinner";

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change in protected route:", event);
        
        if (mounted) {
          setIsAuthenticated(!!session);
          
          if (event === 'SIGNED_OUT') {
            navigate('/auth');
          }
        }
      }
    );

    // Initial auth check
    checkAuth();

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <LoadingSpinner />
          <p className="ml-2 text-muted-foreground mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" />;
};

export default ProtectedRoute;

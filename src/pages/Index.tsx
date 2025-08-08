
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import HomePage from "./HomePage";
import LoadingScreen from "@/components/loading-screen";

const Index = () => {
  const navigate = useNavigate();
  const { session, isAuthLoading } = useAuth();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (isAuthLoading) return; // Wait for auth to load
      
      console.log("Index: Checking user authentication...", { session: !!session, isAuthLoading });
      
      if (session) {
        try {
          // Check if user has completed onboarding
          console.log("Index: User is authenticated, checking profile...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error("Profile fetch error:", profileError);
            // If there's an error fetching profile, still try to navigate to dashboard
            // The dashboard will handle missing profiles
            console.log("Index: Profile error, navigating to dashboard anyway");
            navigate("/dashboard/agents");
            return;
          }
          
          console.log("Index: Profile check complete", profile);
            
          if (profile?.onboarding_completed) {
            console.log("Index: Navigating to dashboard");
            navigate("/dashboard/agents");
          } else {
            console.log("Index: Navigating to onboarding");
            navigate("/onboarding");
          }
        } catch (err) {
          console.error("Error checking profile:", err);
          // On error, still navigate to dashboard
          navigate("/dashboard/agents");
        }
      } else {
        console.log("Index: No session, showing HomePage");
        // User is not authenticated, show HomePage
      }
    };
    
    checkUserAndRedirect();
  }, [session, isAuthLoading, navigate]);

  // Show loading screen while auth is loading
  if (isAuthLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  // If we have a session, the useEffect will handle navigation
  // If no session, show HomePage
  if (!session) {
    return <HomePage />;
  }

  // While navigating after auth check, show loading screen
  return <LoadingScreen message="Redirecting..." />;
};

export default Index;

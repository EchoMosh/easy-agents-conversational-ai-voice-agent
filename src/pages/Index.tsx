
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Index: Checking user authentication...");
        setIsLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        console.log("Index: Session check complete", session ? "User is logged in" : "No session found");
        
        if (session) {
          // Check if user has completed onboarding
          console.log("Index: Checking user profile...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error("Profile fetch error:", profileError);
            throw profileError;
          }
          
          console.log("Index: Profile check complete", profile);
            
          if (profile?.onboarding_completed) {
            console.log("Index: Navigating to dashboard");
            navigate("/dashboard/agents");
          } else {
            console.log("Index: Navigating to onboarding");
            navigate("/onboarding");
          }
        } else {
          console.log("Index: No session, navigating to auth");
          navigate("/auth");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Still navigate to auth on error to prevent getting stuck
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [navigate]);

  // If there's an error, display it
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="p-8 rounded-lg border border-red-200 bg-red-50 text-red-800 max-w-md">
          <h2 className="text-xl font-bold mb-4">Authentication Error</h2>
          <p className="mb-4">{error.message}</p>
          <div className="mt-4">
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      {isLoading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      )}
    </div>
  );
};

export default Index;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HomePage from "./HomePage"; // Import the new HomePage component

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Index: Checking user authentication...");
        setIsLoading(true);
        
        // First set up auth listener to catch auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log("Auth state change event:", event);
            
            // If we get a SIGNED_OUT event, redirect to auth
            if (event === 'SIGNED_OUT') {
              console.log("User signed out, redirecting to auth page");
              navigate("/auth");
            }
          }
        );

        // Then check the current session
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
          console.log("Index: No session, showing HomePage");
          // Instead of navigating to /auth, we will allow rendering HomePage
          // We set isLoading to false here so the HomePage can be rendered.
          setIsLoading(false); 
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Auth check error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // If there's an error, we might still want to show HomePage or a generic error on HomePage itself.
        // For now, let's keep the error display logic, but ensure isLoading is false.
        setIsLoading(false);
      }
      // Removed finally block as setIsLoading(false) is handled in try/catch/else
    };
    
    checkUser();
  }, [navigate]);

  // If there's an error, display it (this could be enhanced to be part of HomePage or a global error boundary)
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="p-8 rounded-lg border border-red-200 bg-red-50 text-red-800 max-w-md">
          <h2 className="text-xl font-bold mb-4">Authentication Error</h2>
          <p className="mb-4">{error.message}</p>
          <p className="mb-4">You can still view the <a href="/" className="underline">Homepage</a> or try to <a href="/auth" className="underline">Login</a> again.</p>
          {/* Optionally, render HomePage even on some errors, or a specific error view within HomePage layout */}
        </div>
      </div>
    );
  }

  // If still loading, show spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not loading and no error, and no session (implicitly, due to logic above), render HomePage
  // The logic for navigating to dashboard/onboarding if a session exists remains,
  // so this return is effectively for the "no session" case.
  return <HomePage />;
};

export default Index;

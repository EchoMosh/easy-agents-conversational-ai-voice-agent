
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          navigate("/dashboard/agents");
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/auth");
      }
    };
    
    checkUser();
  }, [navigate]);

  // Instead of returning null, let's return a loading indicator
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking authentication...</p>
      </div>
    </div>
  );
};

export default Index;

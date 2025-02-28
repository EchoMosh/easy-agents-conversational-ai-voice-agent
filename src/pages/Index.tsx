
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard/agents");
      } else {
        navigate("/login");
      }
    };
    
    checkUser();
  }, [navigate]);

  return null; // Return null since we'll navigate away
};

export default Index;

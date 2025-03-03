
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function AccountSettings() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to log out. Please try again."
        });
        return;
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again."
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-2">Session Management</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Sign out from your current account session
              </p>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, isAuthLoading } = useAuth();

  useEffect(() => {
    // Check the mode param from URL
    const mode = searchParams.get("mode");
    setIsSignUp(mode === "signup");

    // Clear previous error when switching modes
    setAuthError(null);

    // If user already has a session after loading, redirect
    if (!isAuthLoading && session) {
      navigate("/dashboard/agents");
    }
  }, [searchParams, navigate, session, isAuthLoading]);

  const handleToggleMode = () => {
    setAuthError(null); // Clear errors on mode switch
    navigate(`/auth?mode=${isSignUp ? 'login' : 'signup'}`, { replace: true });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        // Sign up flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: email.split("@")[0],
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: "Account created!",
            description: "Let's set up your workspace.",
          });
          navigate('/onboarding');
        }
      } else {
        // Sign in flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;

        if (data.user) {
          console.log("Login successful, checking profile");
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .maybeSingle();

          console.log("Profile check:", profile);
          
          if (profile?.onboarding_completed) {
            navigate("/dashboard/agents");
          } else {
            navigate("/onboarding");
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthError(error.message || "An error occurred during authentication");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-white dark:bg-black">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
      
      {/* Theme Toggle remains in its original position, adjusted for new parent */}
      <div className="absolute right-4 top-4 md:right-8 md:top-8 z-30">
        <ThemeToggle />
      </div>

      {/* Auth Card - Placed as the content within the background */}
      <div className="relative z-20 mx-auto w-full max-w-[350px] space-y-6 flex flex-col items-center">
        <div className="text-3xl font-bold tracking-tight mb-8 text-center text-white">EasyAgents.ai</div>
        <Card className="w-full border shadow-none bg-background/80 backdrop-blur-sm dark:bg-neutral-800 dark:border dark:border-neutral-700">
          <CardHeader>
            <CardTitle>{isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {isSignUp
                ? "Enter your email below to create your account"
                : "Enter your email below to login to your account"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4">
              {authError && (
                <div className="p-3 text-sm bg-red-50/90 dark:bg-red-900/50 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded">
                  {authError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/80 dark:bg-neutral-700 dark:border dark:border-neutral-600" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/80 dark:bg-neutral-700 dark:border dark:border-neutral-600"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                type="button"
                onClick={handleToggleMode}
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;

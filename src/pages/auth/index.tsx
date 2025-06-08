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

  // Rest of your component code would go here...
};
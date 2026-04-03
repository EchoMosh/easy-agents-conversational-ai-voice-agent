import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  useRegisterLoadingState,
  LoadingPriority,
} from "@/context/app-loading-context";

interface AuthContextType {
  session: Session | null;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Register auth loading as HIGH priority
  useRegisterLoadingState(
    "authentication",
    isAuthLoading,
    LoadingPriority.HIGH,
  );

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          console.error("Auth session error:", error);
          setSession(null);
          setIsAuthLoading(false);
          return;
        }
        setSession(data.session);
        setIsAuthLoading(false);
      } catch (err) {
        console.error("Failed to get auth session:", err);
        if (!mounted) return;
        setSession(null);
        setIsAuthLoading(false);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setSession(session);
        }
      },
    );

    if (!session) {
      getInitialSession();
    } else {
      setIsAuthLoading(false);
    }

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;

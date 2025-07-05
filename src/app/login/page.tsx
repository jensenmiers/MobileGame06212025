"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        try {
          // Sync user profile first
          await fetch('/api/auth/sync-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: session.user.id })
          });
          
          // Then fetch the user's profile from Supabase
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.error("Error fetching user profile:", error);
            return;
          }

          // Redirect based on role
          if (profile?.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } catch (error) {
          console.error("Error during auth state change:", error);
        }
      }
    });
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleLogin = async () => {
    try {
      const redirectUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/auth/callback' 
        : `${window.location.origin}/auth/callback`;
        
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
      <div style={{ background: "#003300", padding: 32, borderRadius: 12, boxShadow: "0 0 16px #0f04" }}>
        <h2 style={{ color: "#fff", marginBottom: 24, textAlign: "center" }}>Sign in to Admin Portal</h2>
        <button
          onClick={handleLogin}
          style={{
            background: "#0f0",
            color: "#111",
            border: "none",
            borderRadius: 8,
            padding: "12px 32px",
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
            width: "100%"
          }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 
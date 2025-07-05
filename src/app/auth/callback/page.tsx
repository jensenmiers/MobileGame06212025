"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Give Supabase a moment to process the session, then redirect
    const timeout = setTimeout(() => {
      router.replace("/");
    }, 500); // 0.5s delay is usually enough

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Logging you in...</p>
    </div>
  );
} 
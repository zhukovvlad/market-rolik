"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome Back"
      description="Sign in to your account to continue"
    >
      <GoogleLoginButton buttonText="Continue with Google" />
    </AuthCard>
  );
}

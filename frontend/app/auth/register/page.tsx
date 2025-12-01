"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create Account"
      description="Get started with your free account"
    >
      <GoogleLoginButton buttonText="Sign up with Google" />
    </AuthCard>
  );
}

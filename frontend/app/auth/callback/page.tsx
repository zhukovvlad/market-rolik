"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { API_URL } from "@/lib/utils";
import { toast } from "sonner";

function AuthCallbackContent() {
    const router = useRouter();
    const { login } = useAuth();

    useEffect(() => {
        // Small delay to ensure cookies are set by the browser after redirect
        const timer = setTimeout(() => {
            // Tokens are now in httpOnly cookies, just fetch user data
            fetch(`${API_URL}/auth/me`, {
                credentials: 'include', // Important: send cookies
            })
                .then(res => {
                    if (!res.ok) {
                        console.error('Auth response status:', res.status);
                        throw new Error('Failed to fetch user');
                    }
                    return res.json();
                })
                .then(user => {
                    login(user);
                    toast.success("Вход выполнен успешно!");
                    router.push("/dashboard");
                })
                .catch(error => {
                    console.error("Failed to fetch user profile:", error);
                    toast.error("Ошибка входа");
                    router.push("/");
                });
        }, 100); // 100ms delay to ensure cookies are set

        return () => clearTimeout(timer);
    }, [router, login]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}

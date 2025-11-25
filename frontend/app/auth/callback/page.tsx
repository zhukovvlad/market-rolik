"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { API_URL } from "@/lib/utils";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            // Очищаем URL от токена, чтобы он не сохранялся в истории
            window.history.replaceState(null, '', window.location.pathname);

            // Fetch user data from backend
            fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch user');
                    return res.json();
                })
                .then(user => {
                    login(token, user);
                    router.push("/");
                })
                .catch(error => {
                    console.error("Failed to fetch user", error);
                    router.push("/auth/error");
                });
        } else {
            router.push("/");
        }
    }, [searchParams, router, login]);

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

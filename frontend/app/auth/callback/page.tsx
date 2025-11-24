"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            try {
                // Декодируем JWT с правильной поддержкой UTF-8 (кириллица)
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

                // Правильное декодирование UTF-8
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                );

                const payload = JSON.parse(jsonPayload);

                const user = {
                    id: payload.sub,
                    email: payload.email,
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    avatarUrl: payload.avatarUrl,
                };

                login(token, user);
                router.push("/");
            } catch (error) {
                console.error("Failed to decode token", error);
                router.push("/?error=invalid_token");
            }
        } else {
            router.push("/");
        }
    }, [searchParams, router]);

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

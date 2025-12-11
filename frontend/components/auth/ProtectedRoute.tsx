"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const loader = (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Загрузка...</p>
        </div>
    </div>
);

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return loader;
    }

    if (!user) {
        return loader;
    }

    return <>{children}</>;
}

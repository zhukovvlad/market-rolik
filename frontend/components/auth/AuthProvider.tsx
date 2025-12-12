"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    credits: number;
}

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isLoading: boolean;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const refreshAuth = useCallback(async () => {
        try {
            // Fetch current user from backend - JWT is in httpOnly cookie
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/me`, {
                credentials: 'include', // Important: send cookies
            });

            if (response.ok) {
                const userData = await response.json();
                const safeUser: User = {
                    ...userData,
                    credits: typeof userData.credits === "number" ? userData.credits : 0,
                };
                setUser(safeUser);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            setUser(null);
        }
    }, []);

    useEffect(() => {
        // Check authentication status on mount
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshAuth().finally(() => setIsLoading(false));
    }, [refreshAuth]);

    const login = useCallback((newUser: User) => {
        const safeUser: User = {
            ...newUser,
            credits: typeof newUser.credits === "number" ? newUser.credits : 0,
        };
        setUser(safeUser);
    }, []);

    const logout = useCallback(async () => {
        try {
            // Call backend logout to clear cookies
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error("Logout error:", error);
        }
        setUser(null);
        router.push("/");
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

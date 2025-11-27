"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.png" alt="AviAI Logo" width={120} height={40} className="h-8 w-auto object-contain" />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        Возможности
                    </Link>
                    <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        Как это работает
                    </Link>
                    <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        Тарифы
                    </Link>
                </nav>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                {user.avatarUrl && (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.firstName || "User avatar"}
                                        className="w-8 h-8 rounded-full ring-2 ring-border"
                                    />
                                )}
                                <span className="text-sm font-medium text-foreground">
                                    {user.firstName}
                                </span>
                            </div>
                            <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-destructive">
                                Выйти
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
                                <Link href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/google`}>
                                    Войти
                                </Link>
                            </Button>
                            <Button asChild variant="default" className="shadow-[0_0_15px_rgba(204,255,0,0.3)]">
                                <Link href="/create">
                                    Начать бесплатно
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Открыть меню навигации"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? (
                            <X className="w-6 h-6 text-foreground" />
                        ) : (
                            <Menu className="w-6 h-6 text-foreground" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden border-t border-border bg-background px-4 py-6 space-y-4 shadow-lg absolute w-full left-0">
                    <nav className="flex flex-col gap-4">
                        <Link
                            href="#features"
                            className="text-base font-medium text-muted-foreground hover:text-primary"
                            onClick={() => setIsOpen(false)}
                        >
                            Возможности
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="text-base font-medium text-muted-foreground hover:text-primary"
                            onClick={() => setIsOpen(false)}
                        >
                            Как это работает
                        </Link>
                        <Link
                            href="#pricing"
                            className="text-base font-medium text-muted-foreground hover:text-primary"
                            onClick={() => setIsOpen(false)}
                        >
                            Тарифы
                        </Link>
                    </nav>
                    <div className="flex flex-col gap-3 pt-4 border-t border-border">
                        {user ? (
                            <Button variant="ghost" onClick={logout} className="w-full justify-start text-muted-foreground hover:text-destructive">
                                Выйти
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary">
                                    <Link href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/google`}>Войти</Link>
                                </Button>
                                <Button asChild variant="default" className="w-full">
                                    <Link href="/create">Начать бесплатно</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

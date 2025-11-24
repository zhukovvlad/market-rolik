"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        M
                    </div>
                    <span className="font-bold text-xl text-slate-900 tracking-tight">Market-Rolik</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                        Возможности
                    </Link>
                    <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                        Как это работает
                    </Link>
                    <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                        Тарифы
                    </Link>
                </nav>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Button asChild variant="ghost" className="text-slate-600 hover:text-indigo-600">
                        <Link href="/login">
                            Войти
                        </Link>
                    </Button>
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                        <Link href="/create">
                            Начать бесплатно
                        </Link>
                    </Button>
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
                            <X className="w-6 h-6 text-slate-700" />
                        ) : (
                            <Menu className="w-6 h-6 text-slate-700" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden border-t border-slate-200 bg-white px-4 py-6 space-y-4 shadow-lg absolute w-full left-0">
                    <nav className="flex flex-col gap-4">
                        <Link
                            href="#features"
                            className="text-base font-medium text-slate-600 hover:text-indigo-600"
                            onClick={() => setIsOpen(false)}
                        >
                            Возможности
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="text-base font-medium text-slate-600 hover:text-indigo-600"
                            onClick={() => setIsOpen(false)}
                        >
                            Как это работает
                        </Link>
                        <Link
                            href="#pricing"
                            className="text-base font-medium text-slate-600 hover:text-indigo-600"
                            onClick={() => setIsOpen(false)}
                        >
                            Тарифы
                        </Link>
                    </nav>
                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                        <Button asChild variant="ghost" className="w-full justify-start text-slate-600">
                            <Link href="/login">Войти</Link>
                        </Button>
                        <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                            <Link href="/create">Начать бесплатно</Link>
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
}

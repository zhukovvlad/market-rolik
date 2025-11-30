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
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/20">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <Image src="/logo.png" alt="AviAI" width={120} height={40} className="h-10 w-auto object-contain" />
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-gray-400 hover:text-purple-400 transition-colors">Features</Link>
                        <Link href="#how-it-works" className="text-gray-400 hover:text-purple-400 transition-colors">How it Works</Link>
                        <Link href="#pricing" className="text-gray-400 hover:text-purple-400 transition-colors">Pricing</Link>
                        <Link href="#testimonials" className="text-gray-400 hover:text-purple-400 transition-colors">Testimonials</Link>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    {user.avatarUrl && (
                                        <Image
                                            src={user.avatarUrl}
                                            alt={user.firstName || "User avatar"}
                                            width={32}
                                            height={32}
                                            className="rounded-full ring-2 ring-purple-500/20"
                                            unoptimized
                                        />
                                    )}
                                    <span className="text-sm font-medium text-gray-300">
                                        {user.firstName}
                                    </span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    onClick={logout}
                                    className="text-gray-300 hover:text-white hover:bg-purple-500/10"
                                >
                                    Sign Out
                                </Button>
                                <Link 
                                    href="/dashboard"
                                    className="px-6 py-2 bg-linear-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all border border-purple-400/20 inline-flex items-center justify-center"
                                >
                                    Dashboard
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Link 
                                    href="/auth/login"
                                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors inline-flex items-center justify-center"
                                >
                                    Sign In
                                </Link>
                                <Link 
                                    href="/auth/register"
                                    className="px-6 py-2 bg-linear-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all border border-purple-400/20 inline-flex items-center justify-center"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                    <button 
                        className="md:hidden p-2" 
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isOpen}
                        aria-controls="mobile-menu"
                    >
                        {isOpen ? (
                            <X className="w-6 h-6 text-white" aria-hidden="true" />
                        ) : (
                            <Menu className="w-6 h-6 text-white" aria-hidden="true" />
                        )}
                    </button>
                </div>
                
                {/* Mobile Menu */}
                {isOpen && (
                    <div 
                        id="mobile-menu"
                        className="md:hidden py-4 border-t border-purple-500/20 bg-black/95 backdrop-blur-md absolute left-0 right-0 px-4 flex flex-col gap-4"
                    >
                        <Link href="#features" className="text-gray-400 hover:text-purple-400 transition-colors py-2" onClick={() => setIsOpen(false)}>Features</Link>
                        <Link href="#how-it-works" className="text-gray-400 hover:text-purple-400 transition-colors py-2" onClick={() => setIsOpen(false)}>How it Works</Link>
                        <Link href="#pricing" className="text-gray-400 hover:text-purple-400 transition-colors py-2" onClick={() => setIsOpen(false)}>Pricing</Link>
                        <Link href="#testimonials" className="text-gray-400 hover:text-purple-400 transition-colors py-2" onClick={() => setIsOpen(false)}>Testimonials</Link>
                        
                        <div className="h-px bg-purple-500/20 my-2"></div>
                        
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 py-2">
                                    <span className="text-sm font-medium text-gray-300">
                                        {user.firstName}
                                    </span>
                                </div>
                                <Link 
                                    href="/dashboard" 
                                    onClick={() => setIsOpen(false)}
                                    className="w-full px-6 py-2 bg-linear-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all border border-purple-400/20 inline-flex items-center justify-center"
                                >
                                    Dashboard
                                </Link>
                                <Button 
                                    variant="ghost" 
                                    onClick={() => { logout(); setIsOpen(false); }}
                                    className="w-full text-gray-300 hover:text-white hover:bg-purple-500/10 justify-start px-0"
                                >
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Link 
                                    href="/auth/login" 
                                    onClick={() => setIsOpen(false)}
                                    className="w-full px-4 py-2 text-gray-300 hover:text-white transition-colors text-left inline-block"
                                >
                                    Sign In
                                </Link>
                                <Link 
                                    href="/auth/register" 
                                    onClick={() => setIsOpen(false)}
                                    className="w-full px-6 py-2 bg-linear-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all border border-purple-400/20 inline-flex items-center justify-center"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </header>
    );
}

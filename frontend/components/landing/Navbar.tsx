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
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.firstName || "User avatar"}
                                            className="w-8 h-8 rounded-full ring-2 ring-purple-500/20"
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
                                <Link href="/dashboard">
                                    <button className="px-6 py-2 bg-linear-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all border border-purple-400/20">
                                        Dashboard
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Link href="/auth/login">
                                    <button className="px-4 py-2 text-gray-300 hover:text-white transition-colors">Sign In</button>
                                </Link>
                                <Link href="/auth/register">
                                    <button className="px-6 py-2 bg-linear-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all border border-purple-400/20">Get Started</button>
                                </Link>
                            </>
                        )}
                    </div>
                    <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? (
                            <X className="w-6 h-6 text-white" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu w-6 h-6 text-white" aria-hidden="true">
                                <path d="M4 5h16"></path>
                                <path d="M4 12h16"></path>
                                <path d="M4 19h16"></path>
                            </svg>
                        )}
                    </button>
                </div>
                
                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden py-4 border-t border-purple-500/20 bg-black/95 backdrop-blur-md absolute left-0 right-0 px-4 flex flex-col gap-4">
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
                                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                                    <button className="w-full px-6 py-2 bg-linear-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all border border-purple-400/20">
                                        Dashboard
                                    </button>
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
                                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                                    <button className="w-full px-4 py-2 text-gray-300 hover:text-white transition-colors text-left">Sign In</button>
                                </Link>
                                <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                                    <button className="w-full px-6 py-2 bg-linear-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all border border-purple-400/20">Get Started</button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </header>
    );
}

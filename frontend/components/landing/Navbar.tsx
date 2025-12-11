"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [authDialogTab, setAuthDialogTab] = useState<"login" | "register">("login");
    const { user, logout } = useAuth();

    const openAuthDialog = (tab: "login" | "register") => {
        setAuthDialogTab(tab);
        setAuthDialogOpen(true);
        setIsOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
            <nav className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <Image src="/logo.png" alt="AviAI" width={120} height={40} className="h-10 w-auto object-contain" />
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link>
                        <Link href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How it Works</Link>
                        <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
                        <Link href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">Testimonials</Link>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <ThemeToggle />
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    {user.avatarUrl && (
                                        <Image
                                            src={user.avatarUrl}
                                            alt={user.firstName || "User avatar"}
                                            width={32}
                                            height={32}
                                            className="rounded-full ring-2 ring-primary/20"
                                            unoptimized
                                        />
                                    )}
                                    <span className="text-sm font-medium text-foreground">
                                        {user.firstName}
                                    </span>
                                </div>
                                <Button 
                                    type="button"
                                    variant="ghost" 
                                    onClick={logout}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    Sign Out
                                </Button>
                                <Link 
                                    href="/dashboard"
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all border border-primary/20 inline-flex items-center justify-center"
                                >
                                    Dashboard
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => openAuthDialog("login")}
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Sign In
                                </Button>
                                <Button
                                    onClick={() => openAuthDialog("register")}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all border border-primary/20"
                                >
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>
                    <button 
                        type="button"
                        className="md:hidden p-2" 
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isOpen}
                        aria-controls="mobile-menu"
                    >
                        {isOpen ? (
                            <X className="w-6 h-6 text-foreground" aria-hidden="true" />
                        ) : (
                            <Menu className="w-6 h-6 text-foreground" aria-hidden="true" />
                        )}
                    </button>
                </div>
                
                {/* Mobile Menu */}
                {isOpen && (
                    <div 
                        id="mobile-menu"
                        className="md:hidden py-4 border-t border-border bg-background absolute left-0 right-0 px-4 flex flex-col gap-4"
                    >
                        <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors py-2" onClick={() => setIsOpen(false)}>Features</Link>
                        <Link href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors py-2" onClick={() => setIsOpen(false)}>How it Works</Link>
                        <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors py-2" onClick={() => setIsOpen(false)}>Pricing</Link>
                        <Link href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors py-2" onClick={() => setIsOpen(false)}>Testimonials</Link>
                        
                        <div className="h-px bg-border my-2"></div>
                        
                        <ThemeToggle />
                        
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 py-2">
                                    <span className="text-sm font-medium text-foreground">
                                        {user.firstName}
                                    </span>
                                </div>
                                <Link 
                                    href="/dashboard" 
                                    onClick={() => setIsOpen(false)}
                                    className="w-full px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all border border-primary/20 inline-flex items-center justify-center"
                                >
                                    Dashboard
                                </Link>
                                <Button 
                                    type="button"
                                    variant="ghost" 
                                    onClick={() => { logout(); setIsOpen(false); }}
                                    className="w-full text-muted-foreground hover:text-foreground justify-start px-0"
                                >
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => openAuthDialog("login")}
                                    className="w-full text-muted-foreground hover:text-foreground justify-start px-0"
                                >
                                    Sign In
                                </Button>
                                <Button
                                    onClick={() => openAuthDialog("register")}
                                    className="w-full px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all border border-primary/20"
                                >
                                    Get Started
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </nav>
            
            <AuthDialog 
                open={authDialogOpen} 
                onOpenChange={setAuthDialogOpen}
                defaultTab={authDialogTab}
            />
        </header>
    );
}

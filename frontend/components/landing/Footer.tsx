import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="bg-background border-t border-border py-12">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="AviAI Logo" width={100} height={32} className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity" />
                </div>

                <div className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} AviAI. All rights reserved.
                </div>

                <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
                    <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
                    <Link href="#" className="hover:text-primary transition-colors">Support</Link>
                </div>
            </div>
        </footer>
    );
}

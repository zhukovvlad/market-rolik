import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-white border-t border-slate-200 py-12">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        M
                    </div>
                    <span className="font-bold text-slate-900">Market-Rolik</span>
                </div>

                <div className="text-sm text-slate-500">
                    © {new Date().getFullYear()} Market-Rolik. All rights reserved.
                </div>

                <div className="flex gap-6 text-sm font-medium text-slate-600">
                    <Link href="#" className="hover:text-indigo-600 transition-colors">Privacy</Link>
                    <Link href="#" className="hover:text-indigo-600 transition-colors">Terms</Link>
                    <Link href="#" className="hover:text-indigo-600 transition-colors">Support</Link>
                </div>
            </div>
        </footer>
    );
}

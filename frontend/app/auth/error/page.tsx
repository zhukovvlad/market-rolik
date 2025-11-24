import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-red-50 to-orange-50">
            <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Ошибка входа
                </h1>

                <p className="text-gray-600 mb-6">
                    Не удалось подключиться к Google. Возможно, временная проблема с сетью.
                </p>

                <div className="space-y-3">
                    <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/google`}>
                            Повторить попытку
                        </a>
                    </Button>

                    <Button asChild variant="outline" className="w-full">
                        <Link href="/">
                            Вернуться на главную
                        </Link>
                    </Button>
                </div>

                <div className="mt-6 text-sm text-gray-500">
                    <p>Попробуйте:</p>
                    <ul className="mt-2 space-y-1 text-left">
                        <li>• Проверить интернет-соединение</li>
                        <li>• Подключиться к другой сети</li>
                        <li>• Повторить через несколько секунд</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

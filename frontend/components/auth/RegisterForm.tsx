"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const PASSWORD_MIN_LENGTH = 12;

interface RegisterFormProps {
    onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
    });
    const [loading, setLoading] = useState(false);

    type RegisterField = keyof typeof formData;

    const handleChange = (field: RegisterField) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Пароли не совпадают");
            return;
        }

        if (formData.password.length < PASSWORD_MIN_LENGTH) {
            toast.error(`Пароль должен быть минимум ${PASSWORD_MIN_LENGTH} символов`);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Ошибка регистрации");
            }

            const data = await response.json();
            login(data.user);
            toast.success("Регистрация успешна! Добро пожаловать!");
            onSuccess?.();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Не удалось зарегистрироваться";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Имя</Label>
                        <Input
                            id="firstName"
                            type="text"
                            placeholder="Иван"
                            value={formData.firstName}
                            onChange={handleChange("firstName")}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">Фамилия</Label>
                        <Input
                            id="lastName"
                            type="text"
                            placeholder="Иванов"
                            value={formData.lastName}
                            onChange={handleChange("lastName")}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                        id="reg-email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange("email")}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="reg-password">Пароль</Label>
                    <Input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange("password")}
                        minLength={PASSWORD_MIN_LENGTH}
                        required
                        disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                        Минимум {PASSWORD_MIN_LENGTH} символов
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange("confirmPassword")}
                        required
                        disabled={loading}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Регистрация...
                        </>
                    ) : (
                        "Зарегистрироваться"
                    )}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        или
                    </span>
                </div>
            </div>

            <GoogleLoginButton buttonText="Регистрация через Google" />
        </div>
    );
}

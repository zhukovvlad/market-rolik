import { Wand2, Layers, Smartphone, Zap } from "lucide-react";

const features = [
    {
        icon: Wand2,
        title: "AI Анимация",
        description: "Наш алгоритм оживляет статичные фото, добавляя движение ткани, блики и динамику.",
        color: "text-purple-600",
        bg: "bg-purple-50",
    },
    {
        icon: Layers,
        title: "Умное удаление фона",
        description: "Автоматически вырезаем товар и помещаем его на профессиональный фон.",
        color: "text-indigo-600",
        bg: "bg-indigo-50",
    },
    {
        icon: Smartphone,
        title: "Формат для WB/Ozon",
        description: "Видео сразу в формате 9:16, готовое к загрузке в карточку товара.",
        color: "text-pink-600",
        bg: "bg-pink-50",
    },
    {
        icon: Zap,
        title: "Генерация за 60 сек",
        description: "Не нужно ждать часами. Получите результат быстрее, чем заварите кофе.",
        color: "text-amber-600",
        bg: "bg-amber-50",
    },
];

export default function FeatureGrid() {
    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">
                        Всё, что нужно для <span className="text-indigo-600">высоких продаж</span>
                    </h2>
                    <p className="text-lg text-slate-600">
                        Мы автоматизировали работу видео-монтажера и дизайнера, чтобы вы экономили бюджет.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300"
                        >
                            <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-slate-500 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

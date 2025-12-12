import { useState, type ElementType } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Smartphone, Monitor, Square, RectangleVertical, Music, Mic } from "lucide-react";
import { GenerateSettings, AspectRatio, ASPECT_RATIOS, MusicTheme, TtsVoice, TTS_VOICES } from "@/types/project";

interface SettingsStepProps {
    imageUrl: string;
    onGenerate: (settings: GenerateSettings) => void;
    isGenerating: boolean;
    onBack?: () => void;
}

// Order matches ASPECT_RATIOS constant for consistency
const ASPECT_RATIO_CONFIG: Record<AspectRatio, { label: string; Icon: ElementType }> = {
    "9:16": { label: "Stories (9:16)", Icon: Smartphone },
    "16:9": { label: "Landscape (16:9)", Icon: Monitor },
    "1:1": { label: "Square (1:1)", Icon: Square },
    "3:4": { label: "Post (3:4)", Icon: RectangleVertical },
};

export default function SettingsStep({ imageUrl, onGenerate, isGenerating, onBack }: SettingsStepProps) {
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
    const [imageErrorUrl, setImageErrorUrl] = useState<string | null>(null);
    const imageError = imageErrorUrl === imageUrl;
    
    // Audio settings
    const [musicTheme, setMusicTheme] = useState<MusicTheme>('energetic');
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const [ttsText, setTtsText] = useState("");
    const [ttsVoice, setTtsVoice] = useState<TtsVoice>('ermil');

    const handleGenerate = () => {
        onGenerate({ 
            prompt, 
            aspectRatio,
            musicTheme,
            ttsEnabled,
            ttsText: ttsText.trim() || undefined,
            ttsVoice
        });
    };

    const getPreviewStyle = (ratio: AspectRatio) => {
        switch (ratio) {
            case '9:16': return "aspect-[9/16] max-w-xs mx-auto";
            case '16:9': return "aspect-video max-w-full mx-auto";
            case '1:1': return "aspect-square max-w-sm mx-auto";
            case '3:4': return "aspect-[3/4] max-w-sm mx-auto";
            default: {
                const _exhaustive: never = ratio;
                return "aspect-[9/16] max-w-xs mx-auto";
            }
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Preview */}
            <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold font-heading">Превью</h3>
                <div className={`relative rounded-xl overflow-hidden border border-border bg-black/50 shadow-2xl transition-all duration-500 ${getPreviewStyle(aspectRatio)}`}>
                    <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover opacity-80" 
                        onLoad={(e) => {
                            const attemptedSrc = e.currentTarget.currentSrc || e.currentTarget.src;
                            if (attemptedSrc === imageUrl) {
                                setImageErrorUrl(null);
                            }
                        }}
                        onError={(e) => {
                            const attemptedSrc = e.currentTarget.currentSrc || e.currentTarget.src;
                            if (attemptedSrc === imageUrl) {
                                setImageErrorUrl(imageUrl);
                            }
                        }}
                    />
                    {imageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <span className="text-muted-foreground">Failed to load image</span>
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-white/50 text-sm font-medium backdrop-blur-sm px-3 py-1 rounded-full bg-black/30">
                            {aspectRatio} Preview
                        </p>
                    </div>
                </div>
            </div>

            {/* Right: Settings */}
            <div className="flex flex-col gap-8 bg-card p-6 rounded-2xl border border-border">
                <div className="space-y-4">
                    <h3 className="text-xl font-bold font-heading">Настройки видео</h3>

                    <div className="space-y-3">
                        <Label className="text-base">Формат видео</Label>
                        <RadioGroup
                            value={aspectRatio}
                            onValueChange={(v) => {
                                if ((ASPECT_RATIOS as readonly string[]).includes(v)) {
                                    setAspectRatio(v as AspectRatio);
                                }
                            }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {ASPECT_RATIOS.map((ratio) => {
                                const { label, Icon } = ASPECT_RATIO_CONFIG[ratio];
                                const safeId = `r-${ratio.replace(':', '-')}`;
                                return (
                                    <div key={ratio}>
                                        <RadioGroupItem value={ratio} id={safeId} className="peer sr-only" />
                                        <Label
                                            htmlFor={safeId}
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                        >
                                            <Icon className="mb-3 h-6 w-6" />
                                            <span className="font-semibold text-xs">{label}</span>
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="prompt" className="text-base">Сценарий анимации (Промпт)</Label>
                        <Textarea
                            id="prompt"
                            placeholder="Опишите, что должно происходить в видео (например: 'Медленное вращение, искры, неоновый свет')"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[120px] resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Оставьте пустым, чтобы AI сам придумал сценарий.
                        </p>
                    </div>

                    {/* Music Theme */}
                    <div className="space-y-3">
                        <Label className="text-base flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            Фоновая музыка
                        </Label>
                        <Select value={musicTheme} onValueChange={(v) => {
                            const validThemes = ['energetic', 'calm', 'lofi'] as const;
                            if ((validThemes as readonly string[]).includes(v)) {
                                setMusicTheme(v as MusicTheme);
                            }
                        }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="energetic">🔥 Энергичная</SelectItem>
                                <SelectItem value="calm">🌊 Спокойная</SelectItem>
                                <SelectItem value="lofi">🎧 Lo-Fi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* TTS Settings */}
                    <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="tts-enabled" className="text-base flex items-center gap-2">
                                <Mic className="h-4 w-4" />
                                Озвучка (TTS)
                            </Label>
                            <Switch
                                id="tts-enabled"
                                checked={ttsEnabled}
                                onCheckedChange={setTtsEnabled}
                            />
                        </div>
                        
                        {ttsEnabled && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="tts-voice" className="text-sm">Голос диктора</Label>
                                    <Select value={ttsVoice} onValueChange={(v) => {
                                        const validVoices = new Set(TTS_VOICES.map(({ value }) => value));
                                        if (validVoices.has(v as TtsVoice)) {
                                            setTtsVoice(v as TtsVoice);
                                        }
                                    }}>
                                        <SelectTrigger id="tts-voice">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TTS_VOICES.map(({ value, label }) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="tts-text" className="text-sm">Текст озвучки</Label>
                                    <Textarea
                                        id="tts-text"
                                        placeholder="Оставьте пустым — будет озвучено название и преимущества товара"
                                        value={ttsText}
                                        onChange={(e) => setTtsText(e.target.value)}
                                        className="min-h-20 resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        По умолчанию озвучим название и УТП товара
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex gap-4">
                    {onBack && (
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={onBack}
                            disabled={isGenerating}
                            className="text-lg h-14"
                        >
                            ‹ Назад
                        </Button>
                    )}
                    <Button
                        size="lg"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex-1 text-lg h-14 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-shadow"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Создаем магию...
                            </>
                        ) : (
                            "Создать проект 🚀"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

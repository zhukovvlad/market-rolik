import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Sparkles, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "@/lib/utils";

interface ProductData {
    title: string;
    description: string;
    usps: string[];
}

interface ProductDataStepProps {
    onNext: (data: { imageUrl: string; productData: ProductData }) => void;
}

export default function ProductDataStep({ onNext }: ProductDataStepProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [productData, setProductData] = useState<ProductData>({
        title: "",
        description: "",
        usps: ["", "", ""],
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));

            // Auto-fill title from filename
            const filename = selectedFile.name.split('.').slice(0, -1).join('.');
            // Capitalize first letter and replace hyphens/underscores with spaces
            const formattedTitle = filename.charAt(0).toUpperCase() + filename.slice(1).replace(/[-_]/g, ' ');
            setProductData(prev => ({ ...prev, title: formattedTitle }));
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/projects/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
            });

            setUploadedUrl(res.data.url);
            toast.success("Фото загружено!");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Ошибка загрузки фото");
        } finally {
            setIsUploading(false);
        }
    };

    const handleMagicFill = async () => {
        if (!uploadedUrl) {
            toast.error("Сначала загрузите фото (кнопка UPLOAD)");
            return;
        }

        setIsAnalyzing(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${API_URL}/ai/analyze-image`,
                { imageUrl: uploadedUrl },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setProductData(res.data);
            toast.success("Данные заполнены магией AI! ✨");
        } catch (error) {
            console.error("AI analysis failed", error);
            toast.error("Не удалось проанализировать изображение");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUspChange = (index: number, value: string) => {
        const newUsps = [...productData.usps];
        newUsps[index] = value;
        setProductData({ ...productData, usps: newUsps });
    };

    const handleNext = () => {
        if (!uploadedUrl) {
            toast.error("Пожалуйста, загрузите изображение");
            return;
        }
        if (!productData.title) {
            toast.error("Введите название товара");
            return;
        }
        onNext({ imageUrl: uploadedUrl, productData });
    };

    return (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column: Image Upload */}
            <div className="flex flex-col gap-6">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold font-heading">Добавьте фотографии товара</h2>
                    <p className="text-muted-foreground text-sm">
                        (одно изображение будет основным, остальные - опциональны)
                    </p>
                </div>

                <div className="relative aspect-[4/3] bg-muted/30 border-2 border-dashed border-muted-foreground/25 rounded-xl overflow-hidden flex flex-col items-center justify-center group hover:border-primary/50 transition-colors">
                    {previewUrl ? (
                        <>
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    if (previewUrl) {
                                        URL.revokeObjectURL(previewUrl);
                                    }
                                    setFile(null);
                                    setPreviewUrl(null);
                                    setUploadedUrl(null);
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-lg mb-1">Перетащите фото сюда</p>
                            <p className="text-sm text-muted-foreground">или нажмите для выбора</p>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>

                {/* Thumbnails (Placeholder for future multi-upload) */}
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-[4/3] bg-muted/30 border border-border rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                    ))}
                </div>

                <div className="flex justify-center">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto px-8 font-bold"
                        disabled={!file || !!uploadedUrl || isUploading}
                        onClick={handleUpload}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка...
                            </>
                        ) : uploadedUrl ? (
                            "Загружено ✓"
                        ) : (
                            <>
                                UPLOAD <Upload className="ml-2 w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Right Column: Form Data */}
            <div className="flex flex-col gap-6 bg-card/50 p-6 rounded-2xl border border-border/50">
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20 text-cyan-500 hover:text-cyan-400 hover:border-cyan-500/50"
                        onClick={handleMagicFill}
                        disabled={!uploadedUrl || isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Анализируем...
                            </>
                        ) : (
                            <>
                                Заполнить автоматически <Sparkles className="ml-2 w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-base font-semibold">Наименование товара*</Label>
                        <Input
                            id="title"
                            placeholder="Введите название товара"
                            value={productData.title}
                            onChange={(e) => setProductData({ ...productData, title: e.target.value })}
                            className="h-12 text-lg"
                        />
                        <p className="text-xs text-muted-foreground">
                            Может быть сгенерировано автоматически на основе изображения
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-base font-semibold">Описание товара (опционально)</Label>
                        <Textarea
                            id="description"
                            placeholder="Опишите свой товар"
                            value={productData.description}
                            onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                            className="min-h-[120px] resize-none text-base"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Преимущества товара (УТП)*</Label>
                        <div className="space-y-3">
                            {productData.usps.map((usp, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="text-muted-foreground font-mono w-4">{index + 1}.</span>
                                    <Input
                                        placeholder={`Уникальное торговое предложение ${index + 1}`}
                                        value={usp}
                                        onChange={(e) => handleUspChange(index, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-6 flex justify-end">
                    <Button size="lg" onClick={handleNext} className="px-8 text-lg">
                        NEXT »
                    </Button>
                </div>
            </div>
        </div>
    );
}

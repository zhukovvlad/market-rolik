import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            M
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Market-Rolik</CardTitle>
          <CardDescription>
            Создавайте продающие видео-обложки для Wildberries с помощью AI за секунды.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6">
              Создать новый проект 🚀
            </Button>
            <Button variant="outline" className="w-full">
              Мои проекты
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-xs text-slate-400">
        Powered by Kling AI & Photoroom
      </p>
    </main>
  );
}
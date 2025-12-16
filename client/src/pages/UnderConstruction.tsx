import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function UnderConstruction() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 text-gray-900">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 py-14 space-y-6 text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-pink-100 text-pink-700 px-4 py-2 text-sm font-semibold">
          Em desenvolvimento
        </div>
        <h1 className="text-4xl font-bold text-pink-600">Planos em construção</h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          Estamos finalizando a experiência de contratação dos planos. Enquanto isso, você pode explorar o fluxo
          gratuito e o quiz demonstrativo.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button className="bg-pink-500 hover:bg-pink-600" onClick={() => navigate("/quiz")}>
            Testar fluxo gratuito
          </Button>
          <Button variant="outline" className="border-pink-200 text-pink-700" onClick={() => navigate("/")}>
            Voltar para a página inicial
          </Button>
        </div>
      </main>
    </div>
  );
}

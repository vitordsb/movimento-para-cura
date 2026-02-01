import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center space-y-6 border border-pink-100">
        <div className="bg-red-50 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Ops! Algo deu errado</h2>
          <p className="text-gray-600">
            Desculpe, ocorreu um erro inesperado. Nossa equipe já foi notificada.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-gray-100 p-4 rounded text-left overflow-auto max-h-40 text-xs text-red-600 font-mono">
            {error.message}
          </div>
        )}

        <Button 
          onClick={resetErrorBoundary}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-6"
        >
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PaymentPage() {
  const [, navigate] = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "confirmed" | "failed">("pending");
  const [pollingCount, setPollingCount] = useState(0);
  
  const { data: subscriptionStatus, refetch } = trpc.subscriptions.status.useQuery(undefined, {
    refetchInterval: paymentStatus === "pending" ? 5000 : false, // Poll every 5 seconds
  });

  useEffect(() => {
    if (subscriptionStatus?.hasActivePlan) {
      setPaymentStatus("confirmed");
      toast.success("Pagamento confirmado! Redirecionando...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } else if (pollingCount > 60) {
      // Stop polling after 5 minutes (60 * 5 seconds)
      setPaymentStatus("failed");
    }
  }, [subscriptionStatus, navigate, pollingCount]);

  useEffect(() => {
    if (paymentStatus === "pending") {
      const interval = setInterval(() => {
        setPollingCount(prev => prev + 1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentStatus]);

  const handleRetry = () => {
    setPaymentStatus("pending");
    setPollingCount(0);
    refetch();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-pink-600">
            {paymentStatus === "pending" && "Aguardando Pagamento"}
            {paymentStatus === "confirmed" && "Pagamento Confirmado!"}
            {paymentStatus === "failed" && "Tempo Esgotado"}
          </CardTitle>
          <CardDescription>
            {paymentStatus === "pending" && "Complete o pagamento na janela do Asaas"}
            {paymentStatus === "confirmed" && "Seu plano foi ativado com sucesso"}
            {paymentStatus === "failed" && "Não detectamos seu pagamento"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {paymentStatus === "pending" && (
              <Loader2 className="h-16 w-16 text-pink-500 animate-spin" />
            )}
            {paymentStatus === "confirmed" && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {paymentStatus === "failed" && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>

          {paymentStatus === "pending" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Estamos aguardando a confirmação do seu pagamento. Isso pode levar alguns instantes.
              </p>
              <p className="text-xs text-gray-500 text-center">
                Verificando automaticamente... ({pollingCount * 5}s)
              </p>
            </div>
          )}

          {paymentStatus === "confirmed" && (
            <p className="text-sm text-gray-600 text-center">
              Você será redirecionado para o dashboard em instantes.
            </p>
          )}

          {paymentStatus === "failed" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Não conseguimos detectar seu pagamento. Você pode tentar novamente ou entrar em contato com o suporte.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1">
                  Verificar Novamente
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                  Voltar ao Início
                </Button>
              </div>
            </div>
          )}

          {paymentStatus === "pending" && (
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Cancelar e Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

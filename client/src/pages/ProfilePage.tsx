import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function ProfilePage() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  if (loading) return null;
  if (!user) return null;

  const handleContact = () => {
    window.location.href = "mailto:andressaoncopersonal@gmail.com?subject=Revisão de anamnese";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-pink-600">Perfil</CardTitle>
            <p className="text-sm text-gray-700">
              Para alterar sua anamnese, entre em contato com sua oncologista responsável.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800">
              <p><strong>Nome:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Plano ativo:</strong> {user.hasActivePlan ? "Sim" : "Não"}</p>
              <p><strong>Anamnese:</strong> {user.hasCompletedAnamnesis ? "Completa" : "Pendente"}</p>
            </div>
            <div className="flex gap-3">
              <Button className="bg-pink-500 hover:bg-pink-600 text-white" onClick={handleContact}>
                Contatar oncologista
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Voltar ao painel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

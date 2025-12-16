import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SettingsPage() {
  const { loading, user } = useAuth({ redirectOnUnauthenticated: true });
  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-pink-600">Configurações</CardTitle>
            <p className="text-sm text-gray-700">Ajustes básicos da sua conta.</p>
          </CardHeader>
          <CardContent className="text-sm text-gray-800 space-y-2">
            <p>Email: {user.email}</p>
            <p>Plano: {user.hasActivePlan ? "Ativo" : "Inativo"}</p>
            <p>Anamnese: {user.hasCompletedAnamnesis ? "Completa" : "Pendente"}</p>
            <p>Para alterar anamnese ou dados clínicos, contate sua oncologista.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

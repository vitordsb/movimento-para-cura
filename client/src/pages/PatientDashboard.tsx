import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { format, subDays } from "date-fns";
import { skipToken } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const needsAnamnesis = user && user.role === "PATIENT" && user.hasCompletedAnamnesis === false;

  // Get active quiz
  const { data: activeQuiz, isLoading: quizLoading } = trpc.quizzes.getActive.useQuery();

  // Get today's response
  const { data: todayResponse } = trpc.responses.getToday.useQuery(
    activeQuiz ? { quizId: activeQuiz.id } : skipToken
  );

  // Get response history
  const { data: history = [] } = trpc.responses.getMyHistory.useQuery({ limit: 30 });

  // Get last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const response = history.find(
      (r) => format(new Date(r.responseDate), "yyyy-MM-dd") === dateStr
    );
    return { date, response };
  });

  const goodDaysCount = history.filter((r) => r.isGoodDayForExercise).length;
  const totalDays = history.length;
  if (quizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  if (!activeQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-green-50 p-4">
        <Card className="max-w-2xl mx-auto border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Nenhum questionário ativo</h3>
                <p className="text-amber-800">
                  Seu oncologista ainda não ativou um questionário. Volte em breve.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50">
      <AppHeader />
      <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {needsAnamnesis && (
          <Card className="border-pink-200 bg-pink-50">
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm text-pink-800">
                Você ainda não completou sua anamnese clínica. Preencha uma única vez para liberar o algoritmo e os treinos seguros.
              </p>
              <Button className="bg-pink-500 hover:bg-pink-600 text-white" onClick={() => navigate("/anamnese")}>
                Fazer anamnese agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Aviso médico */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                <strong>Importante:</strong> Este aplicativo não substitui consulta médica.
                Siga sempre as orientações do seu oncologista. Em caso de sintomas graves, contate seu
                médico imediatamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Boas-vindas */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Olá, {user?.name}! 👋</h1>
          <p className="text-gray-600">
            {todayResponse
              ? "Você já completou a checagem de bem-estar de hoje."
              : "Vamos ver como você está se sentindo hoje."}
          </p>
        </div>

        {/* Today's Status */}
        {todayResponse ? (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Avaliação de hoje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {todayResponse.isGoodDayForExercise ? (
                  <CheckCircle className="w-12 h-12 text-green-500" />
                ) : (
                  <XCircle className="w-12 h-12 text-gray-400" />
                )}
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {todayResponse.isGoodDayForExercise
                      ? "Bom dia para se exercitar! 💪"
                      : "Recomendado descansar 🌿"}
                  </p>
                  <p className="text-gray-600">
                    Recomendação: <strong>{todayResponse.recommendedExerciseType}</strong>
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Score: <span className="font-semibold">{todayResponse.totalScore}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-pink-50 to-green-50">
            <CardHeader>
              <CardTitle>Checagem de bem-estar de hoje</CardTitle>
              <CardDescription>
                Faça uma avaliação rápida para receber recomendações personalizadas de exercício
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/quiz")}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-6 text-lg font-semibold"
                disabled={needsAnamnesis}
              >
                Fazer questionário diário
              </Button>
              {needsAnamnesis && (
                <p className="text-xs text-pink-700 mt-2">
                  Complete sua anamnese para liberar o check-in diário.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Last 7 Days */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Últimos 7 dias
            </CardTitle>
            <CardDescription>
              {goodDaysCount} dias bons de {totalDays} avaliações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-between">
              {last7Days.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="text-xs text-gray-600">{format(day.date, "EEE")}</div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      day.response
                        ? day.response.isGoodDayForExercise
                          ? "bg-green-100 text-green-600"
                          : "bg-pink-50 text-pink-600"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {day.response ? (day.response.isGoodDayForExercise ? "✓" : "—") : "?"}
                  </div>
                  <div className="text-xs text-gray-500">{format(day.date, "d")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.length > 0 && (
            <Button
              variant="outline"
              onClick={() => navigate("/history")}
              className="h-auto py-4 flex flex-col items-center gap-2"
              disabled={needsAnamnesis}
            >
              <span className="text-2xl">📊</span>
              <span className="font-semibold">Ver histórico completo</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate("/exercises")}
            className="h-auto py-4 flex flex-col items-center gap-2"
            disabled={needsAnamnesis}
          >
            <span className="text-2xl">💪</span>
            <span className="font-semibold">Biblioteca de exercícios</span>
          </Button>
        </div>
      </div>
    </div>
    </div>
  );
}

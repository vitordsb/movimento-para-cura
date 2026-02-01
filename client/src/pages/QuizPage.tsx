import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function QuizPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const hasActivePlan = Boolean(user?.hasActivePlan);
  const isKnownPatient = user?.role === "PATIENT" && user.hasCompletedAnamnesis === true;
  const [showPaywall, setShowPaywall] = useState(false);

  // Get active quiz
  const { data: quiz, isLoading: quizLoading } = trpc.quizzes.getActive.useQuery();
  const utils = trpc.useUtils();
  const activatePlanMutation = trpc.subscriptions.activate.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    },
  });

  // Submit response mutation
  const submitMutation = trpc.responses.submitDaily.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setSubmitted(true);
    },
    onError: (error: any) => {
      toast.error(error.message || "Falha ao enviar o questionário");
    },
  });

  if (quizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando questionário...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-green-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Nenhum questionário ativo</h3>
                  <p className="text-amber-800 mb-4">
                    Seu oncologista ainda não ativou um questionário.
                  </p>
                  <Button onClick={() => navigate("/")} variant="outline">
                    Voltar para o painel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isAnswered = answers[currentQuestion?.id] !== undefined;
  const needsAnamnesis = user?.role === "PATIENT" && user.hasCompletedAnamnesis === false;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Responda todas as perguntas antes de enviar");
      return;
    }

    // Paywall: apenas usuários novos/trial sem plano veem o modal
    if (!hasActivePlan && !isKnownPatient) {
      setShowPaywall(true);
      return;
    }

    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      answerValue: answers[q.id],
    }));

    submitMutation.mutate({
      quizId: quiz.id,
      answers: formattedAnswers,
    });
  };

  const canSeeResult = hasActivePlan || isKnownPatient;

  if (submitted && result) {
    const recommendation: string = result.recommendedExerciseType || "";
    const recommendationLower = recommendation.toLowerCase();
    const isRest = recommendationLower.includes("recuperação");
    const isAdapt = recommendationLower.includes("adaptado");
    const title = isRest ? "Recuperação" : isAdapt ? "Exercício adaptado" : "Exercício liberado";
    const description = isRest
      ? "Hoje o melhor cuidado é respeitar seu corpo. O movimento de hoje é descanso ativo e respiração."
      : isAdapt
      ? "Hoje seu corpo pede cuidado. O movimento de hoje será leve, respeitando seu momento."
      : "Hoje seu corpo permite movimento com segurança. Preparamos um exercício adequado para você hoje.";
    const ctaLabel = isRest ? "Cuidar de mim hoje" : isAdapt ? "Fazer exercício adaptado" : "Começar exercício do dia";

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">
          {/* Medical Disclaimer */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  <strong>Importante:</strong> Esta recomendação é baseada nas suas respostas e não
                  substitui as orientações do seu oncologista.
                </p>
              </div>
            </CardContent>
          </Card>

          {canSeeResult ? (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {isRest ? <div className="text-6xl">🌿</div> : isAdapt ? <div className="text-6xl">🪴</div> : <div className="text-6xl">💪</div>}
                </div>
                <CardTitle className="text-3xl">{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-pink-50 rounded-lg p-6">
                  <p className="text-sm text-gray-600 mb-2">Atividade recomendada</p>
                  <p className="text-2xl font-bold text-pink-600">{recommendation}</p>
                  <p className="text-sm text-gray-700 mt-2">{description}</p>
                </div>

                <Button
                  onClick={() =>
                    window.open(
                      "https://www.youtube.com/playlist?list=PL3U7uv4DxYI1xHPCAzbFiV9RysgdWP_vK",
                      "_blank"
                    )
                  }
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white py-6 text-lg font-semibold"
                >
                  {ctaLabel}
                </Button>

                <Button onClick={() => navigate("/dashboard")} variant="outline" className="w-full py-6 text-lg">
                  Voltar para o painel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl text-pink-600">Desbloqueie seu resultado</CardTitle>
                <CardDescription>
                  Veja o semáforo do dia e recomendações seguras ativando um plano.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 text-sm text-gray-800 space-y-2">
                  <p>Seu check-in foi registrado.</p>
                  <p>Assine para visualizar o semáforo, a atividade recomendada e salvar seu progresso.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    disabled={activatePlanMutation.isPending}
                    onClick={() => activatePlanMutation.mutate()}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    {activatePlanMutation.isPending ? "Ativando..." : "Assinar e ver resultado"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-pink-200 text-pink-700"
                    onClick={() => navigate("/auth")}
                  >
                    Já tenho conta/plano
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {needsAnamnesis && (
          <Card className="border-pink-200 bg-pink-50">
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm text-pink-800">
                Complete sua anamnese clínica para personalizar o algoritmo e liberar o check-in diário.
              </p>
              <Button
                className="bg-pink-500 hover:bg-pink-600 text-white"
                onClick={() => navigate("/anamnese")}
              >
                Fazer anamnese agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Medical Disclaimer */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                <strong>Importante:</strong> Esta avaliação ajuda a personalizar recomendações de
                exercícios. Sempre siga as orientações do seu oncologista.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-900">
              Questão {currentQuestionIndex + 1} de {questions.length}
            </span>
            <span className="text-gray-600">
              {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-pink-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{currentQuestion?.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion?.questionType === "YES_NO" && (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAnswer("YES")}
                  variant={answers[currentQuestion.id] === "YES" ? "default" : "outline"}
                  className="flex-1 py-6 text-lg"
                  disabled={needsAnamnesis}
                >
                  Sim
                </Button>
                <Button
                  onClick={() => handleAnswer("NO")}
                  variant={answers[currentQuestion.id] === "NO" ? "default" : "outline"}
                  className="flex-1 py-6 text-lg"
                  disabled={needsAnamnesis}
                >
                  Não
                </Button>
              </div>
            )}

            {currentQuestion?.questionType === "SCALE_0_10" && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>0 (Baixo)</span>
                  <span>10 (Alto)</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 11 }, (_, i) => i).map((num) => (
                    <Button
                      key={num}
                      onClick={() => handleAnswer(num.toString())}
                      variant={
                        answers[currentQuestion.id] === num.toString()
                          ? "default"
                          : "outline"
                      }
                      className="py-6 text-lg font-semibold"
                      disabled={needsAnamnesis}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {currentQuestion?.questionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                {currentQuestion?.options?.map((option) => (
                  <Button
                    key={option.id}
                    onClick={() => handleAnswer(option.scoreValue)}
                          variant={
                            answers[currentQuestion.id] === option.scoreValue
                              ? "default"
                              : "outline"
                          }
                          className="w-full justify-start py-6 text-lg"
                          disabled={needsAnamnesis}
                        >
                          {answers[currentQuestion.id] === option.scoreValue && (
                            <CheckCircle className="w-5 h-5 mr-2" />
                          )}
                          {option.text}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex-1 py-6"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Anterior
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!isAnswered || submitMutation.isPending || needsAnamnesis}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
            >
              {submitMutation.isPending ? "Enviando..." : "Enviar questionário"}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={!isAnswered || needsAnamnesis}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-6 text-lg font-semibold"
            >
              Próxima
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
      {/* Paywall Modal */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="xl:min-w-[900px] 2xl:min-w-[1100px] w-[98vw] bg-white">
          <DialogHeader className="2xl:min-w-[700px] xl:min-w-[600px]">
            <DialogTitle className="2xl:text-2xl xl:text-md text-pink-600">Desbloqueie seu resultado</DialogTitle>
            <DialogDescription className="2xl:text-base xl:text-sm text-gray-700">
              Para ver o semáforo do dia e recomendações seguras, ative um plano. Você pode testar o fluxo gratuitamente, mas o resultado completo é liberado apenas para assinantes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-3 grid-cols-1">
            {[
              {
                name: "Amostra gratuita",
                price: "R$ 0",
                description: "Teste o quiz e veja o fluxo. Resultado completo apenas para assinantes.",
                action: "Continuar testando",
                highlight: false,
                onClick: () => {
                  setShowPaywall(false);
                  navigate("/em-desenvolvimento");
                },
              },
              {
                name: "Plano Mensal",
                price: "R$ 89/mês",
                description: "Semáforo diário, aulas seguras, histórico e acompanhamento.",
                action: "Assinar mensal",
                highlight: true,
                onClick: () => activatePlanMutation.mutate(),
              },
              {
                name: "Plano Anual",
                price: "R$ 890/ano",
                description: "12 meses com economia e suporte contínuo.",
                action: "Assinar anual",
                highlight: false,
                onClick: () => activatePlanMutation.mutate(),
              },
            ].map((plan, idx) => (
              <Card
                key={idx}
                className={`border ${plan.highlight ? "border-pink-300 shadow-xl" : "border-pink-100"}`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                    {plan.highlight && (
                      <Badge className="bg-pink-100 text-pink-700 border-pink-200">Mais escolhido</Badge>
                    )}
                  </div>
                  <p className="2xl:text-2xl xl:text-md font-bold text-pink-600">{plan.price}</p>
                  <p className="2xl:text-base xl:text-sm text-gray-700 leading-relaxed">{plan.description}</p>
                  <Button
                    disabled={activatePlanMutation.isPending && plan.highlight}
                    onClick={plan.onClick}
                    className={plan.highlight ? "w-full bg-pink-500 hover:bg-pink-600 text-white" : "w-full border-pink-200 text-pink-700"}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.highlight && activatePlanMutation.isPending ? "Ativando..." : plan.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setShowPaywall(false)}>
              Talvez depois
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, CheckCircle, XCircle, ArrowLeft, Calendar, Clock, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HistoryPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: history = [], isLoading } = trpc.responses.getMyHistory.useQuery({ limit: 50 });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  const goodDaysCount = history.filter((r) => r.isGoodDayForExercise).length;
  const totalDays = history.length;

  const getQuestionText = (qId: number, quiz: any) => {
    return quiz?.questions?.find((q: any) => q.id === qId)?.text || "Pergunta removida";
  };

  const getAnswerText = (answer: any, quiz: any) => {
    const question = quiz?.questions?.find((q: any) => q.id === answer.questionId);

    // Try to find matching option first (for Multiple Choice)
    if (question?.options?.length > 0) {
      // Logic assumes answerValue matches scoreValue or we need a way to link back.
      // Often answerValue is stored as the value. 
      // If we can't find exact match, return value.
      const option = question.options.find((opt: any) => opt.scoreValue === answer.answerValue || opt.text === answer.answerValue);
      if (option) return option.text;
    }

    // Default formatting
    if (answer.answerValue === "YES" || answer.answerValue === "true") return "Sim";
    if (answer.answerValue === "NO" || answer.answerValue === "false") return "Não";

    // Scale 0-10 or text
    return answer.answerValue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 p-4 pb-20">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-pink-100 text-pink-700"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Acompanhamento</h1>
            <p className="text-gray-600 text-sm">
              Seu histórico de bem-estar dia a dia.
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="border-pink-100 bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-pink-100 p-2 rounded-full">
                <Calendar className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Registros</p>
                <p className="text-xl font-bold text-gray-900">{totalDays}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-100 bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Dias Bons</p>
                <p className="text-xl font-bold text-gray-900">{goodDaysCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum registro ainda</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              Seus check-ins diários aparecerão aqui. Complete o de hoje para começar!
            </p>
            <Button
              onClick={() => navigate("/quiz")}
              className="mt-6 bg-pink-500 hover:bg-pink-600 text-white rounded-full px-8"
            >
              Fazer Check-in de Hoje
            </Button>
          </div>
        ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {history.map((response: any) => {
                const date = new Date(response.responseDate);
                const isGood = response.isGoodDayForExercise;

                return (
                  <AccordionItem
                    key={response.id}
                    value={response.id.toString()}
                    className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden px-0"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline [&[data-state=open]]:bg-gray-50">
                      <div className="flex items-center gap-4 w-full text-left">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isGood ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                          {isGood ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                          <Clock className="w-5 h-5 text-gray-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900 truncate">
                            {format(date, "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isGood ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                            Score: {Math.round(parseFloat(response.totalScore))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{format(date, "HH:mm")}</span>
                          <span className="text-gray-300">•</span>
                          <span className="truncate max-w-[150px]">{response.recommendedExerciseType}</span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pt-2 pb-4 bg-gray-50/50 border-t border-gray-100">
                    <div className="space-y-4 mt-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Respostas Detalhadas</h4>

                      {response.answers && response.answers.length > 0 ? (
                        <ul className="space-y-3">
                          {response.answers.map((answer: any) => (
                            <li key={answer.id} className="text-sm">
                              <p className="font-medium text-gray-700 mb-1">
                                {getQuestionText(answer.questionId, response.quiz)}
                              </p>
                              <div className="bg-white p-2.5 rounded-lg border border-gray-100 text-gray-600 shadow-sm inline-block min-w-[50%]">
                                {getAnswerText(answer, response.quiz)}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Detalhes não disponíveis para este registro.</p>
                      )}

                      {response.generalObservations && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Observações</p>
                          <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100">
                            {response.generalObservations}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
            </Accordion>
        )}
      </div>
    </div>
  );
}


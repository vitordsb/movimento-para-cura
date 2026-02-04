import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

export default function IntroQuizPage() {
  const [, navigate] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Fetch Intro Quiz (ID 2)
  const { data: quiz, isLoading } = trpc.quizzes.getById.useQuery({ quizId: 2 });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando avaliação...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return <div>Erro ao carregar avaliação.</div>;
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isAnswered = answers[currentQuestion?.id] !== undefined;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleSubmit = () => {
    // Show Sales Result immediately (Lead Magnet)
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 p-4 flex items-center justify-center">
        <Card className="max-w-2xl w-full border-0 shadow-xl overflow-hidden">
          <div className="bg-pink-600 p-6 text-white text-center">
            <h2 className="text-3xl font-bold mb-2">✨ Obrigada por responder.</h2>
            <p className="opacity-90">Sua avaliação inicial está completa.</p>
          </div>
          <CardContent className="p-8 space-y-6 text-center">
            <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
              <p>
                Com base nas suas respostas, percebemos que ter <strong>clareza, segurança e orientação diária</strong> pode fazer muita diferença para você durante o tratamento.
              </p>
              <p>
                O <strong>Movimento para a Cura</strong> foi criado exatamente para isso:
              </p>
              <p className="font-semibold text-pink-600 text-xl">
                👉 Te dizer o que fazer hoje, sem medo e sem excesso de informação.
              </p>
            </div>

            <div className="pt-6 space-y-3">
              <Button 
                onClick={() => navigate("/auth?plan=monthly")} 
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-6 text-lg shadow-lg hover:shadow-xl transition-all scale-100 hover:scale-[1.02]"
              >
                Conhecer o Movimento para a Cura
              </Button>
              
              {/* Optional Logic: Check if they answered yes to Consult? Answer key 'CONSULT_YES' is in Question 15 */}
              {Object.values(answers).some(val => val === "CONSULT_YES") && (
                 <Button 
                   onClick={() => window.open("https://wa.me/5548999999999?text=Tenho%20interesse%20na%20consultoria", "_blank")}
                   variant="outline" 
                   className="w-full border-pink-200 text-pink-700"
                 >
                   Quero saber sobre acompanhamento individual
                 </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Avaliação Inicial</span>
                <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
            </div>
        </div>

        <Card className="border-0 shadow-lg min-h-[400px] flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-2xl leading-tight text-gray-900">{currentQuestion?.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion?.questionType === "YES_NO" && (
                <div className="flex gap-3">
                    <Button onClick={() => handleAnswer("YES")} variant={answers[currentQuestion.id] === "YES" ? "default" : "outline"} className="flex-1 py-6 text-lg">Sim</Button>
                    <Button onClick={() => handleAnswer("NO")} variant={answers[currentQuestion.id] === "NO" ? "default" : "outline"} className="flex-1 py-6 text-lg">Não</Button>
                </div>
            )}
            
            {currentQuestion?.questionType === "MULTIPLE_CHOICE" && (
                <div className="space-y-2">
                    {currentQuestion?.options?.map((option) => (
                        <Button
                            key={option.id}
                            onClick={() => handleAnswer(option.scoreValue || option.text)} // Fallback if scoreValue empty, though seed sets generic strings
                            variant={answers[currentQuestion.id] === (option.scoreValue || option.text) ? "default" : "outline"}
                            className="w-full justify-start py-4 text-left px-4 h-auto whitespace-normal"
                        >
                             {answers[currentQuestion.id] === (option.scoreValue || option.text) && <CheckCircle className="w-5 h-5 mr-3 shrink-0 text-white" />}
                             <span className="flex-1">{option.text}</span>
                        </Button>
                    ))}
                </div>
            )}
          </CardContent>
          <div className="p-6 pt-0 flex justify-between gap-4 mt-auto">
             <Button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                variant="ghost"
                className="text-gray-500"
             >
                <ChevronLeft className="w-5 h-5 mr-1" /> Anterior
             </Button>

             {isLastQuestion ? (
                 <Button 
                    onClick={handleSubmit} 
                    disabled={!isAnswered}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-8"
                 >
                    Ver meu resultado
                 </Button>
             ) : (
                 <Button 
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)} 
                    disabled={!isAnswered}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-8"
                 >
                    Próxima <ChevronRight className="w-5 h-5 ml-1" />
                 </Button>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
}

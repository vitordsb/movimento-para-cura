import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";

type AnamnesisQuestion = {
  id: number;
  text: string;
  options: string[];
};

export default function AnamnesisPage() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const questions: AnamnesisQuestion[] = useMemo(
    () => [
      {
        id: 1,
        text: "Seu médico ou equipe de saúde já comentou que o exercício físico pode fazer parte do seu tratamento?",
        options: ["Sim, foi orientado", "Não comentou, mas não proibiu", "Já ouvi opiniões diferentes", "Não, nunca falaram sobre isso"],
      },
      {
        id: 2,
        text: "Em que fase do tratamento você está agora?",
        options: [
          "Antes de iniciar quimioterapia ou radioterapia",
          "Em quimioterapia",
          "Em radioterapia",
          "Em hormonioterapia",
          "Em pós-cirúrgico",
          "Em acompanhamento / remissão",
        ],
      },
      {
        id: 3,
        text: "Você realizou alguma cirurgia relacionada ao câncer recentemente?",
        options: ["Não", "Sim, há menos de 30 dias", "Sim, entre 1 e 3 meses", "Sim, há mais de 3 meses"],
      },
      {
        id: 4,
        text: "Você possui alguma restrição médica atual para esforços físicos?",
        options: ["Não", "Sim, restrições leves", "Sim, restrições importantes", "Não sei informar"],
      },
      {
        id: 5,
        text: "Hoje, o que mais te impede ou te dá medo de se movimentar?",
        options: [
          "Medo de piorar meu estado de saúde",
          "Cansaço excessivo",
          "Dor",
          "Enjoo / mal-estar",
          "Falta de orientação clara",
          "Insegurança sobre o que é permitido",
          "Já tentei antes e não me senti bem",
        ],
      },
      {
        id: 6,
        text: "Você sente algum desses sintomas com frequência?",
        options: ["Fadiga", "Dor", "Enjoo", "Falta de ar", "Tontura", "Fraqueza", "Inchaço", "Nenhum desses"],
      },
      {
        id: 7,
        text: "Como você se sente fisicamente hoje?",
        options: ["Me sinto bem e com energia", "Me sinto mais cansada(o) que o normal", "Me sinto fraca(o)", "Me sinto muito debilitada(o)"],
      },
      {
        id: 8,
        text: "Antes do diagnóstico, você tinha o hábito de se exercitar?",
        options: ["Sim, regularmente", "Às vezes", "Raramente", "Nunca"],
      },
      {
        id: 9,
        text: "Depois do diagnóstico, você tentou se exercitar em algum momento?",
        options: ["Sim, e me senti bem", "Sim, mas fiquei insegura(o)", "Sim, mas tive sintomas ruins", "Não tentei por medo", "Não tentei por falta de orientação"],
      },
      {
        id: 10,
        text: "Você sente que hoje está mais sedentária(o) do que gostaria?",
        options: ["Sim", "Não", "Às vezes"],
      },
      {
        id: 11,
        text: "O que você mais gostaria de ter neste momento?",
        options: [
          "Alguém dizendo claramente se posso me exercitar hoje",
          "Um treino seguro, curto e adaptado ao meu dia",
          "Orientação para saber quando descansar sem culpa",
          "Mais confiança no meu corpo",
          "Todas as alternativas acima",
        ],
      },
      {
        id: 12,
        text: "Se existisse um sistema que avalia como você está hoje e te orienta se é dia de treinar, adaptar ou descansar, isso ajudaria você?",
        options: ["Sim, muito", "Sim, um pouco", "Talvez", "Não"],
      },
      {
        id: 13,
        text: "Qual frase mais representa você hoje?",
        options: [
          "“Tenho medo de fazer algo errado.”",
          "“Quero me cuidar, mas não sei por onde começar.”",
          "“Estou cansada(o) de tanta informação confusa.”",
          "“Quero fazer o melhor pelo meu corpo, com segurança.”",
        ],
      },
      {
        id: 14,
        text: "Você acredita que o exercício físico pode ajudar no seu tratamento e na sua qualidade de vida, se feito da forma certa?",
        options: ["Sim", "Talvez", "Nunca pensei nisso"],
      },
      {
        id: 15,
        text: "Você gostaria de ter um acompanhamento individual com uma profissional especializada para analisar seu caso, seus sintomas e te orientar de forma personalizada?",
        options: ["Sim, gostaria de saber mais", "Talvez, dependendo do formato", "No momento, prefiro apenas o aplicativo", "Não"],
      },
    ],
    []
  );

  const [answers, setAnswers] = useState<Record<number, string>>({});

  const utils = trpc.useUtils();
  const completeMutation = trpc.patients.completeAnamnesis.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Anamnese registrada! Agora você pode acessar o quiz diário.");
      navigate("/dashboard");
    },
    onError: err => {
      toast.error(err.message || "Falha ao salvar anamnese");
    },
  });

  if (loading || !user) return null;
  if (user.role !== "PATIENT") return null;

  const handleAnswer = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = () => {
    const missing = questions.find((q) => !answers[q.id]);
    if (missing) {
      toast.error("Responda todas as perguntas da anamnese");
      return;
    }

    const treatmentStage = answers[2];
    const interest = answers[15];

    completeMutation.mutate({
      answers: questions.map((q) => ({
        questionNumber: q.id,
        questionText: q.text,
        answer: answers[q.id],
      })),
      treatmentStage,
      interest,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50">
      <AppHeader />
      <main className="px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-pink-600">Anamnese inicial (15 perguntas)</CardTitle>
              <p className="text-gray-700 text-sm">Use as respostas para definir o perfil de segurança e o check-in diário.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question) => (
                <div key={question.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-sm font-semibold">
                      {question.id}
                    </span>
                    <p className="font-semibold text-gray-900">{question.text}</p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {question.options.map((option) => (
                      <Button
                        key={option}
                        onClick={() => handleAnswer(question.id, option)}
                        variant={answers[question.id] === option ? "default" : "outline"}
                        className={`justify-start text-left ${answers[question.id] === option ? "bg-pink-500 hover:bg-pink-600 text-white" : "border-pink-200 text-gray-800"}`}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                onClick={handleSubmit}
                disabled={completeMutation.isPending}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white"
              >
                {completeMutation.isPending ? "Salvando..." : "Concluir anamnese"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

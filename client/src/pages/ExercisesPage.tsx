import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

const intensityColors: Record<string, string> = {
  LIGHT: "bg-green-50 border-green-200",
  MODERATE: "bg-pink-50 border-pink-200",
  STRONG: "bg-orange-50 border-orange-200",
};

const intensityBadges: Record<string, string> = {
  LIGHT: "bg-green-100 text-green-700",
  MODERATE: "bg-pink-100 text-pink-700",
  STRONG: "bg-orange-100 text-orange-700",
};

const intensityIcons: Record<string, string> = {
  LIGHT: "🌿",
  MODERATE: "💪",
  STRONG: "🔥",
};

const intensityLabels: Record<string, string> = {
  LIGHT: "Leve",
  MODERATE: "Moderada",
  STRONG: "Intensa",
};

const translationMap: Record<
  string,
  Partial<{
    name: string;
    description: string | null;
    safetyGuidelines: string | null;
  }>
> = {
  "Light Walking": {
    name: "Caminhada leve",
    description: "Caminhada confortável por 15-20 minutos para dias de baixa energia.",
    safetyGuidelines: "Hidrate-se e pare se sentir tontura ou falta de ar.",
  },
  "Gentle Stretching": {
    name: "Alongamentos suaves",
    description: "Sequência de alongamentos básicos para reduzir rigidez e melhorar mobilidade.",
    safetyGuidelines: "Evite forçar ou balançar; mantenha cada posição por 20-30 segundos.",
  },
  "Moderate Cardio": {
    name: "Cardio moderado",
    description:
      "Caminhada acelerada ou pedal leve por 20-30 minutos, mantendo fala confortável.",
    safetyGuidelines: "Monitore a respiração; mantenha ritmo em que é possível conversar.",
  },
  "Light Strength Training": {
    name: "Força leve",
    description:
      "Exercícios com peso do próprio corpo ou elásticos para manter tônus muscular.",
    safetyGuidelines: "Priorize técnica; pause se houver dor ou desconforto.",
  },
  "Active Rest": {
    name: "Descanso ativo",
    description: "Movimentos leves como caminhada curta ou tai chi em dias de recuperação.",
    safetyGuidelines: "Foque em relaxamento e ritmo confortável.",
  },
};

export default function ExercisesPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedIntensity, setSelectedIntensity] = useState<string | null>(null);

  const { data: allExercises = [], isLoading } = trpc.exercises.list.useQuery();

  const translatedExercises = allExercises.map(exercise => ({
    ...exercise,
    ...translationMap[exercise.name as keyof typeof translationMap],
  }));

  const filteredExercises = selectedIntensity
    ? translatedExercises.filter((e) => e.intensityLevel === selectedIntensity)
    : translatedExercises;

  if (user?.role === "PATIENT" && user.hasCompletedAnamnesis === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-green-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-pink-200 bg-pink-50">
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm text-pink-800">
                Complete sua anamnese clínica para liberar os treinos seguros e recomendações.
              </p>
              <Button className="bg-pink-500 hover:bg-pink-600 text-white" onClick={() => navigate("/anamnese")}>
                Fazer anamnese agora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando exercícios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Biblioteca de exercícios</h1>
            <p className="text-gray-600">Tutoriais e orientações para exercícios seguros</p>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                <strong>Importante:</strong> Sempre consulte seu oncologista antes de iniciar qualquer
                exercício. Pare imediatamente se sentir dor, tontura ou falta de ar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Intensity Filter */}
        <div className="space-y-3">
          <p className="font-semibold text-gray-900">Filtrar por intensidade</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedIntensity(null)}
              variant={selectedIntensity === null ? "default" : "outline"}
              className="rounded-full"
            >
              Todos os exercícios
            </Button>
            {["LIGHT", "MODERATE", "STRONG"].map((intensity) => (
              <Button
                key={intensity}
                onClick={() => setSelectedIntensity(intensity)}
                variant={selectedIntensity === intensity ? "default" : "outline"}
                className="rounded-full"
              >
                {intensityIcons[intensity]} {intensityLabels[intensity]}
              </Button>
            ))}
          </div>
        </div>

        {/* Exercises List */}
        {filteredExercises.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">Nenhum exercício para este nível de intensidade.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className={`border-2 shadow-md hover:shadow-lg transition-shadow ${
                  intensityColors[exercise.intensityLevel]
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">
                          {intensityIcons[exercise.intensityLevel]}
                        </span>
                        {exercise.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            intensityBadges[exercise.intensityLevel]
                          }`}
                        >
                          {intensityLabels[exercise.intensityLevel] ?? exercise.intensityLevel}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exercise.description && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Descrição</p>
                      <p className="text-gray-700">{exercise.description}</p>
                    </div>
                  )}

                  {exercise.safetyGuidelines && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Orientações de segurança
                      </p>
                      <p className="text-gray-700 text-sm">{exercise.safetyGuidelines}</p>
                    </div>
                  )}

                  {exercise.videoLink && (
                    <div>
                      <a
                        href={exercise.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-semibold"
                      >
                        <span>Ver tutorial</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

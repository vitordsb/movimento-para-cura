import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";

export default function AnamnesisPage() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const [age, setAge] = useState<number | undefined>();
  const [mainDiagnosis, setMainDiagnosis] = useState("");
  const [cancerType, setCancerType] = useState("");
  const [metastasis, setMetastasis] = useState("");
  const [metastasisLocation, setMetastasisLocation] = useState("");
  const [chemotherapy, setChemotherapy] = useState<boolean | null>(null);
  const [radiotherapy, setRadiotherapy] = useState<boolean | null>(null);
  const [hormoneTherapy, setHormoneTherapy] = useState<boolean | null>(null);
  const [surgery, setSurgery] = useState("");
  const [surgeryWhen, setSurgeryWhen] = useState("");
  const [painScore, setPainScore] = useState<number | undefined>();
  const [fatiguePerceived, setFatiguePerceived] = useState("");
  const [neuropathy, setNeuropathy] = useState<boolean | null>(null);
  const [lymphedema, setLymphedema] = useState<boolean | null>(null);
  const [dizziness, setDizziness] = useState<boolean | null>(null);
  const [fractureHistory, setFractureHistory] = useState<boolean | null>(null);
  const [thrombosisHistory, setThrombosisHistory] = useState<boolean | null>(null);
  const [canStandUp, setCanStandUp] = useState<boolean | null>(null);
  const [canWalk10Min, setCanWalk10Min] = useState<boolean | null>(null);
  const [exercisedBefore, setExercisedBefore] = useState<boolean | null>(null);
  const [fearOrTrauma, setFearOrTrauma] = useState("");
  const [treatmentPhase, setTreatmentPhase] = useState("");
  const [treatmentStage, setTreatmentStage] = useState("");
  const [observations, setObservations] = useState("");

  const completeMutation = trpc.patients.completeAnamnesis.useMutation({
    onSuccess: () => {
      toast.success("Anamnese registrada! Agora você pode acessar o quiz diário.");
      navigate("/dashboard");
    },
    onError: err => {
      toast.error(err.message || "Falha ao salvar anamnese");
    },
  });

  if (loading || !user) return null;
  if (user.role !== "PATIENT") return null;

  const handleSubmit = () => {
    if (!mainDiagnosis) {
      toast.error("Preencha o diagnóstico principal");
      return;
    }
    completeMutation.mutate({
      age,
      mainDiagnosis,
      cancerType,
      treatmentStage,
      metastasis,
      metastasisLocation,
      chemotherapy: chemotherapy ?? undefined,
      radiotherapy: radiotherapy ?? undefined,
      hormoneTherapy: hormoneTherapy ?? undefined,
      surgery,
      surgeryWhen,
      painScore,
      fatiguePerceived,
      neuropathy: neuropathy ?? undefined,
      lymphedema: lymphedema ?? undefined,
      dizziness: dizziness ?? undefined,
      fractureHistory: fractureHistory ?? undefined,
      thrombosisHistory: thrombosisHistory ?? undefined,
      canStandUp: canStandUp ?? undefined,
      canWalk10Min: canWalk10Min ?? undefined,
      exercisedBefore: exercisedBefore ?? undefined,
      fearOrTrauma,
      treatmentPhase,
      observations,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50">
      <AppHeader />
      <main className="px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-pink-600">Anamnese clínica</CardTitle>
              <p className="text-gray-700 text-sm">
                Preencha uma única vez para personalizar o algoritmo e os treinos seguros.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Idade"
                  value={age ?? ""}
                  onChange={e => setAge(Number(e.target.value) || undefined)}
                />
                <Input
                  placeholder="Diagnóstico principal"
                  value={mainDiagnosis}
                  onChange={e => setMainDiagnosis(e.target.value)}
                />
                <Input
                  placeholder="Tipo de câncer"
                  value={cancerType}
                  onChange={e => setCancerType(e.target.value)}
                />
                <Input
                  placeholder="Fase do tratamento (pré-quimio, quimio ativa, radio, hormônio, pós-cirurgia, vigilância)"
                  value={treatmentPhase}
                  onChange={e => setTreatmentPhase(e.target.value)}
                />
                <Input
                  placeholder="Metástase (sim/não/não sabe)"
                  value={metastasis}
                  onChange={e => setMetastasis(e.target.value)}
                />
                <Input
                  placeholder="Local da metástase (óssea, visceral, não sabe)"
                  value={metastasisLocation}
                  onChange={e => setMetastasisLocation(e.target.value)}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Cirurgia (qual)"
                  value={surgery}
                  onChange={e => setSurgery(e.target.value)}
                />
                <Input
                  placeholder="Quando foi a cirurgia?"
                  value={surgeryWhen}
                  onChange={e => setSurgeryWhen(e.target.value)}
                />
                <Input
                  placeholder="Dor atual (0 a 10)"
                  value={painScore ?? ""}
                  onChange={e => setPainScore(Number(e.target.value) || undefined)}
                />
                <Input
                  placeholder="Fadiga percebida"
                  value={fatiguePerceived}
                  onChange={e => setFatiguePerceived(e.target.value)}
                />
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  placeholder="Quimioterapia (sim/não)"
                  value={chemotherapy === null ? "" : chemotherapy ? "sim" : "não"}
                  onChange={e => setChemotherapy(e.target.value.toLowerCase() === "sim")}
                />
                <Input
                  placeholder="Radioterapia (sim/não)"
                  value={radiotherapy === null ? "" : radiotherapy ? "sim" : "não"}
                  onChange={e => setRadiotherapy(e.target.value.toLowerCase() === "sim")}
                />
                <Input
                  placeholder="Hormonioterapia (sim/não)"
                  value={hormoneTherapy === null ? "" : hormoneTherapy ? "sim" : "não"}
                  onChange={e => setHormoneTherapy(e.target.value.toLowerCase() === "sim")}
                />
                <Input
                  placeholder="Neuropatia (sim/não)"
                  value={neuropathy === null ? "" : neuropathy ? "sim" : "não"}
                  onChange={e => setNeuropathy(e.target.value.toLowerCase() === "sim")}
                />
                <Input
                  placeholder="Linfedema (sim/não)"
                  value={lymphedema === null ? "" : lymphedema ? "sim" : "não"}
                  onChange={e => setLymphedema(e.target.value.toLowerCase() === "sim")}
                />
                <Input
                  placeholder="Tontura frequente (sim/não)"
                  value={dizziness === null ? "" : dizziness ? "sim" : "não"}
                  onChange={e => setDizziness(e.target.value.toLowerCase() === "sim")}
                />
                <Input
                  placeholder="Histórico de fratura (sim/não)"
                  value={fractureHistory === null ? "" : fractureHistory ? "sim" : "não"}
                  onChange={e => setFractureHistory(e.target.value.toLowerCase() === "sim")}
                />
                <Input
                  placeholder="Histórico de trombose (sim/não)"
                  value={thrombosisHistory === null ? "" : thrombosisHistory ? "sim" : "não"}
                  onChange={e => setThrombosisHistory(e.target.value.toLowerCase() === "sim")}
                />
                <Input
                  placeholder="Levanta da cadeira sem apoio? (sim/não)"
                  value={canStandUp === null ? "" : canStandUp ? "sim" : "não"}
                  onChange={e => setCanStandUp(e.target.value.toLowerCase() === "sim")}
                />
                <Input
                  placeholder="Caminha 5–10 minutos? (sim/não)"
                  value={canWalk10Min === null ? "" : canWalk10Min ? "sim" : "não"}
                  onChange={e => setCanWalk10Min(e.target.value.toLowerCase() === "sim")}
                />
                <Input
                  placeholder="Fazia exercício antes do diagnóstico? (sim/não)"
                  value={exercisedBefore === null ? "" : exercisedBefore ? "sim" : "não"}
                  onChange={e => setExercisedBefore(e.target.value.toLowerCase() === "sim")}
                />
              </div>

              <Textarea
                placeholder="Medo/trauma/insegurança com exercício"
                value={fearOrTrauma}
                onChange={e => setFearOrTrauma(e.target.value)}
              />

              <Textarea
                placeholder="Observações adicionais"
                value={observations}
                onChange={e => setObservations(e.target.value)}
              />
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

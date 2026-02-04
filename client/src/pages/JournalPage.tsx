import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ArrowLeft, History, FileText, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const COMMON_SYMPTOMS = [
  "Enjoo / Náusea",
  "Dor de Cabeça",
  "Cansaço Extremo",
  "Tontura",
  "Febre",
  "Formigamento",
  "Insônia",
  "Ansiedade",
  "Falta de Ar",
  "Outro",
];

export default function JournalPage() {
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [selectedSymptom, setSelectedSymptom] = useState<string>("");
  const [intensity, setIntensity] = useState<number>(5);
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: symptoms = [], isLoading } = trpc.health.getSymptoms.useQuery({ limit: 50 });

  const logMutation = trpc.health.logSymptom.useMutation({
    onSuccess: () => {
      utils.health.getSymptoms.invalidate();
      setIsDialogOpen(false);
      // Reset form
      setSelectedSymptom("");
      setIntensity(5);
      setNotes("");
    },
  });

  const handleSubmit = () => {
    if (!selectedSymptom) return;
    logMutation.mutate({
      symptom: selectedSymptom,
      intensity: intensity,
      notes: notes,
    });
  };

  const getIntensityColor = (val: number) => {
    if (val <= 3) return "bg-green-100 text-green-700 border-green-200";
    if (val <= 7) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-purple-100 text-purple-700"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diário de Sintomas</h1>
            <p className="text-gray-600 text-sm">
              Registre o que você sente para seu médico.
            </p>
          </div>
        </div>

        {/* Add Button Area */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 text-center">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Como você está agora?</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Registrar sintomas ajuda a identificar padrões e melhora seu tratamento.
          </p>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-purple-200 w-full sm:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Registrar Sintoma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Sintoma</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">O que você sente?</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SYMPTOMS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSymptom(s)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                          selectedSymptom === s
                            ? "bg-purple-600 text-white border-purple-600 shadow-md transform scale-105"
                            : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <label className="text-sm font-medium text-gray-700">Intensidade (0-10)</label>
                     <span className={`text-sm font-bold px-2 py-0.5 rounded ${getIntensityColor(intensity)}`}>
                       {intensity}
                     </span>
                   </div>
                   <Slider 
                     value={[intensity]} 
                     onValueChange={(vals) => setIntensity(vals[0])} 
                     max={10} 
                     step={1} 
                     className="py-4"
                   />
                   <div className="flex justify-between text-xs text-gray-400 px-1">
                     <span>Leve</span>
                     <span>Moderado</span>
                     <span>Intenso</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">Observações (opcional)</label>
                   <Textarea 
                     placeholder="Detalhes extras, horário específico, o que estava fazendo..."
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     className="resize-none"
                   />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={!selectedSymptom || logMutation.isPending} className="w-full bg-purple-600 hover:bg-purple-700">
                  {logMutation.isPending ? "Salvando..." : "Salvar Registro"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            Registros Recentes
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : symptoms.length === 0 ? (
            <div className="text-center py-8 text-gray-500 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Nenhum sintoma registrado recentemente.
            </div>
          ) : (
            <div className="grid gap-3">
              {symptoms.map((log: any) => (
                <Card key={log.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`w-2 h-full absolute left-0 top-0 bottom-0 rounded-l-xl ${
                       log.intensity <= 3 ? "bg-green-400" : log.intensity <= 7 ? "bg-yellow-400" : "bg-red-500"
                    }`}></div>
                    
                    <div className="flex-1 pl-2">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-gray-900">{log.symptom}</p>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.occurredAt), "dd/MM 'às' HH:mm")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <span className="text-gray-600">Intensidade:</span>
                        <div className="flex gap-0.5">
                          {[...Array(10)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-1.5 h-3 rounded-full ${i < log.intensity 
                                ? (log.intensity <= 3 ? "bg-green-400" : log.intensity <= 7 ? "bg-yellow-400" : "bg-red-500") 
                                : "bg-gray-100"}`}
                            />
                          ))}
                        </div>
                      </div>

                      {log.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Droplet, Plus, Settings2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function HydrationWidget() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<string>("2000");

  const utils = trpc.useUtils();
  const { data: hydration, isLoading } = trpc.health.getHydration.useQuery();
  
  const addWater = trpc.health.addWater.useMutation({
    onMutate: async ({ amountMl }) => {
      await utils.health.getHydration.cancel();
      const prevData = utils.health.getHydration.getData();
      
      if (prevData) {
        utils.health.getHydration.setData(undefined, {
          ...prevData,
          currentIntakeMl: prevData.currentIntakeMl + amountMl,
        });
      }
      return { prevData };
    },
    onError: (err, newInput, context) => {
      if (context?.prevData) {
        utils.health.getHydration.setData(undefined, context.prevData);
      }
    },
    onSettled: () => {
      utils.health.getHydration.invalidate();
    },
  });

  const updateGoal = trpc.health.updateGoal.useMutation({
    onSuccess: () => {
      utils.health.getHydration.invalidate();
      setIsDialogOpen(false);
      toast.success("Meta atualizada!");
    },
    onError: (err) => {
      toast.error("Erro ao atualizar meta: " + err.message);
    }
  });

  if (isLoading) return <div className="h-32 bg-blue-50/50 rounded-xl animate-pulse"></div>;

  const current = hydration?.currentIntakeMl || 0;
  const goal = hydration?.dailyGoalMl || 2000;
  const percentage = Math.min((current / goal) * 100, 100);

  const handleUpdateGoal = () => {
    const val = parseInt(newGoal);
    if (isNaN(val) || val < 500 || val > 5000) {
      toast.error("A meta deve ser entre 500ml e 5000ml");
      return;
    }
    updateGoal.mutate({ goalMl: val });
  };

  return (
    <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <Droplet className="w-5 h-5 text-blue-500" fill="currentColor" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Hidratação</p>

              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (open) setNewGoal(goal.toString());
                setIsDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <button className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    Meta: {goal / 1000}L <Settings2 className="w-3 h-3" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>Definir Meta Diária</DialogTitle>
                  </DialogHeader>
                  <div className="py-2 space-y-4">
                    <p className="text-sm text-gray-600">
                      Quanto de água você quer beber por dia? (em ml)
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        className="text-lg"
                      />
                      <span className="text-gray-500 text-sm">ml</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleUpdateGoal} disabled={updateGoal.isPending} className="w-full bg-blue-600 hover:bg-blue-700">
                      Salvar Meta
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {current < 1000 ? current : (current/1000).toFixed(1).replace('.', ',')}
            <span className="text-sm font-normal text-gray-500">{current < 1000 ? 'ml' : 'L'}</span>
          </p>
        </div>

        <Progress value={percentage} className="h-3 bg-blue-100 mb-4 [&>div]:bg-blue-500" />

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            onClick={() => addWater.mutate({ amountMl: 250 })}
            disabled={addWater.isPending}
          >
            <Plus className="w-4 h-4 mr-1" /> 250ml
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            onClick={() => addWater.mutate({ amountMl: 500 })}
            disabled={addWater.isPending}
          >
            <Plus className="w-4 h-4 mr-1" /> 500ml
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (open) setNewGoal(goal.toString());
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs text-blue-600 hover:bg-blue-50 h-8">
              <Settings2 className="w-3 h-3 mr-2" />
              Alterar meta diária ({goal}ml)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>Definir Meta Diária</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <p className="text-sm text-gray-600">
                Quanto de água você quer beber por dia? (em ml)
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="text-lg"
                />
                <span className="text-gray-500 text-sm">ml</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateGoal} disabled={updateGoal.isPending} className="w-full bg-blue-600 hover:bg-blue-700">
                Salvar Meta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

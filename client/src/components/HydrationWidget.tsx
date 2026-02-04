import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Droplet, Plus, Minus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function HydrationWidget() {
  const utils = trpc.useUtils();
  const { data: hydration, isLoading } = trpc.health.getHydration.useQuery();
  
  const addWater = trpc.health.addWater.useMutation({
    onMutate: async ({ amountMl }) => {
      // Optimistic Update
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

  if (isLoading) return <div className="h-32 bg-blue-50/50 rounded-xl animate-pulse"></div>;

  const current = hydration?.currentIntakeMl || 0;
  const goal = hydration?.dailyGoalMl || 2000;
  const percentage = Math.min((current / goal) * 100, 100);

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
              <p className="text-sm text-gray-500">Meta: {goal / 1000}L</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {current < 1000 ? current : (current/1000).toFixed(1).replace('.', ',')}
            <span className="text-sm font-normal text-gray-500">{current < 1000 ? 'ml' : 'L'}</span>
          </p>
        </div>

        <Progress value={percentage} className="h-3 bg-blue-100 mb-4 [&>div]:bg-blue-500" />

        <div className="grid grid-cols-2 gap-2">
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
      </CardContent>
    </Card>
  );
}

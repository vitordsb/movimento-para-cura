import { useState, useEffect } from "react";
import { X, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SOSAnxiety({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [timeLeft, setTimeLeft] = useState(4); // 4-7-8 breathing technique (simplified to 4-4-4 for beginners or 4-2-6)
  
  // Let's use 4-4-6 pattern commonly used for panic/anxiety
  // Inhale: 4s
  // Hold: 4s
  // Exhale: 6s
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (phase === "inhale") {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      } else {
        setPhase("hold");
        setTimeLeft(4);
        // Haptic check
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
      }
    } else if (phase === "hold") {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      } else {
        setPhase("exhale");
        setTimeLeft(6);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
      }
    } else if (phase === "exhale") {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      } else {
        setPhase("inhale");
        setTimeLeft(4);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
      }
    }

    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 transition-all duration-500 backdrop-blur-sm">
      <Button 
        onClick={onClose}
        variant="ghost" 
        className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 rounded-full h-12 w-12"
      >
        <X className="w-8 h-8" />
      </Button>

      {/* Visual Circle */}
      <div className="relative mb-12">
        {/* Animated Rings */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-500/30 transition-all duration-[4000ms] ease-in-out
          ${phase === "inhale" ? "w-80 h-80 opacity-100" : phase === "hold" ? "w-80 h-80 opacity-100" : "w-32 h-32 opacity-30"}
        `}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-xl transition-all duration-[4000ms] ease-in-out
          ${phase === "inhale" ? "w-72 h-72" : phase === "hold" ? "w-72 h-72" : "w-20 h-20"}
        `}></div>

        {/* Center Text */}
        <div className="flex flex-col items-center justify-center text-center z-10 relative">
          <Wind className={`w-12 h-12 mb-4 text-cyan-300 transition-opacity duration-1000 ${phase === "hold" ? "opacity-100" : "opacity-70"}`} />
          <h2 className="text-4xl font-light text-white mb-2 tracking-wide">
            {phase === "inhale" && "Inspire"}
            {phase === "hold" && "Segure"}
            {phase === "exhale" && "Expire"}
          </h2>
          <p className="text-6xl font-bold text-cyan-200 tabular-nums">
            {timeLeft}
          </p>
        </div>
      </div>

      <p className="text-center text-white/60 max-w-sm text-lg font-light leading-relaxed">
        Concentre-se no movimento do círculo.<br/>
        Deixe o ar entrar devagar... e sair devagar.
      </p>

      <Button 
        onClick={onClose}
        className="mt-12 bg-white/10 text-white hover:bg-white/20 rounded-full px-8 py-6 text-lg"
      >
        Estou me sentindo melhor
      </Button>
    </div>
  );
}

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Mail, Settings, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  showBack?: boolean;
  onBack?: () => void;
};

export function AppHeader({ showBack = false, onBack }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  return (
    <header className="border-b border-pink-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full text-pink-600"
            >
              ←
            </Button>
          )}
          <h1 className="text-xl font-bold text-pink-600">OncoLiving</h1>
        </div>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-pink-50 transition-colors focus:outline-none">
                <Avatar className="h-9 w-9 border shrink-0">
                  <AvatarFallback className="text-xs font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-gray-900">
                    {user?.name || "-"}
                  </span>
                  <span className="text-xs text-gray-600">{user?.email || "-"}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  window.location.href =
                    "mailto:andressaoncopersonal@gmail.com?subject=Contato%20Oncologista";
                }}
                className="cursor-pointer"
              >
                <Mail className="mr-2 h-4 w-4" />
                <span>Contato oncologista</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate("/auth");
                }}
                className="cursor-pointer text-destructive"
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Entrar
          </Button>
        )}
      </div>
    </header>
  );
}

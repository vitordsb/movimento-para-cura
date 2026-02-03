import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Heart, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AUTH_TOKEN_KEY } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function AuthPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showInfo, setShowInfo] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");

  // Registration Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    length: false,
  });

  // Billing Form State
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    cpfCnpj: "",
    mobilePhone: "",
    postalCode: "",
    address: "",
    addressNumber: "",
    province: "",
  });

  const [pending, setPending] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [planChoice, setPlanChoice] = useState<"free" | "monthly" | "annual" | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Check password strength on change
  useEffect(() => {
    setPasswordStrength({
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      length: password.length >= 8,
    });
  }, [password]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const planParam = searchParams.get("plan");

    if (planParam === "monthly" || planParam === "annual" || planParam === "free") {
      setPlanChoice(planParam as "monthly" | "annual" | "free");
      if (planParam !== "free") {
        setMode("register");
      }
    }
  }, []);

  const isRegister = mode === "register";
  const createPaymentMutation = trpc.subscriptions.createPayment.useMutation();

  const handlePasswordAuth = async () => {
    try {
      const emailValue = email.trim();
      const passwordValue = password;
      const nameValue = name.trim();

      if (!emailValue || !passwordValue) {
        toast.error("Informe email e senha");
        return;
      }
      if (isRegister) {
        if (!nameValue) {
          toast.error("Informe um nome de usuário");
          return;
        }
        if (!termsAccepted) {
          toast.error("Você precisa aceitar os termos de uso");
          return;
        }
        if (!planChoice) {
          toast.error("Selecione um plano para continuar");
          return;
        }

        // Validate password strength minimal requirements
        if (!passwordStrength.length) {
          toast.error("A senha precisa ter pelo menos 8 caracteres.");
          return;
        }
      }

      setPending(true);
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { email: emailValue, password: passwordValue, name: nameValue, planChoice }
            : { email: emailValue, password: passwordValue }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Falha na autenticação");
      }

      if (isRegister) {
        // Auto-login flow for all registrations
        const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailValue, password: passwordValue }),
        });
        const loginData = await loginRes.json().catch(() => ({}));

        if (loginData?.token) {
          localStorage.setItem(AUTH_TOKEN_KEY, loginData.token);

          if (planChoice === "monthly" || planChoice === "annual") {
            // Open billing modal instead of creating payment immediately
            setShowBillingModal(true);
            setPending(false); // Stop pending to allow modal interaction
            return;
          } else {
            try { localStorage.setItem("needs-anamnesis", "1"); } catch { }
            window.location.href = "/";
            return;
          }
        }
        toast.success("Conta criada! Comça faça login.");
        setMode("login");
        setPending(false);
        return;
      }

      if (data?.token) {
        try {
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        } catch {}
      }
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error?.message || "Falha na autenticação");
    } finally {
      if (!showBillingModal) setPending(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!planChoice || (planChoice !== "monthly" && planChoice !== "annual")) return;

    // Validate Billing Info
    if (!billingInfo.cpfCnpj || !billingInfo.mobilePhone) {
      toast.error("Preencha CPF/CNPJ e Telefone para a nota fiscal.");
      return;
    }

    setPending(true);
    try {
      toast.info("Redirecionando para pagamento seguro...");
      const payment = await createPaymentMutation.mutateAsync({
        planType: planChoice,
        billingInfo: billingInfo,
      });

      if (payment.paymentUrl) {
        window.open(payment.paymentUrl, "_blank");
        navigate("/payment");
      } else {
        // Fallback or error
        toast.error("Não foi possível gerar o link de pagamento.");
      }
    } catch (error: any) {
      // Handle already pending payment or other errors
      toast.error(error?.message || "Erro ao criar pagamento. Tente novamente.");
    } finally {
      setPending(false);
      setShowBillingModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (isAuthenticated && !showBillingModal) {
  // If modal is not open, redirect managed by App or logic
  // But we prevent early return if we are in the middle of the flow
  // return null;
  // Actually, if authenticated and NOT registering fresh, we should redirect.
  // We rely on isRegister flow setting local storage and state.
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-pink-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-600" />
            <span className="font-bold text-gray-900">Movimento para Cura</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-3xl text-pink-600">
                {isRegister ? "Criar conta" : "Entrar"}
              </CardTitle>
              <CardDescription className="text-base">
                {isRegister
                  ? "Preencha seus dados para começar"
                  : "Acesse com seu email e senha"}
              </CardDescription>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setMode("login")}
                  disabled={pending}
                  className={cn("flex-1", mode === "login" && "bg-pink-500 text-white hover:bg-pink-600")}
                >
                  Entrar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMode("register")}
                  disabled={pending}
                  className={cn("flex-1", mode === "register" && "bg-pink-500 text-white hover:bg-pink-600")}
                >
                  Criar conta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                  {isRegister && (
                    <Input
                    placeholder="Nome de usuário"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={pending}
                    />
                  )}
                  <Input
                  placeholder="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={pending}
                  />
                <div className="space-y-2">
                  <Input
                    placeholder="Senha"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={pending}
                  />
                  {isRegister && password.length > 0 && (
                    <div className="text-xs space-y-1 p-2 bg-gray-50 rounded-md border border-gray-100">
                      <p className="font-semibold text-gray-700 mb-1">Sua senha deve ter:</p>
                      <div className="grid grid-cols-2 gap-1">
                        <div className={cn("flex items-center gap-1", passwordStrength.length ? "text-green-600" : "text-gray-400")}>
                          {passwordStrength.length ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 block bg-gray-200 rounded-full" />}
                          8+ caracteres
                        </div>
                        <div className={cn("flex items-center gap-1", passwordStrength.hasUpper ? "text-green-600" : "text-gray-400")}>
                          {passwordStrength.hasUpper ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 block bg-gray-200 rounded-full" />}
                          Maiúscula
                        </div>
                        <div className={cn("flex items-center gap-1", passwordStrength.hasNumber ? "text-green-600" : "text-gray-400")}>
                          {passwordStrength.hasNumber ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 block bg-gray-200 rounded-full" />}
                          Número
                        </div>
                        <div className={cn("flex items-center gap-1", passwordStrength.hasSpecial ? "text-green-600" : "text-gray-400")}>
                          {passwordStrength.hasSpecial ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 block bg-gray-200 rounded-full" />}
                          Especial (!@#)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {isRegister && (
                  <div className="space-y-3 rounded-lg border border-pink-100 bg-pink-50 p-3 text-left">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-pink-200 text-pink-700 w-full justify-between"
                      onClick={() => setShowPlanModal(true)}
                    >
                      {planChoice ? (
                        <span>Plano: {planChoice === "free" ? "Gratuito" : planChoice === "monthly" ? "Mensal (R$ 89)" : "Anual (R$ 890)"}</span>
                      ) : (
                        "Selecionar Plano"
                      )}
                      <span className="text-xs underline">Alterar</span>
                    </Button>

                    <Label htmlFor="accept-terms" className="text-sm text-gray-800 flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        id="accept-terms"
                        checked={termsAccepted}
                        onCheckedChange={value => {
                          if (value) {
                            setTermsModalOpen(true);
                            setTermsAccepted(false);
                          } else {
                            setTermsAccepted(false);
                          }
                        }}
                      />
                      <span>Li e aceito os termos de uso</span>
                    </Label>
                  </div>
                )}

                <Button
                  disabled={pending || (isRegister && !termsAccepted)}
                  onClick={handlePasswordAuth}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 font-semibold"
                >
                  {pending ? <Loader2 className="animate-spin" /> : isRegister ? "Continuar para Pagamento" : "Entrar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Plan Selection Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-4xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Escolha seu plano</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className={cn("cursor-pointer border-2 transition-all hover:border-pink-300", planChoice === "free" ? "border-pink-500 bg-pink-50" : "border-gray-100")} onClick={() => { setPlanChoice("free"); setShowPlanModal(false); }}>
              <CardContent className="p-4">
                <h3 className="font-bold">Teste Grátis</h3>
                <p className="text-2xl font-bold text-pink-600">R$ 0</p>
                <p className="text-sm text-gray-600">Acesso limitado ao quiz.</p>
              </CardContent>
            </Card>
            <Card className={cn("cursor-pointer border-2 transition-all hover:border-pink-300 relative", planChoice === "monthly" ? "border-pink-500 bg-pink-50" : "border-gray-100")} onClick={() => { setPlanChoice("monthly"); setShowPlanModal(false); }}>
              <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">Popular</div>
              <CardContent className="p-4">
                <h3 className="font-bold">Mensal</h3>
                <p className="text-2xl font-bold text-pink-600">R$ 89<span className="text-sm text-gray-500 font-normal">/mês</span></p>
                <p className="text-sm text-gray-600">Acesso completo + histórico.</p>
              </CardContent>
            </Card>
            <Card className={cn("cursor-pointer border-2 transition-all hover:border-pink-300", planChoice === "annual" ? "border-pink-500 bg-pink-50" : "border-gray-100")} onClick={() => { setPlanChoice("annual"); setShowPlanModal(false); }}>
              <CardContent className="p-4">
                <h3 className="font-bold">Anual</h3>
                <p className="text-2xl font-bold text-pink-600">R$ 890<span className="text-sm text-gray-500 font-normal">/ano</span></p>
                <p className="text-sm text-gray-600">Economize 2 meses.</p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Billing Info Modal */}
      <Dialog open={showBillingModal} onOpenChange={setShowBillingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dados para Faturamento</DialogTitle>
            <CardDescription>Precisamos destas informações para emitir sua nota fiscal.</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
                  <div className="space-y-2">
              <Label>CPF ou CNPJ</Label>
              <Input
                placeholder="000.000.000-00"
                value={billingInfo.cpfCnpj}
                onChange={(e) => setBillingInfo({ ...billingInfo, cpfCnpj: e.target.value })}
              />
                  </div>
            <div className="space-y-2">
              <Label>Celular (WhatsApp)</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={billingInfo.mobilePhone}
                onChange={(e) => setBillingInfo({ ...billingInfo, mobilePhone: e.target.value })}
              />
                  </div>
            <div className="space-y-2">
              <Label>Endereço (Opcional)</Label>
              <Input
                placeholder="Rua, Número, Bairro"
                value={billingInfo.address}
                onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
              />
            </div>
              </div>
          <DialogFooter>
            <Button onClick={handleCreatePayment} disabled={pending} className="w-full bg-green-600 hover:bg-green-700">
              {pending ? <Loader2 className="animate-spin" /> : "Ir para Pagamento Seguro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms Modal (Simplified for brevity in update, keep original content if preferred, but reusing logic) */}
      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle>Termos de Uso e Responsabilidade</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 border rounded bg-gray-50 text-sm">
            <p className="font-bold mb-2">Resumo do Consentimento:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Este é um programa educativo e não substitui consulta médica.</li>
              <li>Você deve informar seu oncologista sobre a prática de exercícios.</li>
              <li>Interrompa exercícios se sentir dor, tontura ou falta de ar.</li>
              <li>Você é responsável por respeitar seus limites do dia.</li>
            </ul>
            <p className="mt-4 text-xs text-gray-500">Para ler o texto completo, acesse a área de termos no rodapé.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermsModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => { setTermsAccepted(true); setTermsModalOpen(false); }} className="bg-pink-500 text-white">Concordo e Aceito</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

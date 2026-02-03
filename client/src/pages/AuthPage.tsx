import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Heart } from "lucide-react";
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [planChoice, setPlanChoice] = useState<"free" | "monthly" | "annual" | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    // Parse query params manually since wouter useLocation doesn't provide them directly in a parsed way
    const searchParams = new URLSearchParams(window.location.search);
    const planParam = searchParams.get("plan");

    if (planParam === "monthly" || planParam === "annual" || planParam === "free") {
      setPlanChoice(planParam as "monthly" | "annual" | "free");
      setMode("register");
      // If it's a paid plan, we might want to ensure the modal isn't needed or show it for confirmation?
      // Current implementation: if planChoice is set, user just needs to fill form.
      // Maybe show a toast or something?

      if (planParam !== "free") {
        // Automatically expand the form if they came from a plan
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
      if (isRegister && !nameValue) {
        toast.error("Informe um nome de usuário para criar sua conta");
        return;
      }
      if (isRegister && !termsAccepted) {
        toast.error("Você precisa aceitar os termos de uso e responsabilidade");
        return;
      }
      if (isRegister && !planChoice) {
        toast.error("Selecione um plano para continuar");
        return;
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
        toast.success("Conta criada!");

        // For paid plans, login and redirect to payment
        if (planChoice === "monthly" || planChoice === "annual") {
          // Auto-login the user
          const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailValue, password: passwordValue }),
          });
          const loginData = await loginRes.json().catch(() => ({}));

          if (loginData?.token) {
            try {
              localStorage.setItem(AUTH_TOKEN_KEY, loginData.token);
            } catch { }

            // Create payment and redirect
            toast.info("Redirecionando para pagamento...");
            const payment = await createPaymentMutation.mutateAsync({
              planType: planChoice,
            });

            // Open Asaas payment in new tab
            window.open(payment.paymentUrl, "_blank");

            // Redirect to payment status page
            navigate("/payment");
            return;
          }
        }

        // For free plan, just prompt login
        try {
          localStorage.setItem("needs-anamnesis", "1");
        } catch {}
        toast.success("Entre com seu email e senha para continuar.");
        setMode("login");
        setPassword("");
        setTermsAccepted(false);
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
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will be redirected by App.tsx
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-pink-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Movimento para Cura</h1>
              <p className="text-xs text-gray-600">
                O Movimento para Cura foi desenvolvido pela Andressa Semionatto
              </p>
            </div>
          </div>
          <div className="flex flex-col md:items-end text-sm text-gray-700 gap-1">
            <span className="font-medium text-gray-800">Acompanhe as redes sociais:</span>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                className="text-pink-700 hover:underline"
              >
                Instagram
              </a>
              <a
                href="https://wa.me/5519998041414"
                target="_blank"
                rel="noreferrer"
                className="text-green-700 hover:underline"
              >
                WhatsApp: +55 19 99804-1414
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Medical Disclaimer */}
          {showInfo && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <p className="font-semibold mb-1">Aviso importante</p>
                    <p>
                      Este aplicativo não substitui consulta médica. Sempre consulte seu oncologista
                      antes de iniciar qualquer exercício. Em caso de sintomas graves, procure seu
                      médico imediatamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Login Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-3xl text-pink-600">
                {isRegister ? "Criar conta" : "Entrar"}
              </CardTitle>
              <CardDescription className="text-base">
                {isRegister
                  ? "Preencha seus dados para começar a usar o Movimento para Cura"
                  : "Acesse com seu email e senha para continuar"}
              </CardDescription>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setMode("login")}
                  disabled={pending}
                  className={cn(
                    "flex-1 border-pink-200 text-pink-700 hover:bg-pink-50",
                    mode === "login" && "bg-pink-500 text-white border-pink-500 hover:bg-pink-600"
                  )}
                >
                  Entrar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMode("register")}
                  disabled={pending}
                  className={cn(
                    "flex-1 border-pink-200 text-pink-700 hover:bg-pink-50",
                    mode === "register" &&
                      "bg-pink-500 text-white border-pink-500 hover:bg-pink-600"
                  )}
                >
                  Criar conta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                O Movimento para Cura ajuda você a saber se hoje é um bom dia para se exercitar e traz
                recomendações personalizadas com base em como você está se sentindo.
              </p>

              <div className="space-y-3">
                <div className="space-y-2">
                  {isRegister && (
                    <Input
                      placeholder="Nome de usuário"
                      aria-label="Nome de usuário"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={pending}
                    />
                  )}
                  <Input
                    placeholder="Email"
                    aria-label="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={pending}
                  />
                  <Input
                    placeholder="Senha"
                    aria-label="Senha"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={pending}
                  />
                </div>
                {isRegister && (
                  <div className="space-y-3 rounded-lg border border-pink-100 bg-pink-50 p-3 text-left">
                    <p className="text-sm text-gray-800">
                      Para criar sua conta, escolha um plano, leia e aceite os termos de uso e responsabilidade.
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      className="border-pink-200 text-pink-700 w-full"
                      onClick={() => setShowPlanModal(true)}
                    >
                      Visualizar planos para completar o cadastro
                    </Button>
                    {planChoice && (
                      <p className="text-xs text-pink-700">
                        Plano selecionado:{" "}
                        {planChoice === "free"
                          ? "Continuar no teste grátis"
                          : planChoice === "monthly"
                          ? "Plano mensal"
                          : "Plano anual"}
                      </p>
                    )}

                    <Label htmlFor="accept-terms" className="text-sm text-gray-800 flex items-center gap-3">
                      <Checkbox
                        id="accept-terms"
                        checked={termsAccepted}
                        onCheckedChange={value => {
                          const next = Boolean(value);
                          if (next) {
                            setTermsModalOpen(true);
                            setTermsAccepted(false);
                          } else {
                            setTermsAccepted(false);
                          }
                        }}
                        onClick={e => {
                          if (!termsAccepted) {
                            e.preventDefault();
                            setTermsModalOpen(true);
                          }
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          Li e aceito os termos de uso e responsabilidade
                        </span>
                        <span className="text-xs text-gray-700">
                          Clique para abrir os termos, leia e confirme para habilitar o cadastro.
                        </span>
                      </div>
                    </Label>
                    {!termsAccepted && (
                      <p className="text-xs text-pink-700">
                        Você precisa confirmar os termos para concluir o cadastro.
                      </p>
                    )}
                  </div>
                )}
                <Button
                  disabled={pending || (isRegister && !termsAccepted)}
                  onClick={handlePasswordAuth}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 text-md font-semibold rounded-lg disabled:opacity-60"
                >
                  {isRegister ? "Cadastrar" : "Entrar com email e senha"}
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>
                  Ao entrar, você concorda em usar o Movimento para Cura como ferramenta de apoio sob a
                  orientação do seu oncologista.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex gap-3 p-4 bg-white rounded-lg border border-pink-100">
              <div className="text-2xl">📋</div>
              <div>
                <h3 className="font-semibold text-gray-900">Quiz diário</h3>
                <p className="text-sm text-gray-600">Avaliação rápida do seu bem-estar</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-white rounded-lg border border-green-100">
              <div className="text-2xl">💪</div>
              <div>
                <h3 className="font-semibold text-gray-900">Recomendações inteligentes</h3>
                <p className="text-sm text-gray-600">Sugestões personalizadas de exercício</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-white rounded-lg border border-pink-100">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="font-semibold text-gray-900">Acompanhamento do progresso</h3>
                <p className="text-sm text-gray-600">Monitore sua jornada de bem-estar</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            Movimento para Cura é uma ferramenta de apoio para ajudar pacientes oncológicos a gerenciar sua
            rotina de exercícios. Sempre siga as orientações do seu oncologista.
          </p>
        </div>
      </footer>

      {/* Modal de planos */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="2xl:min-w-[900px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="2xl:text-2xl text-md text-pink-600">Escolha seu plano</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-3 grid-cols-1">
            {[
              {
                value: "free",
                name: "Continuar no teste grátis",
                price: "R$ 0",
                desc: "Oferta por tempo limitado. Acesso completo liberado.",
                highlight: true,
              },
              {
                value: "monthly",
                name: "Plano Mensal",
                price: "R$ 89/mês",
                desc: "Semáforo diário, aulas seguras e histórico.",
                highlight: false,
              },
              {
                value: "annual",
                name: "Plano Anual",
                price: "R$ 890/ano",
                desc: "12 meses com economia e suporte contínuo.",
                highlight: false,
              },
            ].map(plan => (
              <div
                key={plan.value}
                className={`rounded-lg border p-4 space-y-2 ${
                  planChoice === plan.value ? "border-pink-500 shadow-sm" : "border-pink-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="2xl:text-lg text-md font-semibold text-gray-900">{plan.name}</p>
                  {plan.highlight && (
                    <Badge className="bg-pink-100 text-pink-700 border-pink-200">Mais escolhido</Badge>
                  )}
                </div>
                <p className="2xl:text-2xl text-md font-bold text-pink-600">{plan.price}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{plan.desc}</p>
                <Button
                  onClick={() => {
                    setPlanChoice(plan.value as typeof planChoice);
                    setShowPlanModal(false);
                  }}
                  className={plan.highlight ? "w-full bg-pink-500 hover:bg-pink-600" : "w-full border-pink-200 text-pink-700"}
                  variant={plan.highlight ? "default" : "outline"}
                >
                  Selecionar
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle className="2xl:text-xl text-md text-pink-600">
              Termos de uso, responsabilidade e consentimento
            </DialogTitle>
          </DialogHeader>

          <Tabs
            defaultValue="consentimento"
            className="w-full flex-1 flex flex-col gap-3 min-h-0 overflow-hidden"
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="consentimento">Consentimento da paciente</TabsTrigger>
              <TabsTrigger value="termo-uso">Termo de uso e direitos</TabsTrigger>
            </TabsList>

            <TabsContent value="consentimento" className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 h-[40vh] max-h-[40vh] overflow-y-auto pr-2">
                <div className="space-y-4 pr-2 pb-2">
                  <div className="space-y-2">
                    <h3 className="2xl:text-lg text-md font-semibold text-gray-900">
                      Aviso de consentimento e declaração de responsabilidade — Movimento para Cura
                    </h3>
                    <p className="text-sm text-gray-700">
                      Empresa: Andressa Business Saúde Fitness e Oncologia | Profissional: Andressa
                      Semionatto | Contato: andressaoncopersonal@gmail.com
                    </p>
                  </div>
                  <div className="space-y-3 text-sm text-gray-800">
                    <p>Ao prosseguir, você declara que:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Compreende que o programa (incluindo os quizzes) é educativo, baseado em
                        diretrizes internacionais, e não substitui consulta médica ou outros cuidados.
                      </li>
                      <li>
                        Informará seu oncologista sobre a prática de exercícios e seguirá as
                        recomendações clínicas fornecidas por ele.
                      </li>
                      <li>
                        Interromperá exercícios imediatamente se houver falta de ar súbita, dor
                        intensa, tontura/desmaio/palpitação, febre &gt; 38°C, sangramentos, náusea
                        incapacitante ou qualquer sintoma alarmante.
                      </li>
                      <li>
                        Realizará cada treino conforme suas condições do dia; o sistema educativo de
                        dias seguros/moderados/não recomendados não substitui sua decisão final.
                      </li>
                      <li>
                        Reconhece que resultados são individuais, sem garantias específicas.
                      </li>
                      <li>
                        Assumirá responsabilidade por informar condições de risco (cardiopatias,
                        infecções, neutropenia severa, anemia importante, cirurgias recentes, uso de
                        dispositivos médicos etc.).
                      </li>
                      <li>
                        Isenta empresa e profissional de responsabilidade por uso inadequado,
                        descumprir recomendações médicas ou execução incorreta.
                      </li>
                      <li>
                        Autoriza o uso dos conteúdos conforme Termos de Serviço e respeitará direitos
                        autorais.
                      </li>
                      <li>
                        Leu e concorda com política de privacidade, reembolso, termos de serviço e
                        este consentimento.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="termo-uso" className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 h-[40vh] max-h-[40vh] overflow-y-auto pr-2">
                <div className="space-y-4 pr-2 pb-2">
                  <div className="space-y-2">
                    <h3 className="2xl:text-lg text-md font-semibold text-gray-900">
                      Termo de uso para treinos e exercícios em oncologia — Movimento para Cura
                    </h3>
                    <p className="text-sm text-gray-700">
                      Propriedade de Andressa Business Saúde Fitness e Oncologia.
                    </p>
                  </div>
                  <div className="space-y-3 text-sm text-gray-800">
                    <p>Ao acessar os conteúdos, você concorda que:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        O programa oferece orientações gerais, treinos gravados e protocolos por
                        sintomas/fases; não substitui consulta ou avaliação presencial.
                      </li>
                      <li>
                        Você é responsável por treinar dentro de seus limites, pausar diante de
                        sintomas atípicos e manter acompanhamento regular com seu oncologista.
                      </li>
                      <li>
                        É proibido treinar se houver febre ≥ 38°C, plaquetas &lt; 50.000 (sem liberação),
                        neutrófilos &lt; 1.000, hemoglobina &lt; 8 g/dL, dor intensa, infecção ativa,
                        tontura forte, sangramento ou pós-operatório sem liberação médica.
                      </li>
                      <li>
                        A empresa não se responsabiliza por execução inadequada, prática contra
                        orientação médica, uso indevido dos treinos/quizzes ou interpretação equivocada.
                      </li>
                      <li>
                        Todo conteúdo (treinos, vídeos, PDFs, protocolos) é protegido; é proibido
                        compartilhar acesso, reproduzir ou redistribuir sem autorização.
                      </li>
                      <li>
                        Conteúdos e políticas podem ser atualizados para manter segurança e qualidade.
                      </li>
                      <li>
                        Você declara que leu o termo, compreendeu riscos e assume responsabilidade por
                        sua prática de exercícios.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setTermsModalOpen(false)}
              className="border-pink-200 text-pink-700 hover:bg-pink-100"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setTermsAccepted(true);
                setTermsModalOpen(false);
              }}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              Li e concordo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

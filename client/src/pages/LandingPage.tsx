import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Heart, Play, Shield, CheckCircle, Star, Quote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [trialName, setTrialName] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "ONCOLOGIST") {
      navigate("/admin");
    } else if (user.role === "PATIENT") {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleStart = () => {
    if (user) {
      if (user.role === "ONCOLOGIST") navigate("/admin");
      else navigate("/dashboard");
      return;
    }
    navigate("/avaliacao");
  };

  const handlePlanClick = (cta: string) => {
    const lowerCta = cta.toLowerCase();

    if (lowerCta.includes("mensal")) {
      navigate("/auth?plan=monthly");
      return;
    }
    if (lowerCta.includes("anual")) {
      navigate("/auth?plan=annual");
      return;
    }
    if (lowerCta.includes("testar") || lowerCta.includes("grátis")) {
      navigate("/auth?plan=free");
      return;
    }

    handleStart();
  };

  const videoItems = [
    { title: "Apresentação do Movimento para Cura", length: "3:15" },
    { title: "Como usar os treinos educativos", length: "4:02" },
    { title: "Dicas de segurança e sinais de alerta", length: "2:47" },
  ];

  const testimonials = [
    {
      name: "Juliana M.",
      role: "Paciente em quimioterapia",
      quote:
        "Consegui entender quando era seguro me exercitar e ganhei confiança para manter movimento mesmo nos dias mais difíceis.",
    },
    {
      name: "Carla R.",
      role: "Sobrevivente oncológica",
      quote:
        "Os protocolos e alertas me ajudaram a respeitar meus limites e ainda assim evoluir com segurança.",
    },
    {
      name: "Dr. Henrique",
      role: "Oncologista parceiro",
      quote:
        "A abordagem educativa da Andressa facilita a adesão do paciente e mantém a segurança em primeiro lugar.",
    },
  ];

  const methodology = [
    {
      title: "Fluxo clínico",
      content:
        "Boas-vindas → Cadastro básico → Anamnese clínica (1ª vez) → Home → Check-in diário → Algoritmo de decisão → Semáforo do dia → Treinos seguros → Registro automático → Acompanhamento → Conteúdo educativo. Anamnese cria travas de segurança permanentes; check-in decide o dia.",
    },
    {
      title: "Anamnese (base fixa)",
      content:
        "Coleta contra-indicações absolutas e restrições específicas, define limites máximos e oculta aulas inadequadas. Campos: diagnóstico, metástase (local), tratamentos, dores, fadiga, neuropatia, linfedema, tontura, fratura/trombose, capacidade funcional (levantar, caminhar), exercício prévio.",
    },
    {
      title: "Check-in diário (variável)",
      content:
        "Fadiga, dor, enjoo, diarreia, apetite, sono, febre, dia de quimio (antes/depois) e sensação geral. Alimenta o semáforo e o algoritmo decide a cor do dia.",
    },
    {
      title: "Semáforo e aulas seguras",
      content:
        "Vermelho: mobilidade/respiração sem carga; Amarelo: força nível 1 sentada, cardio leve; Verde: força 1/2 em pé, cardio leve/moderado. Sempre sem treino pesado, só estímulo inteligente.",
    },
  ];

  const plans = [
    {
      name: "Amostra gratuita",
      price: "R$ 0",
      description: "Faça o quiz demonstrativo e entenda o fluxo. Resultado completo apenas para assinantes.",
      cta: "Testar agora",
      highlight: false,
      disabled: false,
    },
    {
      name: "Plano Mensal",
      price: "R$ 89/mês",
      description: "Acesso completo ao semáforo diário, aulas seguras e histórico.",
      cta: "Assinar mensal",
      highlight: true,
      disabled: true,
    },
    {
      name: "Plano Anual",
      price: "R$ 890/ano",
      description: "12 meses com economia e suporte contínuo no acompanhamento.",
      cta: "Assinar anual",
      highlight: false,
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-green-50 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-pink-100/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-pink-600" />
            <div>
              <p className="text-xs uppercase tracking-wide text-pink-600 font-semibold">
                Movimento para Cura
              </p>
              <p className="text-sm text-gray-700">Por Andressa Semionatto</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-pink-200 text-pink-700" onClick={() => navigate("/auth")}>
              Entrar / Criar conta
            </Button>
            <Button className="bg-pink-500 hover:bg-pink-600" onClick={handleStart}>
              Experimente grátis
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-16">
        {/* HERO */}
        <section className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Movimento para a Cura
              <span className="block text-2xl sm:text-3xl font-medium text-pink-600 mt-2">
                Exercício físico seguro durante o tratamento oncológico
              </span>
            </h1>
            <p className="text-xl text-gray-700 font-medium">
              Um sistema simples e confiável para você saber quando, como e quanto se movimentar, mesmo durante a quimioterapia, radioterapia ou pós-cirúrgico.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button className="bg-pink-600 hover:bg-pink-700 text-white text-lg px-8 py-6 h-auto" onClick={handleStart}>
                Quero saber o que é seguro fazer hoje
              </Button>
            </div>
          </div>
          {/* IMAGE / ANDRESSA */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-pink-100 rounded-full blur-3xl opacity-60"></div>
            <img src="/fotoAndressa.jpeg" alt="Andressa Semionatto" className="relative w-80 h-80 sm:w-96 sm:h-96 object-cover rounded-2xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 border-4 border-white" />
          </div>
        </section>

        {/* BLOCO 1: IDENTIFICAÇÃO */}
        <section className="bg-pink-50 rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Este aplicativo foi feito para você?</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-lg font-semibold text-gray-800">Se você está em tratamento oncológico e:</p>
              <ul className="space-y-3">
                {[
                  "Tem medo de se exercitar e 'atrapalhar' o tratamento",
                  "Não sabe se hoje pode treinar ou se é melhor descansar",
                  "Já ouviu opiniões contraditórias sobre exercício",
                  "Se sente cansada, insegura ou sem energia",
                  "Quer se cuidar, mas não quer errar"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-pink-500 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <p className="text-xl font-bold text-pink-600 mb-2">Sim, esse aplicativo é para você.</p>
              <p className="text-gray-600">Aqui, o exercício não é cobrança. Não é performance. Não é 'forçar porque faz bem'. Aqui, o movimento é cuidado, segurança e decisão consciente.</p>
                </div>
          </div>
        </section>

        {/* BLOCO 3 & 4: COMO FUNCIONA */}
        <section className="space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Como funciona na prática</h2>
            <p className="text-lg text-gray-600">Um sistema inteligente que decide por você, baseado nos seus sintomas do dia.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "1. Check-in", desc: "Você responde um check-in rápido do dia sobre seus sintomas." },
              { title: "2. Análise", desc: "O sistema analisa sua energia, dor, e fase do tratamento." },
              { title: "3. Decisão", desc: "O aplicativo mostra exatamente o que é seguro fazer hoje." },
              { title: "4. Treino", desc: "Você recebe um treino curto e adequado, sem precisar pensar." }
            ].map((step, i) => (
              <Card key={i} className="border-pink-100 hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-xl">{i + 1}</div>
                  <h3 className="font-bold text-lg text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-gray-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6">
            <h3 className="text-2xl font-bold">O que o app decide por você?</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                <p className="font-bold text-green-400 mb-1">🟢 TREINAR</p>
                <p className="text-sm text-gray-300">Exercícios de força e cardio leve quando você está bem.</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                <p className="font-bold text-yellow-400 mb-1">🟡 ADAPTAR</p>
                <p className="text-sm text-gray-300">Movimentos na cadeira ou leves para dias de fadiga moderada.</p>
                    </div>
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                <p className="font-bold text-blue-400 mb-1">🔵 RECUPERAR</p>
                <p className="text-sm text-gray-300">Descanso ativo, respiração e alongamento para dias difíceis.</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto italic">Tudo isso respeitando seus sintomas, medicamentos, fase do tratamento e orientação médica.</p>
          </div>
        </section>

        {/* BLOCO 7: QUEM É ANDRESSA */}
        <section className="grid md:grid-cols-2 gap-12 items-center bg-white border border-pink-100 rounded-3xl p-8 shadow-sm">
          <div className="order-2 md:order-1 space-y-6">
            <div>
              <p className="text-sm uppercase tracking-widest text-pink-600 font-bold mb-2">Quem criou</p>
              <h2 className="text-3xl font-bold text-gray-900">Andressa Semionatto</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>Profissional de Educação Física, especialista em exercício físico para pessoas em tratamento oncológico, com atuação clínica e hospitalar.</p>
              <p>Já acompanhou mais de <strong>3.000 pacientes</strong> no Brasil e no mundo, ajudando pessoas com câncer a se movimentarem com segurança, autonomia e foco em qualidade de vida.</p>
              <p className="italic font-medium text-gray-900 border-l-4 border-pink-500 pl-4">"Este aplicativo é a tradução prática da minha experiência clínica. Aqui, o exercício respeita o seu tratamento — não o contrário."</p>
            </div>
            <Button variant="outline" className="border-pink-200 text-pink-700" onClick={() => window.open("https://instagram.com/andressa.oncopersonal", "_blank")}>
              Conhecer no Instagram
            </Button>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-pink-50 shadow-xl">
              <img src="/fotoAndressa.jpeg" alt="Andressa Semionatto" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="text-center space-y-8 py-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Você não precisa decidir sozinha.</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Tenha o movimento certo, no dia certo.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white text-lg px-10 py-6 h-auto shadow-lg hover:shadow-xl transition-all" onClick={handleStart}>
              Quero me movimentar com segurança
            </Button>
          </div>
        </section>
	        {/* Objeções e diferenciais */}
	        <section className="space-y-4">
	          <div className="flex flex-col gap-2">
	            <h3 className="text-2xl font-bold text-gray-900">Por que não é mais do mesmo</h3>
	            <p className="text-gray-700">
	              Não é “treino genérico”. É decisão segura para cada fase do tratamento.
	            </p>
	          </div>
	          <div className="grid gap-4">
	            {[
	              {
	                title: "Não é treino genérico",
	                paragraphs: [
	                  "O que funciona para uma pessoa pode ser arriscado para outra.",
	                  "Aqui, cada dia começa com uma avaliação do seu estado atual — não com uma planilha pronta.",
	                ],
	              },
	              {
	                title: "Não é motivação vazia",
	                paragraphs: [
	                  "Fadiga, dor e medo não se resolvem com frases prontas.",
	                  "Aqui, quem decide é o critério clínico, não a força de vontade.",
	                ],
	              },
	              {
	                title: "Não é “todo dia, de qualquer jeito”",
	                paragraphs: [
	                  "Em tratamento, o dia certo importa.",
	                  "O app orienta quando se exercitar, quando adaptar e quando descansar — com segurança.",
	                ],
	              },
	              {
	                title: "Não promete milagres",
	                paragraphs: [
	                  "O movimento aqui não é castigo nem obrigação.",
	                  "É cuidado, estratégia e respeito ao seu corpo em tratamento.",
	                ],
	              },
	              {
	                title: "Constrói autonomia de verdade",
	                paragraphs: [
	                  "Você aprende a reconhecer seus sinais, entender seus limites e se movimentar com confiança — hoje e no futuro.",
	                ],
	              },
	            ].map((item, idx) => (
	              <Card key={idx} className="border-pink-100 bg-white/70">
	                <CardContent className="p-6">
	                  <div className="flex items-center gap-3">
	                    <span className="h-4 w-4 rounded-full bg-fuchsia-600 shadow-sm" />
	                    <h4 className="text-xl font-extrabold text-gray-900">{item.title}</h4>
	                  </div>

	                  <div className="mt-4 border-l-2 border-gray-200 pl-4 space-y-3 text-gray-800">
	                    {item.paragraphs.map((text) => (
	                      <p key={text} className="text-base leading-relaxed">
	                        {text}
	                      </p>
	                    ))}
	                  </div>
	                </CardContent>
	              </Card>
	            ))}
	          </div>
	        </section>

        {/* Produto e metodologia */}
        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-bold text-gray-900">O que você recebe no Movimento para Cura?</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-pink-100">
              <CardContent className="p-5 space-y-3">
                <Shield className="h-6 w-6 text-pink-600" />
                <h4 className="font-semibold text-lg">Protocolos por sintomas</h4>
                <p className="text-sm text-gray-700">
                  Orientações específicas para febre, dor, náusea, tontura e sinais de alerta.
                </p>
              </CardContent>
            </Card>
            <Card className="border-pink-100">
              <CardContent className="p-5 space-y-3">
                <Play className="h-6 w-6 text-pink-600" />
                <h4 className="font-semibold text-lg">Aulas e treinos gravados</h4>
                <p className="text-sm text-gray-700">
                  Vídeos educativos e treinos leves a moderados, separados por fase do tratamento.
                </p>
              </CardContent>
            </Card>
            <Card className="border-pink-100">
              <CardContent className="p-5 space-y-3">
                <CheckCircle className="h-6 w-6 text-pink-600" />
                <h4 className="font-semibold text-lg">Quizzes diários</h4>
                <p className="text-sm text-gray-700">
                  Avalie seu estado do dia, receba recomendações e entenda quando pausar ou progredir.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Planos e amostra */}
        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-bold text-gray-900">Planos e acesso</h3>
            <p className="text-gray-700">
              Teste grátis o fluxo do quiz. Para ver o resultado completo e histórico, ative um plano.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan, idx) => (
              <Card
                key={idx}
                className={`border ${plan.highlight ? "border-pink-300 shadow-xl" : "border-pink-100"} ${(plan as any).disabled ? "opacity-90" : ""}`}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg text-gray-900">{plan.name}</h4>
                    {plan.highlight && (
                      <Badge className="bg-pink-100 text-pink-700 border-pink-200">Mais escolhido</Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-pink-600">{plan.price}</p>
                  <p className="text-sm text-gray-700">{plan.description}</p>
                  <Button
                    className={plan.highlight ? "bg-pink-500 hover:bg-pink-600 w-full" : "border-pink-200 text-pink-700 w-full"}
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => handlePlanClick(plan.cta)}
                    disabled={(plan as any).disabled}
                  >
                    {(plan as any).disabled ? "Em breve" : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Vídeos e feedbacks */}
        <section className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">Conheça o programa em vídeos</h3>
            <p className="text-gray-700">
              Entenda a estrutura do Movimento para Cura, veja exemplos de protocolos e como navegar na plataforma.
            </p>
            <div className="space-y-3">
              {videoItems.map((video, idx) => (
                <Card key={idx} className="border-pink-100">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{video.title}</p>
                      <p className="text-sm text-gray-600">Duração: {video.length}</p>
                    </div>
                    <Button variant="outline" className="border-pink-200 text-pink-700">
                      Assistir
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">Feedbacks de quem já utilizou</h3>
            <p className="text-gray-700">
              Experiências reais de pacientes e profissionais que adotaram a metodologia da Andressa.
            </p>
            <div className="grid gap-3">
              {testimonials.map((item, idx) => (
                <Card key={idx} className="border-pink-100">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-pink-600">
                      <Quote className="h-4 w-4" />
                      <span className="text-sm font-semibold">{item.role}</span>
                    </div>
                    <p className="text-gray-800 text-sm leading-relaxed">“{item.quote}”</p>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Star className="h-4 w-4 text-pink-600" />
                      <span className="font-semibold">{item.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Políticas e termos */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Políticas, termos e garantia</h3>
          <p className="text-gray-700">
            Transparência sobre reembolso, entrega digital, privacidade e termos de serviço do Movimento para Cura.
          </p>
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="reembolso">
              <AccordionTrigger>Política de reembolso — 7 dias</AccordionTrigger>
              <AccordionContent className="text-sm text-gray-800 space-y-2">
                <p>
                  Oferecemos garantia de 7 dias corridos para solicitar reembolso total, conforme o Código de Defesa
                  do Consumidor para produtos digitais. Após este período, o reembolso não é possível, pois o conteúdo
                  (aulas, protocolos, treinos e materiais) já foi entregue integralmente.
                </p>
                <p>
                  Para solicitar, envie e-mail para <strong>andressaoncopersonal@gmail.com</strong> com nome completo,
                  e-mail da compra e motivo.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="entrega">
              <AccordionTrigger>Entrega (produtos digitais)</AccordionTrigger>
              <AccordionContent className="text-sm text-gray-800 space-y-2">
                <p>
                  Acesso 100% digital, liberado automaticamente após confirmação do pagamento ou enviado ao e-mail
                  cadastrado em até 5 minutos. Não há envio físico.
                </p>
                <p>
                  Se não receber o acesso, verifique spam/lixo eletrônico/“Promoções”. Persistindo, contate
                  <strong> andressaoncopersonal@gmail.com</strong>.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacidade">
              <AccordionTrigger>Política de privacidade</AccordionTrigger>
              <AccordionContent className="text-sm text-gray-800 space-y-2">
                <p>
                  Coletamos apenas dados necessários para processar a compra e liberar o acesso. Não compartilhamos
                  com terceiros, exceto para pagamento, entrega digital ou cumprimento legal.
                </p>
                <p>
                  Você pode solicitar remoção dos dados pelo e-mail{" "}
                  <strong>andressaoncopersonal@gmail.com</strong>.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="termos">
              <AccordionTrigger>Termos de serviço</AccordionTrigger>
              <AccordionContent className="text-sm text-gray-800 space-y-2">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Acesso individual e intransferível.</li>
                  <li>Proibido divulgar, compartilhar, copiar ou redistribuir o conteúdo.</li>
                  <li>Uso indevido pode resultar em bloqueio sem reembolso.</li>
                  <li>Resultados variam individualmente; não garantimos resultados específicos.</li>
                  <li>Falhas técnicas podem ocorrer; trabalhamos para resolvê-las rapidamente.</li>
                  <li>Ao comprar, você declara ter lido e aceitado estes termos.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="aviso-legal">
              <AccordionTrigger>Aviso legal (Saúde e Oncologia)</AccordionTrigger>
              <AccordionContent className="text-sm text-gray-800 space-y-2">
                <p>
                  Programa educacional com base em evidências, diretrizes internacionais e experiência clínica da
                  profissional, alinhado às normas ACSM. Não substitui acompanhamento médico, nutricional,
                  psicológico ou fisioterapêutico.
                </p>
                <p>
                  Recomenda-se seguir orientações do oncologista, evitar exercícios com febre, dor intensa, falta de ar
                  ou sintomas incomuns e buscar apoio profissional em caso de dúvidas.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contato">
              <AccordionTrigger>Informações de contato</AccordionTrigger>
              <AccordionContent className="text-sm text-gray-800 space-y-2">
                <p>Andressa Business Saúde Fitness e Oncologia</p>
                <p>
                  📧 E-mail: <strong>andressaoncopersonal@gmail.com</strong>
                </p>
                <p>📍 Atendimento: segunda a sexta, das 9h às 18h | Resposta em até 24h úteis</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* CTA final */}
        <section className="rounded-2xl border border-pink-100 bg-pink-50/70 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-gray-900">Pronta para cuidar do seu movimento com segurança?</h3>
            <p className="text-gray-700">
              Crie sua conta, responda ao quiz diário e receba recomendações educativas para cada dia.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-pink-500 hover:bg-pink-600" onClick={handleStart}>
              Começar agora
            </Button>
            <Button variant="outline" className="border-pink-200 text-pink-700" onClick={handleStart}>
              Fazer login
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

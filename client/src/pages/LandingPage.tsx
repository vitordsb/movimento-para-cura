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
    navigate("/quiz");
  };

  const handlePlanClick = (cta: string) => {
    if (cta.toLowerCase().includes("assinar")) {
      navigate("/em-desenvolvimento");
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
    },
    {
      name: "Plano Mensal",
      price: "R$ 89/mês",
      description: "Acesso completo ao semáforo diário, aulas seguras e histórico.",
      cta: "Assinar mensal",
      highlight: true,
    },
    {
      name: "Plano Anual",
      price: "R$ 890/ano",
      description: "12 meses com economia e suporte contínuo no acompanhamento.",
      cta: "Assinar anual",
      highlight: false,
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

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-12">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <Badge className="bg-pink-100 text-pink-700 border-pink-200 w-fit px-3 py-1 text-sm font-semibold">
              Por Andressa Semionatto
            </Badge>
            <h1 className="text-5xl sm:text-5xl font-bold text-gray-900 leading-tight">Movimento para Cura</h1>
            <p className="text-xl text-gray-900 font-semibold">
              Um sistema seguro para você saber quando e como se movimentar durante o tratamento oncológico.
            </p>
            <div className="space-y-3 text-lg text-gray-700 leading-relaxed">
              <p>
                Se você está em tratamento e tem dúvidas se pode se mexer hoje, este app foi feito para você. 
              </p>
              <p>
                Em poucos segundos, você descobre se hoje é um dia seguro para se movimentar, recebe orientações claras sobre quando treinar, quando adaptar e quando descansar, e evita esforços que possam prejudicar sua recuperação.
              </p>
              <p className="text-lg font-semibold">
                Mais do que treinar, você aprende a ler os sinais do seu corpo, com base em evidências científicas, usando o exercício físico como aliado do tratamento, da qualidade de vida e da longevidade.
              </p>
           </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Input
                placeholder="Seu nome para testar"
                value={trialName}
                onChange={e => setTrialName(e.target.value)}
                className="w-full sm:w-64"
              />
              <Button className="bg-pink-500 hover:bg-pink-600 text-lg px-6" onClick={handleStart}>
                Descobrir se posso treinar hoje
              </Button>
            </div>
                      </div>
          <div className="relative flex flex-col gap-4">
            <div className="absolute -inset-6 rounded-3xl bg-pink-200/40 blur-3xl" />
            <div className="relative flex flex-col items-center gap-6 mt-4 mb-8">
              {/* Speech Bubble (Floating Above) */}
              <div className="relative animate-float w-full z-20">
                <div className="relative bg-white rounded-2xl p-6 shadow-xl border border-pink-100">
                  {/* Triangle/Tail pointing DOWN */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-white drop-shadow-sm"></div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-pink-600 font-bold mb-1">Sobre a profissional</p>
                      <h2 className="text-2xl font-bold text-gray-900">Andressa Semionatto</h2>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700 leading-relaxed max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                      <p>
                        <span className="font-semibold text-pink-600">Olá! Eu sou a Andressa.</span> Sou profissional de Educação Física, especialista em oncologia clínica e hospitalar.
                      </p>
                      <p>
                        Há mais de 8 anos, acompanho mais de 3.000 pacientes no Brasil e exterior durante seus tratamentos.
                      </p>
                      <p>
                        Criei o Movimento para Cura para unir ciência e sensibilidade, te ajudando a se movimentar com segurança, recuperar sua autonomia e viver com mais qualidade, respeitando cada momento do seu corpo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo (Centered Below) */}
              <div className="relative shrink-0 z-10 -mt-2">
                <div className="absolute inset-0 bg-pink-200 rounded-full blur-2xl opacity-60 scale-110"></div>
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-white shadow-2xl overflow-hidden ring-4 ring-pink-50">
                  <img
                    src="/fotoAndressa.jpeg"
                    alt="Andressa Semionatto"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
	            <div className="flex flex-col gap-4 relative z-10">
	              <Card className="border-pink-100">
	                <CardContent className="p-4">
	                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="sm:w-36 lg:w-40 shrink-0">
                      <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">
                        Metodologia
                      </p>
                      <p className="mt-1 text-3xl font-extrabold text-pink-600 leading-none">
                        SINAIS
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        Critérios clínicos em 6 pilares
                      </p>
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { letter: "S", label: "Sintomas" },
                        { letter: "I", label: "Intensidade" },
                        { letter: "N", label: "Nível de energia" },
                        { letter: "A", label: "Ambiente clínico" },
                        { letter: "I", label: "Intercorrências" },
                        { letter: "S", label: "Segurança" },
                      ].map((item) => (
                        <div
                          key={`${item.letter}-${item.label}`}
                          className="flex items-center gap-3 rounded-lg border border-pink-100 bg-white/70 px-3 py-2"
                        >
                          <div className="h-8 w-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-sm">
                            {item.letter}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
	                  </div>
	                </CardContent>
	              </Card>
	            </div>
	          </div>
	        </section>
        <section className="grid lg:grid-cols-1 items-start">
          <div className="space-y-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: "🛡️", title: "Seguro", text: "O exercício respeita seus sintomas, a fase do tratamento, os medicamentos, e as orientações médicas, nada aqui é genérico ou forçado." },
                  { icon: "⏱️", title: "Exercício como cuidado e longevidade", text: "Aqui, o movimento não é sobre performance. É sobre manter seu corpo ativo com segurança, melhorar sua qualidade de vida e construir saúde ao longo do tratamento e além dele." },
                  { icon: "🧭", title: "Claro", text: "O App te mostra exatamente qual caminho seguir hoje: se é dia de treinar, adaptar ou descansar - sempre com uma aula segura para o seu momento atual." },
                  { icon: "🤝", title: "Acolhedor", text: "Você não precisa saber tudo, nem estar bem todos os dias. O Movimento para Cura te acompanha respeitando seus limites físicos e emocionais, sem pressão e sem julgamento" },
                ].map((item, idx) => (
                  <Card key={idx} className="border-pink-100 w-full sm:w-auto flex-1 min-w-[160px]">
                    <CardContent className="p-4 space-y-2">
                      <div className="text-2xl">{item.icon}</div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-700">{item.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-pink-100 shadow-sm bg-white/70">
                <CardContent className="p-6 space-y-3">
                  <h4 className="text-xl font-semibold text-pink-700">Como você decide</h4>
                  <div className="flex flex-col gap-2 text-sm text-gray-800">
                    {[
                      "Check-in rápido do dia.",
                      "O sistema interpreta seus sinais atuais de saúde",
                      "Você recebe uma orientação objetiva e uma aula segura, adequada para aquele dia",
                    ].map((line, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-pink-600">➜</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                className={`border ${plan.highlight ? "border-pink-300 shadow-xl" : "border-pink-100"}`}
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
                  >
                    {plan.cta}
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

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import PaymentPage from "./pages/PaymentPage";
import IntroQuizPage from "./pages/IntroQuizPage";
import PatientDashboard from "./pages/PatientDashboard";
import QuizPage from "./pages/QuizPage";
import HistoryPage from "./pages/HistoryPage";
import ExercisesPage from "./pages/ExercisesPage";
import AdminDashboard from "./pages/AdminDashboard";
import AnamnesisPage from "./pages/AnamnesisPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import JournalPage from "./pages/JournalPage";
import NotFound from "./pages/NotFound";
import UnderConstruction from "./pages/UnderConstruction";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/avaliacao" component={IntroQuizPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/payment" component={PaymentPage} />

      {/* Patient routes */}
      <Route path="/dashboard" component={PatientDashboard} />
      <Route path="/anamnese" component={AnamnesisPage} />
      <Route path="/quiz" component={QuizPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/exercises" component={ExercisesPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/journal" component={JournalPage} />
      <Route path="/em-desenvolvimento" component={UnderConstruction} />

      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

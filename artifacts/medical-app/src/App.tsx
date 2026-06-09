import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "@/pages/HomePage";
import ChatbotPage from "@/pages/ChatbotPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import PostDetailPage from "@/pages/PostDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import MessagesPage from "@/pages/MessagesPage";
import AdminPage from "@/pages/AdminPage";
import SettingsPage from "@/pages/SettingsPage";
import CommunityPage from "@/pages/CommunityPage";
import CreatePostPage from "@/pages/CreatePostPage";
import FlashcardsPage from "@/pages/FlashcardsPage";
import QuizPage from "@/pages/QuizPage";
import NotesPage from "@/pages/NotesPage";
import PastQuestionsPage from "@/pages/PastQuestionsPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/feed" component={HomePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/chatbot" component={ChatbotPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/post/:id" component={PostDetailPage} />
      <Route path="/profile/:username" component={ProfilePage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/c/:slug" component={CommunityPage} />
      <Route path="/community/:slug" component={CommunityPage} />
      <Route path="/create" component={CreatePostPage} />
      <Route path="/create-post" component={CreatePostPage} />
      <Route path="/flashcards" component={FlashcardsPage} />
      <Route path="/quiz" component={QuizPage} />
      <Route path="/notes" component={NotesPage} />
      <Route path="/past-questions" component={PastQuestionsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;

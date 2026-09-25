import { Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { LoginPage, SignupPage } from "./pages/Auth";
import { DashboardPage } from "./pages/Dashboard";
import { CreateBattlePage } from "./pages/CreateBattle";
import { JoinPage } from "./pages/JoinPage";
import { GamePage } from "./pages/GamePage";
import { LeaderboardPage } from "./pages/Leaderboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/create" element={<CreateBattlePage />} />
      <Route path="/join/:code" element={<JoinPage />} />
      <Route path="/game/:gameId" element={<GamePage />} />
      <Route path="/demo" element={<GamePage demo />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/profile/:id" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

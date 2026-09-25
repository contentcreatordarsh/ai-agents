import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function DashboardPage() {
  const { user, loading } = useAuth();
  if (loading) return <p className="pad">Loading…</p>;
  if (!user) return <p className="pad">Please <Link to="/login">login</Link>.</p>;
  return (
    <div className="pad">
      <h1 className="brand-font">Command Center</h1>
      <p>Welcome, {user.displayName} · Level {user.level} · {user.totalXp.toLocaleString()} XP</p>
      <div className="grid">
        <Link className="glass card" to="/create">+ Create Battle</Link>
        <Link className="glass card" to="/demo">Demo City Battle</Link>
        <Link className="glass card" to="/leaderboard">Leaderboard</Link>
        <Link className="glass card" to={`/profile/${user.username}`}>Profile</Link>
      </div>
      <style>{`
        .pad { padding: 1.25rem; max-width: 900px; margin: 0 auto; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
        .card { padding: 1.25rem; font-weight: 700; text-align: center; color: var(--text); }
      `}</style>
    </div>
  );
}

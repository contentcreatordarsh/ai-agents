import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      nav("/dashboard");
    } catch {
      setErr("Invalid credentials");
    }
  };
  return (
    <AuthShell title="Enter the grid">
      <form onSubmit={submit} className="form glass">
        {err && <p className="err">{err}</p>}
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
        <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
        <button className="btn-primary" type="submit">Login</button>
        <p className="muted">No account? <Link to="/signup">Sign up</Link></p>
      </form>
    </AuthShell>
  );
}

export function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
      });
      nav("/dashboard");
    } catch {
      setErr("Could not create account");
    }
  };
  return (
    <AuthShell title="Join StrikeMap">
      <form onSubmit={submit} className="form glass">
        {err && <p className="err">{err}</p>}
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
        <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} /></label>
        <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} /></label>
        <button className="btn-primary" type="submit">Create account</button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="auth">
      <Link to="/" className="brand-font">STRIKEMAP</Link>
      <h1>{title}</h1>
      {children}
      <style>{`
        .auth { max-width: 420px; margin: 0 auto; padding: 2rem 1rem; }
        .form { padding: 1.25rem; display: grid; gap: 0.85rem; margin-top: 1rem; }
        label { display: grid; gap: 0.35rem; font-size: 0.9rem; }
        input { padding: 0.65rem; border-radius: 8px; border: 1px solid var(--border); background: #0c1018; color: var(--text); }
        .err { color: #ff6b8a; }
        .muted { color: var(--muted); }
      `}</style>
    </div>
  );
}

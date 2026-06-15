import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, LogOut, Shield, UserRound, UsersRound } from "lucide-react";
import { api, configureApi, tracedRequest } from "./api";
import { AuthProvider, useAuth } from "./auth";
import { loginSchema, registerSchema, type LoginForm, type RegisterForm } from "./schemas";
import type { AuthResponse, TraceEntry, User } from "./types";
import "./styles.css";

function AppShell() {
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const auth = useAuth();

  useEffect(() => {
    configureApi({
      addTrace: (entry) => setTraces((items) => [entry, ...items].slice(0, 12)),
      setTokens: auth.setTokens,
    });
  }, [auth.setTokens]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <div className="brand">Auth Lab</div>
          <div className="muted">React + FastAPI request tracing</div>
        </div>
        <nav>
          <NavLink to="/register">Регистрация</NavLink>
          <NavLink to="/login">Логин</NavLink>
          <NavLink to="/me">Кабинет</NavLink>
          <NavLink to="/admin/users">Пользователи</NavLink>
        </nav>
        <button className="ghost" onClick={auth.logout}>
          <LogOut size={16} /> Выйти
        </button>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/me" element={<Protected><ProfilePage /></Protected>} />
          <Route path="/admin/users" element={<Protected role="admin"><AdminUsersPage /></Protected>} />
        </Routes>
      </main>
      <TracePanel traces={traces} />
    </div>
  );
}

function RegisterPage() {
  const auth = useAuth();
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", username: "", full_name: "", password: "", role: "user" },
  });

  const submit = async (raw: RegisterForm) => {
    const payload = registerSchema.parse(raw);
    const response = await tracedRequest<AuthResponse>({
      title: "Register form submit",
      method: "POST",
      url: "/auth/register",
      rawForm: raw,
      parsedPayload: payload,
      requestBody: payload,
    });
    auth.setSession(response);
  };

  return (
    <section className="panel">
      <h1>Регистрация</h1>
      <form onSubmit={form.handleSubmit(submit)} className="form">
        <Field label="Email" error={form.formState.errors.email?.message}>
          <input {...form.register("email")} placeholder=" Ada@Example.COM " />
        </Field>
        <Field label="Username" error={form.formState.errors.username?.message}>
          <input {...form.register("username")} placeholder="ada_lovelace" />
        </Field>
        <Field label="Full name" error={form.formState.errors.full_name?.message}>
          <input {...form.register("full_name")} placeholder=" Ada Lovelace " />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <input type="password" {...form.register("password")} placeholder="password123" />
        </Field>
        <Field label="Role">
          <select {...form.register("role")}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </Field>
        <button type="submit"><UserRound size={16} /> Создать аккаунт</button>
      </form>
    </section>
  );
}

function LoginPage() {
  const auth = useAuth();
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = async (raw: LoginForm) => {
    const payload = loginSchema.parse(raw);
    const response = await tracedRequest<AuthResponse>({
      title: "Login form submit",
      method: "POST",
      url: "/auth/login",
      rawForm: raw,
      parsedPayload: payload,
      requestBody: payload,
    });
    auth.setSession(response);
  };

  return (
    <section className="panel">
      <h1>Логин</h1>
      <form onSubmit={form.handleSubmit(submit)} className="form">
        <Field label="Email" error={form.formState.errors.email?.message}>
          <input {...form.register("email")} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <input type="password" {...form.register("password")} />
        </Field>
        <button type="submit"><Shield size={16} /> Войти</button>
      </form>
    </section>
  );
}

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    tracedRequest<User>({ title: "Load current user", method: "GET", url: "/me" }).then(setUser);
  }, []);
  return <UserCard title="Личный кабинет" user={user} />;
}

function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    tracedRequest<User[]>({ title: "Load admin users", method: "GET", url: "/admin/users" }).then(setUsers);
  }, []);
  return (
    <section className="panel wide">
      <h1>Пользователи</h1>
      <div className="table">
        {users.map((user) => (
          <div className="row" key={user.id}>
            <span>{user.id}</span>
            <strong>{user.email}</strong>
            <span>{user.username}</span>
            <span className="badge">{user.role}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Protected({ children, role }: { children: React.ReactNode; role?: "admin" }) {
  const { user, accessToken } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <section className="panel"><h1>403</h1><p>Нужна роль admin.</p></section>;
  return children;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

function UserCard({ title, user }: { title: string; user: User | null }) {
  return (
    <section className="panel">
      <h1>{title}</h1>
      {user ? <pre>{JSON.stringify(user, null, 2)}</pre> : <p>Загрузка...</p>}
    </section>
  );
}

function TracePanel({ traces }: { traces: TraceEntry[] }) {
  return (
    <aside className="trace">
      <h2><Eye size={17} /> Trace</h2>
      <p className="muted">Сравнивайте raw form, parsed payload, request body и response body.</p>
      {traces.map((trace) => (
        <details key={trace.id} open>
          <summary>{trace.createdAt} · {trace.method} {trace.url} · {trace.status ?? "ERR"}</summary>
          <pre>{JSON.stringify(trace, null, 2)}</pre>
        </details>
      ))}
      {!traces.length && <div className="empty"><UsersRound size={18} /> Отправьте форму или откройте защищенную страницу.</div>}
    </aside>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

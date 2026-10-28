import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api/client';

/** Accesso, oppure creazione dell'account: chi si registra poi aggiunge la sua attività. */
export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const registering = mode === 'register';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (registering && password.length < 8) return setError('La password deve avere almeno 8 caratteri.');
    try {
      const { accessToken } = registering ? await api.register(name.trim(), email, password) : await api.login(email, password);
      setToken(accessToken);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="center">
      <form className="card login" onSubmit={onSubmit}>
        <h1>{registering ? 'Crea un account' : 'Accedi'}</h1>
        {registering && <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>}
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={registering ? 'new-password' : 'current-password'}
            required
          />
        </label>
        {registering && <p className="hint">Almeno 8 caratteri.</p>}
        {error && <p className="error">{error}</p>}
        <button type="submit">{registering ? 'Crea account' : 'Entra'}</button>
        <button type="button" className="ghost small" onClick={() => { setMode(registering ? 'login' : 'register'); setError(null); }}>
          {registering ? 'Hai già un account? Accedi' : 'Non hai un account? Creane uno'}
        </button>
      </form>
    </main>
  );
}

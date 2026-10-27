import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('freelance@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { accessToken } = await api.login(email, password);
      setToken(accessToken);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="center">
      <form className="card login" onSubmit={onSubmit}>
        <h1>Accedi</h1>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Entra</button>
        <p className="hint">Prova anche cliente@example.com per vedere la modalità Cliente.</p>
      </form>
    </main>
  );
}

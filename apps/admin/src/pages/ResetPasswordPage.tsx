import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, setToken } from '../api/client';
import { ChatIcon, EyeIcon } from '../components/Icons';

/** Dal link dell'email: si sceglie la nuova password e si entra direttamente. */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('codice') ?? '';
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('La password deve avere almeno 8 caratteri.');
    if (password !== again) return setError('Le due password non sono uguali.');
    setBusy(true);
    try {
      const { accessToken } = await api.resetPassword(token, password);
      setToken(accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="auth auth-single">
      <section className="auth-form-side">
        <div className="auth-mark"><span className="auth-mark-icon"><ChatIcon size={18} /></span>Pannello del sito</div>
        {!token ? (
          <div className="auth-form">
            <h1>Link non completo</h1>
            <p className="auth-lead">Apri il link direttamente dall'email, oppure chiedine uno nuovo.</p>
            <Link className="button" to="/login">Torna all'accesso</Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit}>
            <h1>Scegli la nuova password</h1>
            <p className="auth-lead">Almeno 8 caratteri. Poi entri direttamente nel pannello.</p>
            <label>
              Nuova password
              <span className="password-field">
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required autoFocus />
                <button type="button" className="reveal-password" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? 'Nascondi la password' : 'Mostra la password'}>
                  <EyeIcon size={17} />
                </button>
              </span>
            </label>
            <label>Ripetila<input type={show ? 'text' : 'password'} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required /></label>
            {error && <p className="error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit" disabled={busy}>{busy ? 'Un attimo…' : 'Salva ed entra'}</button>
            <p className="auth-switch"><Link to="/login">Torna all'accesso</Link></p>
          </form>
        )}
      </section>
    </main>
  );
}

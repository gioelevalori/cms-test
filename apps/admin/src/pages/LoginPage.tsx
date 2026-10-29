import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api/client';
import { ChatIcon, CheckIcon, EyeIcon, SearchIcon } from '../components/Icons';

/** Accesso, oppure creazione dell'account: chi si registra poi aggiunge la sua attività. */
export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (registering && password.length < 8) return setError('La password deve avere almeno 8 caratteri.');
    setBusy(true);
    try {
      const { accessToken } = registering ? await api.register(name.trim(), email, password) : await api.login(email, password);
      setToken(accessToken);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-form-side">
        <div className="auth-mark"><span className="auth-mark-icon"><ChatIcon size={18} /></span>Pannello del sito</div>

        <form className="auth-form" onSubmit={onSubmit}>
          <h1>{registering ? 'Crea il tuo account' : 'Accedi al tuo sito'}</h1>
          <p className="auth-lead">
            {registering
              ? 'Poi aggiungi la tua attività: orari, menu e contatti li scrivi dopo, con parole tue.'
              : 'Orari, menu, prezzi e foto si cambiano scrivendo, come a un collaboratore.'}
          </p>

          {registering && (
            <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Come ti chiami" required /></label>
          )}
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nome@esempio.it" required /></label>
          <label>
            Password
            <span className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={registering ? 'new-password' : 'current-password'}
                required
              />
              <button type="button" className="reveal-password" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword} aria-label={showPassword ? 'Nascondi la password' : 'Mostra la password'}>
                <EyeIcon size={17} />
              </button>
            </span>
          </label>
          {registering && <p className="hint">Almeno 8 caratteri.</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Un attimo…' : registering ? 'Crea account' : 'Entra'}
          </button>
          <p className="auth-switch">
            {registering ? 'Hai già un account?' : 'Non hai un account?'}{' '}
            <button type="button" className="link" onClick={() => { setMode(registering ? 'login' : 'register'); setError(null); }}>
              {registering ? 'Accedi' : 'Creane uno'}
            </button>
          </p>
        </form>

        <p className="auth-foot">Il sito si aggiorna anche da WhatsApp, quando colleghi il tuo numero.</p>
      </section>

      {/* Com'è fatto davvero il lavoro: un messaggio, l'anteprima, la conferma, il sito aggiornato. */}
      <aside className="auth-show" aria-label="Come funziona">
        <div className="demo" aria-hidden="true">
          <p className="demo-bubble demo-me">Sabato chiudiamo alle 15</p>
          <div className="demo-bubble demo-bot">
            <strong>Ecco cosa cambierà:</strong>
            <span>Sabato: aperto fino alle 15:00</span>
            <span className="demo-buttons"><span className="demo-btn is-primary">Conferma</span><span className="demo-btn">Annulla</span></span>
          </div>
          <p className="demo-bubble demo-bot demo-done"><CheckIcon size={16} />Fatto: il sito è aggiornato.</p>
          <div className="demo-site">
            <span className="demo-site-logo">M</span>
            <span className="demo-site-text">
              <span className="demo-site-name">Pizzeria da Mario</span>
              <span className="demo-site-status"><span className="demo-dot" />Sabato aperto fino alle 15</span>
            </span>
          </div>
        </div>

        <ul className="auth-points">
          <li><ChatIcon /><span><strong>Scrivi come parli</strong> Dal pannello o da WhatsApp, anche più cose in un messaggio.</span></li>
          <li><EyeIcon /><span><strong>Vedi prima di pubblicare</strong> Ogni modifica ha la sua anteprima; senza conferma il sito non cambia.</span></li>
          <li><SearchIcon /><span><strong>Pronto per Google</strong> Orari, menu e contatti escono in un formato che i motori di ricerca leggono.</span></li>
        </ul>
      </aside>
    </main>
  );
}

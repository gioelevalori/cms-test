/**
 * Gli indirizzi del pannello: solo loro possono mostrare la pagina in modifica in un riquadro
 * e mandarle la bozza. ADMIN_ORIGIN (separati da virgola) li sostituisce.
 */
export const ADMIN_ORIGINS = process.env.ADMIN_ORIGIN
  ? process.env.ADMIN_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean)
  : ['http://localhost:5173', 'https://cms-test-admin.onrender.com'];

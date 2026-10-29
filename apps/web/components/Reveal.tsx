'use client';

import { useEffect } from 'react';

/** Cosa entra allo scorrimento: titoli, voci, orari, novità, foto, piè di pagina. */
const TARGETS = [
  '.site-section h2', '.site-jump', '.site-group h3', '.site-group li', '.site-hours li', '.site-news li',
  '.site-highlights li', '.site-about p', '.where-body', '.site-gallery figure', '.site-footer > *',
].join(', ');

/** Ritardo tra elementi che entrano insieme, e ritardo massimo: la cascata non deve far aspettare. */
const STEP_MS = 55;
const MAX_MS = 330;

/**
 * Le parti del sito ancora sotto lo schermo entrano quando ci arrivano, una dopo l'altra.
 * Ciò che è già visibile all'apertura non si tocca; senza JavaScript o con il movimento ridotto non si nasconde nulla.
 */
export function Reveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = [...document.querySelectorAll<HTMLElement>(TARGETS)].filter((el) => el.getBoundingClientRect().top > innerHeight);
    if (!els.length) return;

    const io = new IntersectionObserver((entries) => {
      let i = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.style.setProperty('--rv-delay', `${Math.min(i++ * STEP_MS, MAX_MS)}ms`);
        el.classList.remove('rv-wait');
        io.unobserve(el);
        // Finita l'entrata, l'elemento torna normale: niente ritardi sui passaggi del mouse.
        el.addEventListener('transitionend', () => el.style.removeProperty('--rv-delay'), { once: true });
      }
      // Nessun margine in basso: l'ultima riga della pagina deve poter entrare anche a fine scorrimento.
    }, { threshold: 0.01 });

    for (const el of els) {
      el.classList.add('rv', 'rv-wait');
      io.observe(el);
    }
    return () => {
      io.disconnect();
      for (const el of els) el.classList.remove('rv', 'rv-wait');
    };
  }, []);
  return null;
}

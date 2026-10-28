import type { ReactNode } from 'react';
// Caratteri degli stili del sito: il browser scarica solo quelli che lo stile scelto usa.
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import '@fontsource/onest/600.css';
import '@fontsource/onest/700.css';
import '@fontsource/gloock/400.css';
import '@fontsource/archivo/800.css';
import '@fontsource/young-serif/400.css';
import '@fontsource/unbounded/700.css';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}

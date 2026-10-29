/** Icone a tratto unico, 24×24, ereditano il colore del testo. */
function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const ChatIcon = (p: { size?: number }) => <Icon {...p} d="M4 5h16v11H9l-5 4V5Z" />;
export const EyeIcon = (p: { size?: number }) => <Icon {...p} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />;
export const CheckIcon = (p: { size?: number }) => <Icon {...p} d="m5 12.5 4.5 4.5L19 7.5" />;
export const SearchIcon = (p: { size?: number }) => <Icon {...p} d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4-4" />;
export const ExternalIcon = (p: { size?: number }) => <Icon {...p} d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />;
export const PlusIcon = (p: { size?: number }) => <Icon {...p} d="M12 5v14M5 12h14" />;
export const ExitIcon = (p: { size?: number }) => <Icon {...p} d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4" />;
export const PhotoIcon = (p: { size?: number }) => <Icon {...p} d="M4 6h16v12H4V6Zm0 9 4.5-4.5L13 15m-1-1 2.5-2.5L20 17M15.5 9.5h.01" />;
export const ListIcon = (p: { size?: number }) => <Icon {...p} d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />;
export const ClockIcon = (p: { size?: number }) => <Icon {...p} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4.5l3 2" />;

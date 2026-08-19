import { AlertCircle, LoaderCircle, PackageOpen } from 'lucide-react';

export function LoadingState({ label = 'Loading the vault' }: { label?: string }) {
  return <div className="state-panel" role="status"><LoaderCircle className="spin" size={26} /><p>{label}…</p></div>;
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="state-panel" role="alert"><AlertCircle size={28} /><p>{message}</p>{retry && <button className="text-button" onClick={retry}>Try again</button>}</div>;
}
export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return <div className="state-panel empty"><PackageOpen size={34} /><h2>{title}</h2><p>{copy}</p>{action}</div>;
}

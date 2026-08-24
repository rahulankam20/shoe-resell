import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEOMeta } from '../hooks/useSEOMeta';

export default function NotFoundPage() {
  useSEOMeta({
    title: 'Page Not Found | SOLEVAULT',
    description: 'The sneaker pair or page you are looking for does not exist in the vault.',
  });

  return (
    <div className="not-found page-shell">
      <p className="eyebrow accent">404 · OUT OF STOCK</p>
      <h1>THIS PAGE<br />LEFT THE VAULT.</h1>
      <p>Let's get you back to the pairs that matter.</p>
      <Link className="button dark" to="/"><ArrowLeft /> Back home</Link>
    </div>
  );
}

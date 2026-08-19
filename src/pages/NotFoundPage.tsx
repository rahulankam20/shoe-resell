import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function NotFoundPage() { return <div className="not-found page-shell"><p className="eyebrow accent">404 · OUT OF STOCK</p><h1>THIS PAGE<br />LEFT THE VAULT.</h1><p>Let's get you back to the pairs that matter.</p><Link className="button dark" to="/"><ArrowLeft /> Back home</Link></div>; }

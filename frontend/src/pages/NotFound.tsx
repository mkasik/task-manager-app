import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-5xl font-extrabold text-slate-900">404</h1>
            <p className="text-slate-500 mt-2">Page not found.</p>
            <Link to="/" className="btn-primary mt-6">Go Home</Link>
        </div>
    );
}

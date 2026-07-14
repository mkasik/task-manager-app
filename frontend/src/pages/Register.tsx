import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            navigate('/dashboard');
        } catch (err) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
            setError(message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center mx-auto">
                        <UserPlus size={20} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-xl font-extrabold text-slate-900 mt-3">Create your account</h1>
                </div>

                <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                    {error && <div className="text-sm bg-red-50 text-red-600 rounded-lg px-3 py-2">{error}</div>}
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                        <input required className="input-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Email</label>
                        <input required type="email" className="input-field mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Password</label>
                        <input required type="password" minLength={6} className="input-field mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating…' : 'Create Account'}</button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-4">
                    Already have an account? <Link to="/login" className="text-brand-600 font-semibold">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

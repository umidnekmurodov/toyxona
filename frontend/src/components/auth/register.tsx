import api from '../../utils/api';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/users/register', formData);

      const { token, user } = response.data;

      // Store in auth context
      login(token, user);

      // Redirect to user dashboard
      navigate('/user/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Register qilishda xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="min-h-screen bg-luxury-50 dark:bg-luxury-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      
      {/* Register Card */}
      <div className="w-full max-w-md bg-white dark:bg-luxury-900 border border-luxury-200/60 dark:border-luxury-800/60 p-8 sm:p-10 rounded-3xl shadow-premium animate-scale-in">
        
        {/* Title */}
        <div className="text-center mb-8">
          <span className="text-3xl block mb-2 filter drop-shadow">💍</span>
          <h2 className="text-2xl font-bold font-poppins text-luxury-900 dark:text-white">Ro'yxatdan O'tish</h2>
          <p className="text-xs text-luxury-500 dark:text-luxury-400 mt-1">To'yxona.uz premium platformasining bir qismi bo'ling</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold p-4 rounded-xl mb-6">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Full Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-luxury-500 dark:text-luxury-400 uppercase tracking-wider">To'liq ism-sharifingiz</label>
            <input
              type="text"
              name="fullname"
              placeholder="Masalan: Sardor Rahimov"
              value={formData.fullname}
              onChange={handleChange}
              required
              className="w-full bg-luxury-100/40 dark:bg-luxury-950/40 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 transition-all"
            />
          </div>

          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-luxury-500 dark:text-luxury-400 uppercase tracking-wider">Email Manzil</label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-luxury-100/40 dark:bg-luxury-950/40 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 transition-all"
            />
          </div>

          {/* Phone Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-luxury-500 dark:text-luxury-400 uppercase tracking-wider">Telefon Raqam</label>
            <input
              type="tel"
              name="phone"
              placeholder="+998 (90) 123-45-67"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full bg-luxury-100/40 dark:bg-luxury-950/40 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-luxury-500 dark:text-luxury-400 uppercase tracking-wider">Xavfsiz Parol</label>
            <input
              type="password"
              name="password"
              placeholder="Min. 8 ta belgi"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-luxury-100/40 dark:bg-luxury-950/40 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gold-gradient text-luxury-950 font-bold py-4 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300 text-center flex items-center justify-center gap-2 mt-4"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-luxury-950/30 border-t-luxury-950 rounded-full animate-spin" />
            )}
            <span>{loading ? 'Kutilmoqda...' : 'Ro\'yxatdan o\'tish'}</span>
          </button>
        </form>

        <p className="text-xs text-luxury-500 dark:text-luxury-400 text-center mt-8 border-t border-luxury-100 dark:border-luxury-800/80 pt-6">
          Akkauntingiz bormi?{' '}
          <Link to="/login" className="text-gold-500 hover:underline font-bold transition-all">
            Tizimga kiring
          </Link>
        </p>

      </div>
      
    </div>
  );
}

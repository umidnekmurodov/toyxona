import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import HallsSearch from './components/user/HallsSearch';
import HallDetail from './components/user/HallDetail';
import UserDashboard from './components/user/UserDashboard';
import OwnerDashboard from './components/owner/OwnerDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Login from './components/auth/login';
import Register from './components/auth/register';
import { translations as t } from './utils/translations';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Taklifnoma from './components/user/Taklifnoma';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <>
          <Header />
          <Routes>
            <Route path="/" element={<HallsSearch />} />
            <Route path="/halls/:hallId" element={<HallDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/taklifnoma" element={<Taklifnoma />} />
            <Route path="/user/dashboard" element={
              <ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>
            } />
            <Route path="/owner/dashboard" element={
              <ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
          </Routes>
        </>
      </AuthProvider>
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Kunduzi rejimga o'tish" : "Tungi rejimga o'tish"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="relative w-14 h-7 rounded-full border transition-all duration-500 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 flex-shrink-0"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1F2937 0%, #111827 100%)'
          : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        borderColor: isDark ? 'rgba(200,155,60,0.4)' : 'rgba(125,211,252,0.6)',
        boxShadow: isDark
          ? '0 0 12px rgba(200,155,60,0.25), inset 0 1px 3px rgba(0,0,0,0.5)'
          : '0 0 12px rgba(125,211,252,0.4), inset 0 1px 3px rgba(255,255,255,0.6)',
      }}
    >
      {/* Track icons */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] select-none pointer-events-none">
        {isDark ? '🌙' : ''}
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] select-none pointer-events-none">
        {!isDark ? '☀️' : ''}
      </span>

      {/* Thumb */}
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          left: isDark ? 'calc(100% - 1.625rem)' : '0.125rem',
          background: isDark
            ? 'linear-gradient(135deg, #C89B3C 0%, #E6D2A4 100%)'
            : 'linear-gradient(135deg, #fbbf24 0%, #fde68a 100%)',
          boxShadow: isDark
            ? '0 2px 8px rgba(200,155,60,0.6)'
            : '0 2px 8px rgba(251,191,36,0.6)',
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b transition-all duration-500"
      style={{
        background: isDark
          ? 'rgba(9, 13, 22, 0.97)'
          : 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderColor: isDark
          ? 'rgba(200, 155, 60, 0.15)'
          : 'rgba(229, 231, 235, 0.8)',
        boxShadow: isDark
          ? '0 1px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,155,60,0.05)'
          : '0 1px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <span className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">💍</span>
          <span className="text-xl font-bold font-poppins tracking-wide bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 bg-clip-text text-transparent">
            To'yxona.uz
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium flex-1 justify-end">
          <Link
            to="/"
            className="transition-colors duration-200 font-medium"
            style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C89B3C')}
            onMouseLeave={e => (e.currentTarget.style.color = isDark ? '#D1D5DB' : '#4B5563')}
          >
            {t.home}
          </Link>

          {user ? (
            <>
              {user.role === 'user' && (
                <Link
                  to="/user/dashboard"
                  className="flex items-center gap-1.5 transition-colors duration-200"
                  style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#C89B3C')}
                  onMouseLeave={e => (e.currentTarget.style.color = isDark ? '#D1D5DB' : '#4B5563')}
                >
                  <span>📊</span> {t.userDashboard}
                </Link>
              )}
              {user.role === 'owner' && (
                <Link
                  to="/owner/dashboard"
                  className="flex items-center gap-1.5 transition-colors duration-200"
                  style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#C89B3C')}
                  onMouseLeave={e => (e.currentTarget.style.color = isDark ? '#D1D5DB' : '#4B5563')}
                >
                  <span>🏛️</span> {t.ownerDashboard}
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 transition-colors duration-200"
                  style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#C89B3C')}
                  onMouseLeave={e => (e.currentTarget.style.color = isDark ? '#D1D5DB' : '#4B5563')}
                >
                  <span>🛡️</span> {t.adminDashboard}
                </Link>
              )}

              <div
                className="h-5 w-px flex-shrink-0"
                style={{ background: isDark ? '#374151' : '#E5E7EB' }}
              />

              <span
                className="flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-xs border flex-shrink-0"
                style={{
                  background: isDark ? 'rgba(31,41,55,0.8)' : '#F9FAFB',
                  borderColor: isDark ? 'rgba(200,155,60,0.25)' : '#E5E7EB',
                  color: isDark ? '#E5E7EB' : '#374151',
                }}
              >
                <span className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 text-[10px]">👤</span>
                {user.fullname}
              </span>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 border border-red-500/30 hover:border-red-500 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer flex-shrink-0"
                style={{ color: '#ef4444' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                {t.logout}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="transition-colors duration-200"
                style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#C89B3C')}
                onMouseLeave={e => (e.currentTarget.style.color = isDark ? '#D1D5DB' : '#4B5563')}
              >
                {t.login}
              </Link>
              <Link
                to="/register"
                className="gold-gradient text-luxury-950 font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/25 active:scale-95 flex-shrink-0"
              >
                {t.register}
              </Link>
            </>
          )}

          {/* Dark/Light Mode Toggle */}
          <ThemeToggle />
        </nav>

        {/* Mobile: toggle + burger */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button
            className="p-2 rounded-lg transition-colors"
            style={{
              color: isDark ? '#D1D5DB' : '#4B5563',
              background: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1F2937' : '#F3F4F6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

      </div>
    </header>
  );
}

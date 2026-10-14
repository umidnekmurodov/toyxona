import api from '../../utils/api';
import { useState, useEffect } from 'react';
import { translations as t } from '../../utils/translations';
import { Link } from 'react-router-dom';
import { ToastContainer, useToast } from '../Toast';

interface Booking {
  booking_id: string;
  hall_id: string;
  booking_date: string;
  guest_count: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  note: string;
}

interface Favorite {
  hall_id: string;
  hall_name: string;
  region: string;
  price_per_seat: string;
  rating: string;
}

interface Review {
  review_id: string;
  hall_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

type TabType = 'bookings' | 'favorites' | 'reviews' | 'profile';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { toasts, addToast, removeToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const token = localStorage.getItem('token');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts;
    const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bookings') {
        const res = await api.get(`/bookings/user/bookings`);
        setBookings(res.data);
      } else if (activeTab === 'favorites') {
        const res = await api.get(`/favorites/user/favorites`);
        setFavorites(res.data);
      } else if (activeTab === 'reviews') {
        const res = await api.get(`/reviews`);
        setReviews(res.data);
      } else if (activeTab === 'profile') {
        const res = await api.get(`/users/profile`);
        setProfile(res.data);
      }
    } catch (error) {
      console.error('Data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      addToast('Login qiling', 'warning');
      return;
    }
    loadData();
  }, [activeTab]);

  const handleCancelBooking = (bookingId: string) => {
    setConfirmModal({
      message: 'Haqiqatdan ham bronni bekor qilmoqchisiz?',
      onConfirm: async () => {
        try {
          await api.put(`/bookings/${bookingId}/cancel`, {});
          addToast('Booking bekor qilindi', 'success');
          loadData();
        } catch (error: any) {
          addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
    });
  };

  const handleRemoveFavorite = async (hallId: string) => {
    try {
      await api.delete(`/favorites/${hallId}`);
      addToast('Sevimlilardan o\'chirildi', 'success');
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + error.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-50 dark:bg-luxury-950 transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Banner / Title Row */}
      <section className="bg-luxury-900 border-b border-gold-500/20 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-gold-500 uppercase tracking-widest">Shaxsiy Kabinet</span>
            <h1 className="text-3xl font-bold font-poppins mt-1">
              Foydalanuvchi <span className="bg-gradient-to-r from-gold-400 to-gold-200 bg-clip-text text-transparent">Boshqaruv Paneli</span>
            </h1>
          </div>
          <div className="flex gap-4 text-sm text-luxury-300">
            <span className="bg-luxury-800 px-4 py-2 rounded-xl border border-luxury-700/50">
              📅 Sana: {new Date().toLocaleDateString('uz-UZ')}
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid: Sidebar Menu + Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Dashboard Left Sidebar Tabs */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {[
              { id: 'bookings', label: t.bookings, icon: '📅' },
              { id: 'favorites', label: t.favorites, icon: '❤️' },
              { id: 'reviews', label: t.reviews, icon: '⭐' },
              { id: 'profile', label: t.profile, icon: '👤' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer text-left border ${
                  activeTab === tab.id
                    ? 'bg-luxury-900 text-gold-500 border-gold-500/30 shadow-md dark:bg-luxury-900'
                    : 'bg-white hover:bg-luxury-100/50 text-luxury-700 border-luxury-200/50 hover:border-luxury-200 dark:bg-luxury-900 dark:hover:bg-luxury-800/50 dark:text-luxury-300 dark:border-luxury-800/80 dark:hover:border-luxury-800'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Dashboard Main Content Area */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Loading Overlay */}
            {loading && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-12 text-center shadow-premium flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-gold-500/20 border-t-gold-500 animate-spin" />
                <span className="text-sm font-medium text-luxury-500">Ma'lumotlar yuklanmoqda...</span>
              </div>
            )}

            {/* Bookings View */}
            {activeTab === 'bookings' && !loading && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium animate-fade">
                <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-6 border-b border-luxury-100 dark:border-luxury-800/80 pb-4">
                  Mening Band Qilgan Zallarim
                </h3>

                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-luxury-500">
                    <span className="text-4xl block mb-4">📅</span>
                    <p className="font-semibold text-sm">Sizda hali hech qanday faol bronlar mavjud emas</p>
                    <Link to="/" className="text-xs text-gold-500 underline mt-2 block">To'yxonalarni ko'rish</Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {bookings.map((booking) => (
                      <div 
                        key={booking.booking_id}
                        className="border border-luxury-200/60 dark:border-luxury-800/60 rounded-2xl p-5 hover:border-gold-500/30 transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                                booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                booking.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                booking.status === 'cancelled' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                'bg-luxury-100 text-luxury-600 border-luxury-200'
                              }`}>
                                {booking.status === 'pending' && '⏳ Kutilmoqda'}
                                {booking.status === 'confirmed' && '✅ Tasdiqlangan'}
                                {booking.status === 'cancelled' && '❌ Bekor qilingan'}
                                {booking.status === 'completed' && '🎉 Tugallandi'}
                              </span>
                              <span className="text-xs text-luxury-400">ID: #{booking.booking_id.substring(0, 8)}</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-6 text-sm mt-3">
                              <p className="text-luxury-600 dark:text-luxury-400">
                                <strong className="text-luxury-900 dark:text-white">Sana:</strong> {formatDate(booking.booking_date)}
                              </p>
                              <p className="text-luxury-600 dark:text-luxury-400">
                                <strong className="text-luxury-900 dark:text-white">Mehmonlar:</strong> {booking.guest_count} kishi
                              </p>
                              <p className="text-luxury-600 dark:text-luxury-400 col-span-2 sm:col-span-1">
                                <strong className="text-luxury-900 dark:text-white">Jami summa:</strong> <span className="text-gold-500 font-bold">${booking.total_price}</span>
                              </p>
                            </div>
                            
                            {booking.note && (
                              <p className="text-xs text-luxury-400 mt-2 bg-luxury-50 dark:bg-luxury-950 p-2 rounded-lg italic">
                                "Izoh: {booking.note}"
                              </p>
                            )}
                          </div>

                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBooking(booking.booking_id)}
                              className="w-full sm:w-auto px-4 py-2 border border-red-500/30 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer text-center"
                            >
                              Bekor qilish
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorites View */}
            {activeTab === 'favorites' && !loading && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium animate-fade">
                <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-6 border-b border-luxury-100 dark:border-luxury-800/80 pb-4">
                  Sevimli To'yxonalarim
                </h3>

                {favorites.length === 0 ? (
                  <div className="text-center py-12 text-luxury-500">
                    <span className="text-4xl block mb-4">❤️</span>
                    <p className="font-semibold text-sm">Sevimlilar ro'yxati hozircha bo'sh</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {favorites.map((fav) => (
                      <div 
                        key={fav.hall_id}
                        className="border border-luxury-200/60 dark:border-luxury-800/60 rounded-2xl p-5 hover:border-gold-500/30 transition-all duration-300 bg-white dark:bg-luxury-900"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-base text-luxury-900 dark:text-white">{fav.hall_name}</h4>
                          <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded border border-amber-500/20 font-bold flex items-center gap-0.5">
                            ⭐ {fav.rating || 'N/A'}
                          </span>
                        </div>
                        
                        <p className="text-xs text-luxury-500 dark:text-luxury-400 mb-3">📍 {fav.region}</p>
                        
                        <p className="text-sm text-luxury-600 dark:text-luxury-300 mb-5">
                          Narxi: <strong className="text-luxury-900 dark:text-white">${fav.price_per_seat}</strong> / kishi
                        </p>

                        <div className="flex gap-3">
                          <Link
                            to={`/halls/${fav.hall_id}`}
                            className="flex-1 text-center border border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-luxury-950 font-semibold py-2 rounded-xl text-xs transition-colors duration-350 cursor-pointer"
                          >
                            Zalni ko'rish
                          </Link>
                          <button
                            onClick={() => handleRemoveFavorite(fav.hall_id)}
                            className="px-3 py-2 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs transition-colors duration-300 cursor-pointer"
                            title="Sevimlilardan o'chirish"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews View */}
            {activeTab === 'reviews' && !loading && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium animate-fade">
                <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-6 border-b border-luxury-100 dark:border-luxury-800/80 pb-4">
                  Mening Sharhlarim
                </h3>

                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-luxury-500">
                    <span className="text-4xl block mb-4">⭐</span>
                    <p className="font-semibold text-sm">Siz hali biror zolga sharh yozmagansiz</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.map((review) => (
                      <div 
                        key={review.review_id}
                        className="bg-luxury-50 dark:bg-luxury-950 border border-luxury-200/40 dark:border-luxury-800/40 rounded-2xl p-5"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-yellow-400">
                            {'⭐'.repeat(review.rating)}
                          </span>
                          <span className="text-xs text-luxury-400">
                            {new Date(review.created_at).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                        <p className="text-sm text-luxury-600 dark:text-luxury-300 italic leading-relaxed">
                          "{review.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile View */}
            {activeTab === 'profile' && !loading && profile && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium animate-fade">
                <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-6 border-b border-luxury-100 dark:border-luxury-800/80 pb-4">
                  Profil Ma'lumotlari
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1 bg-luxury-100/40 dark:bg-luxury-950/40 border border-luxury-200/30 dark:border-luxury-800/30 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-luxury-400 uppercase tracking-widest">To'liq ism</span>
                    <span className="text-sm font-bold text-luxury-800 dark:text-white">{profile.fullname}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1 bg-luxury-100/40 dark:bg-luxury-950/40 border border-luxury-200/30 dark:border-luxury-800/30 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-luxury-400 uppercase tracking-widest">Elektron pochta</span>
                    <span className="text-sm font-bold text-luxury-800 dark:text-white">{profile.email}</span>
                  </div>

                  <div className="flex flex-col gap-1 bg-luxury-100/40 dark:bg-luxury-950/40 border border-luxury-200/30 dark:border-luxury-800/30 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-luxury-400 uppercase tracking-widest">Telefon raqam</span>
                    <span className="text-sm font-bold text-luxury-800 dark:text-white">{profile.phone || 'Kiritilmagan'}</span>
                  </div>

                  <div className="flex flex-col gap-1 bg-luxury-100/40 dark:bg-luxury-950/40 border border-luxury-200/30 dark:border-luxury-800/30 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-luxury-400 uppercase tracking-widest">Foydalanuvchi roli</span>
                    <span className="text-sm font-bold text-gold-500 flex items-center gap-1">
                      <span>👤</span> {profile.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* ===== CUSTOM CONFIRM MODAL ===== */}
      {confirmModal && (
        <div
          className="fixed inset-0 bg-luxury-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[2000] animate-fade"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="bg-white dark:bg-luxury-900 border border-luxury-200 dark:border-luxury-800 rounded-3xl max-w-sm w-full shadow-2xl p-6 sm:p-8 animate-scale-in text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
            <h2 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-2">Tasdiqlash kerak</h2>
            <p className="text-sm text-luxury-500 dark:text-luxury-400 mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl cursor-pointer text-sm transition-colors"
              >
                Ha, bekor qilish
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 font-semibold py-3 rounded-xl cursor-pointer transition-colors text-sm"
              >
                Yo'q, qolsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

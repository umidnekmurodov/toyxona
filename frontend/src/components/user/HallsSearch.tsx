import api from '../../utils/api';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, useToast } from '../Toast';

interface Hall {
  hall_id: string;
  hall_name: string;
  description: string;
  region: string;
  district: string;
  capacity: number;
  price_per_seat: string;
  rating: string;
  main_image: string;
  wifi: boolean;
  parking: boolean;
  air_conditioner: boolean;
  is_favorited?: boolean;
  favorites_count?: number;
}

export default function HallsSearch() {
  const [filteredHalls, setFilteredHalls] = useState<Hall[]>([]);
  const [region, setRegion] = useState('');
  const [capacity, setCapacity] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchHalls = async (params?: any) => {
    try {
      setLoading(true);
      const query = new URLSearchParams(params || {}).toString();
      const response = await api.get(`/halls?${query}`);
      setFilteredHalls(response.data);
    } catch (error) {
      console.error('Halls fetch error:', error);
      addToast("To'yxonalar yuklanishida xato yuz berdi", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (hallId: string, isFavorited: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) {
      addToast("Sevimlilarga qo'shish uchun tizimga kiring", 'warning');
      return;
    }

    try {
      if (isFavorited) {
        await api.delete(`/favorites/${hallId}`);
        setFilteredHalls((prev) =>
          prev.map((h) =>
            h.hall_id === hallId
              ? {
                  ...h,
                  is_favorited: false,
                  favorites_count: Math.max(0, (h.favorites_count || 0) - 1),
                }
              : h
          )
        );
        if (selectedHall && selectedHall.hall_id === hallId) {
          setSelectedHall(prev => prev ? {
            ...prev,
            is_favorited: false,
            favorites_count: Math.max(0, (prev.favorites_count || 0) - 1),
          } : null);
        }
      } else {
        await api.post(`/favorites`, { hallId });
        setFilteredHalls((prev) =>
          prev.map((h) =>
            h.hall_id === hallId
              ? {
                  ...h,
                  is_favorited: true,
                  favorites_count: (h.favorites_count || 0) + 1,
                }
              : h
          )
        );
        if (selectedHall && selectedHall.hall_id === hallId) {
          setSelectedHall(prev => prev ? {
            ...prev,
            is_favorited: true,
            favorites_count: (prev.favorites_count || 0) + 1,
          } : null);
        }
      }
    } catch (err: any) {
      addToast('Xato: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  const handleFilter = () => {
    const params: any = {};
    if (region) params.region = region;
    if (capacity) params.capacity = parseInt(capacity);
    if (sortBy) params.sortBy = sortBy;
    
    fetchHalls(params);
  };

  const handleReset = () => {
    setRegion('');
    setCapacity('');
    setSortBy('');
    fetchHalls();
  };

  return (
    <div className="min-h-screen bg-luxury-50 dark:bg-luxury-950 transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-luxury-900 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-gold-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-950/40 via-luxury-950 to-luxury-950 opacity-90 z-0" />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-0" />

        <div className="max-w-7xl mx-auto relative z-10 text-center animate-slide-up">
          <span className="inline-block text-gold-500 font-medium text-sm tracking-widest uppercase mb-3 border border-gold-500/30 px-3 py-1 rounded-full bg-gold-500/5">
            Loyiha Uzbekistan
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-poppins tracking-tight text-white mb-6">
            Eng Muhtasham <span className="bg-gradient-to-r from-gold-400 via-gold-200 to-gold-500 bg-clip-text text-transparent">To'yxonalar</span> Platformasi
          </h1>
          <p className="text-luxury-300 max-w-2xl mx-auto text-lg sm:text-xl font-light leading-relaxed mb-8">
            Hayotingizdagi eng unutilmas va baxtli kunni mukammal darajada rejalashtiring. Premium to'yxonalarni qulay va tez bron qiling.
          </p>
          
          {/* Hero Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12 border-t border-luxury-800/60 pt-8 text-center">
            <div>
              <p className="text-3xl font-bold text-gold-500">120+</p>
              <p className="text-xs text-luxury-400 uppercase tracking-wider mt-1">Saralangan zallar</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gold-500">50,000+</p>
              <p className="text-xs text-luxury-400 uppercase tracking-wider mt-1">Mamnun mehmonlar</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gold-500">100%</p>
              <p className="text-xs text-luxury-400 uppercase tracking-wider mt-1">Xavfsiz to'lovlar</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gold-500">24/7</p>
              <p className="text-xs text-luxury-400 uppercase tracking-wider mt-1">Mijozlarni qo'llab-quvvatlash</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Search and Filter Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 -mt-10">
        
        {/* Filter Box */}
        <div className="bg-white dark:bg-luxury-900 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-luxury-800/60 rounded-3xl p-6 sm:p-8 mb-10 transition-all duration-300">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-luxury-800/60">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔍</span>
              <h3 className="text-lg font-semibold font-poppins text-gray-900 dark:text-white">To'yxonalarni Saralash</h3>
            </div>
            <button 
              onClick={handleReset}
              className="text-xs text-gold-600 hover:text-gold-700 dark:text-gold-400 font-semibold cursor-pointer transition-colors"
            >
              Filtrlarni tozalash
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Region */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-luxury-400 uppercase tracking-wider">Viloyat / Shahar</label>
              <div className="relative">
                <select 
                  value={region} 
                  onChange={(e) => setRegion(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-luxury-950 text-gray-900 dark:text-white border border-gray-200 dark:border-luxury-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Barcha hududlar</option>
                  <option value="Tashkent">Toshkent</option>
                  <option value="Samarkand">Samarqand</option>
                  <option value="Bukhara">Buxoro</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Capacity */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-luxury-400 uppercase tracking-wider">Minimal Sig'im (Kishi)</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Masalan: 300"
                className="w-full bg-gray-50 dark:bg-luxury-950 text-gray-900 dark:text-white border border-gray-200 dark:border-luxury-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-luxury-600"
              />
            </div>

            {/* Sort */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-luxury-400 uppercase tracking-wider">Saralash Tartibi</label>
              <div className="relative">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-luxury-950 text-gray-900 dark:text-white border border-gray-200 dark:border-luxury-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Standart</option>
                  <option value="price">Narx (arzondan qimmatga)</option>
                  <option value="rating">Reyting (yuqori reytinglilar)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleFilter} 
              className="gold-gradient text-luxury-950 font-semibold px-8 py-3 rounded-xl cursor-pointer shadow-md hover:shadow-lg hover:shadow-gold-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              Qidirish
            </button>
          </div>
        </div>
        {/* Results Info */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white">
            Saralangan Zallar ({filteredHalls.length})
          </h2>
          <span className="text-sm text-gray-500 dark:text-luxury-400 font-medium">
            Eng yaxshi takliflar siz uchun
          </span>
        </div>

        {/* Loading UI State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl overflow-hidden shadow-premium">
                <div className="h-56 shimmer w-full" />
                <div className="p-6 flex flex-col gap-4">
                  <div className="h-6 shimmer rounded w-2/3" />
                  <div className="h-4 shimmer rounded w-1/2" />
                  <div className="h-4 shimmer rounded w-3/4" />
                  <div className="h-10 shimmer rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State UI */}
        {!loading && filteredHalls.length === 0 && (
          <div className="glass bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-16 text-center shadow-premium animate-fade max-w-lg mx-auto">
            <span className="text-5xl block mb-6 filter drop-shadow">🏛️</span>
            <h4 className="text-xl font-bold text-luxury-800 dark:text-white mb-2">Hech qanday to'yxona topilmadi</h4>
            <p className="text-luxury-500 dark:text-luxury-400 text-sm mb-8 leading-relaxed">
              Kiritilgan mezonlarga mos keladigan zallar mavjud emas. Iltimos, filtrlarni o'zgartirib qayta urinib ko'ring.
            </p>
            <button 
              onClick={handleReset} 
              className="border border-gold-500/40 hover:bg-gold-500/5 text-gold-600 dark:text-gold-400 font-semibold px-6 py-2.5 rounded-xl cursor-pointer transition-all duration-300 text-sm"
            >
              Barcha zallarni ko'rish
            </button>
          </div>
        )}

        {/* Grid Results */}
        {!loading && filteredHalls.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHalls.map((hall) => (
              <div
                key={hall.hall_id}
                className="bg-white dark:bg-luxury-900 border border-gray-100 dark:border-luxury-800/50 rounded-2xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(200,155,60,0.12)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedHall(hall)}
              >
                {/* Image Section with Hover Zoom & Badges */}
                <div className="relative h-60 overflow-hidden group">
                  {/* Background image div with fallback */}
                  <div
                    className="w-full h-full bg-luxury-200 dark:bg-luxury-800 transition-transform duration-700 ease-out group-hover:scale-110"
                    style={{
                      backgroundImage: hall.main_image ? `url("${hall.main_image}")` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Fallback shown when no image */}
                    {!hall.main_image && (
                      <div className="w-full h-full flex flex-col items-center justify-center text-luxury-400 dark:text-luxury-600 gap-2">
                        <span className="text-5xl">🏛️</span>
                        <span className="text-xs font-medium">Rasm yuklanmagan</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Favorite heart button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(hall.hall_id, hall.is_favorited || false);
                    }}
                    className={`absolute top-4 left-4 p-2 rounded-xl glass border backdrop-blur-md transition-all duration-300 shadow-md flex items-center justify-center gap-1.5 z-10 ${
                      hall.is_favorited
                        ? 'bg-red-500/20 border-red-500/40 text-red-500 scale-110'
                        : 'bg-black/45 border-white/10 text-white hover:bg-red-500/10 hover:text-red-500'
                    }`}
                    title={hall.is_favorited ? 'Sevimlilardan o\'chirish' : 'Sevimliga qo\'shish'}
                  >
                    <span className="text-sm">❤️</span>
                    {hall.favorites_count !== undefined && (
                      <span className="text-xs font-bold font-mono">{hall.favorites_count}</span>
                    )}
                  </button>

                  {/* Luxury rating badge absolute */}
                  <div className="absolute top-4 right-4 glass bg-black/45 backdrop-blur-md text-white font-bold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 border border-white/10">
                    <span className="text-yellow-400">⭐</span> {hall.rating || 'N/A'}
                  </div>

                  {/* Pricing info overlaid */}
                  <div className="absolute bottom-4 left-4 glass bg-black/45 backdrop-blur-md text-white font-bold text-sm px-3.5 py-2 rounded-xl border border-white/10">
                    ${hall.price_per_seat} <span className="text-xs font-normal text-luxury-300">/ kishi</span>
                  </div>
                </div>

                {/* Card Content details */}
                <div className="p-6">
                  <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-1 group-hover:text-gold-500 transition-colors">
                    {hall.hall_name}
                  </h3>
                  <p className="text-sm text-luxury-500 dark:text-luxury-400 flex items-center gap-1.5 mb-4 font-medium">
                    <span>📍</span> {hall.region}, {hall.district}
                  </p>

                  <div className="flex items-center justify-between border-t border-luxury-100 dark:border-luxury-800/80 pt-4 mb-4 text-sm text-luxury-600 dark:text-luxury-300">
                    <span className="flex items-center gap-1">
                      <strong>👥 Sig'im:</strong> {hall.capacity} kishi
                    </span>
                  </div>

                  {/* Amenity tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {hall.wifi && (
                      <span className="text-xs bg-luxury-100 dark:bg-luxury-800 text-luxury-700 dark:text-luxury-300 px-2.5 py-1 rounded-lg">
                        📡 WiFi
                      </span>
                    )}
                    {hall.parking && (
                      <span className="text-xs bg-luxury-100 dark:bg-luxury-800 text-luxury-700 dark:text-luxury-300 px-2.5 py-1 rounded-lg">
                        🅿️ Avtoturargoh
                      </span>
                    )}
                    {hall.air_conditioner && (
                      <span className="text-xs bg-luxury-100 dark:bg-luxury-800 text-luxury-700 dark:text-luxury-300 px-2.5 py-1 rounded-lg">
                        ❄️ AC
                      </span>
                    )}
                  </div>

                  {/* Premium view buttons */}
                  <Link
                    to={`/halls/${hall.hall_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block text-center w-full bg-luxury-900 dark:bg-luxury-800 hover:bg-gold-500 hover:text-luxury-950 text-gold-500 border border-gold-500/30 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    Batafsil ko'rish
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Elegant Detail Modal Overlay */}
        {selectedHall && (
          <div
            className="fixed inset-0 bg-luxury-950/70 backdrop-blur-md flex items-center justify-center p-4 z-1000 animate-fade"
            onClick={() => setSelectedHall(null)}
          >
            <div
              className="bg-white dark:bg-luxury-900 border border-luxury-200 dark:border-luxury-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold font-poppins text-luxury-900 dark:text-white">
                    {selectedHall.hall_name}
                  </h2>
                  <p className="text-sm text-luxury-500 dark:text-luxury-400 mt-1">
                    📍 {selectedHall.region}, {selectedHall.district}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFavorite(selectedHall.hall_id, selectedHall.is_favorited || false)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 shadow-sm cursor-pointer ${
                      selectedHall.is_favorited
                        ? 'bg-red-500/20 border-red-500/40 text-red-500 scale-105'
                        : 'bg-luxury-100 dark:bg-luxury-800 border-luxury-200 dark:border-luxury-700 text-luxury-400 dark:text-luxury-300 hover:text-red-500'
                    }`}
                    title={selectedHall.is_favorited ? 'Sevimlilardan o\'chirish' : 'Sevimliga qo\'shish'}
                  >
                    ❤️
                  </button>
                  <button
                    onClick={() => setSelectedHall(null)}
                    className="bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-300 hover:bg-gold-500 hover:text-luxury-950 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="h-64 rounded-2xl overflow-hidden bg-luxury-100 dark:bg-luxury-800 mb-6">
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: selectedHall.main_image ? `url("${selectedHall.main_image}")` : undefined }}
                />
              </div>

              <h4 className="text-sm font-bold uppercase tracking-wider text-luxury-500 dark:text-luxury-400 mb-2">Tavsif</h4>
              <p className="text-luxury-600 dark:text-luxury-300 text-sm leading-relaxed mb-6">
                {selectedHall.description || "Ushbu premium to'yxona uchun batafsil tavsif kiritilmagan. Qisqacha ma'lumot olish uchun admin yoki owner bilan bog'laning."}
              </p>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-luxury-100 dark:border-luxury-800/80 py-4 mb-6 text-sm text-luxury-700 dark:text-luxury-300">
                <div>
                  <span className="text-luxury-500">Sig'im:</span> <strong className="text-luxury-900 dark:text-white">{selectedHall.capacity} kishi</strong>
                </div>
                <div>
                  <span className="text-luxury-500">Narxi (kishi boshi):</span> <strong className="text-luxury-900 dark:text-white">${selectedHall.price_per_seat}</strong>
                </div>
              </div>

              <div className="flex gap-4">
                <Link
                  to={`/halls/${selectedHall.hall_id}`}
                  className="flex-1 text-center gold-gradient text-luxury-950 font-semibold px-6 py-3 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300"
                >
                  Bron qilish va Sozlash
                </Link>
                <button
                  onClick={() => setSelectedHall(null)}
                  className="px-6 py-3 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 rounded-xl font-semibold transition-colors cursor-pointer text-sm"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

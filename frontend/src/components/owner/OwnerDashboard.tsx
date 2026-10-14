import api from '../../utils/api';
import { useState, useEffect } from 'react';
import { translations as t } from '../../utils/translations';
import { ToastContainer, useToast } from '../Toast';

interface Hall {
  hall_id: string;
  hall_name: string;
  region: string;
  capacity: number;
  price_per_seat: string;
  is_active: boolean;
}

interface Booking {
  booking_id: string;
  user_id: string;
  fullname: string;
  booking_date: string;
  guest_count: number;
  total_price: string;
  status: string;
}

interface Stats {
  halls: number;
  bookings: number;
  revenue: number;
}

type TabType = 'halls' | 'bookings' | 'stats' | 'requests';

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('halls');
  const [halls, setHalls] = useState<Hall[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddHall, setShowAddHall] = useState(false);
  const [showUploadImages, setShowUploadImages] = useState<string | null>(null);
  const [showEditHall, setShowEditHall] = useState<string | null>(null);

  const { toasts, addToast, removeToast } = useToast();

  // Form data
  const [hallForm, setHallForm] = useState({
    hallName: '',
    description: '',
    region: '',
    district: '',
    address: '',
    latitude: 0,
    longitude: 0,
    capacity: 200,
    pricePerSeat: 50,
    phone: '',
    mainImage: '',
    images: [] as string[],
    amenities: { wifi: false, parking: false, airConditioner: false, stage: false, musicSystem: false },
  });

  const [editForm, setEditForm] = useState({
    hallName: '',
    description: '',
    capacity: 200,
    pricePerSeat: 50,
    phone: '',
    mainImage: '',
    images: [] as string[],
    amenities: { wifi: false, parking: false, airConditioner: false, stage: false, musicSystem: false },
  });

  const [imageUrls, setImageUrls] = useState('');

  // Image source toggles
  const [addMainImgSource, setAddMainImgSource] = useState<'url' | 'file'>('url');
  const [addGalleryImgSource, setAddGalleryImgSource] = useState<'url' | 'file'>('url');

  const [addGalleryText, setAddGalleryText] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editGalleryText, setEditGalleryText] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editMainImgSource, setEditMainImgSource] = useState<'url' | 'file'>('url');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editGalleryImgSource, setEditGalleryImgSource] = useState<'url' | 'file'>('url');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean, isEdit: boolean) => {
    const files = e.target.files;
    if (!files) return;

    if (isMain) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          if (isEdit) {
            setEditForm(prev => ({ ...prev, mainImage: reader.result as string }));
          } else {
            setHallForm(prev => ({ ...prev, mainImage: reader.result as string }));
          }
        }
      };
      reader.readAsDataURL(file);
    } else {
      const promises = Array.from(files).map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then((results) => {
        if (isEdit) {
          setEditForm(prev => ({ ...prev, images: [...prev.images, ...results] }));
        } else {
          setHallForm(prev => ({ ...prev, images: [...prev.images, ...results] }));
        }
      });
    }
  };

  const handleGalleryTextChange = (text: string, isEdit: boolean) => {
    const urls = text.split('\n').map(url => url.trim()).filter(Boolean);
    if (isEdit) {
      setEditGalleryText(text);
      setEditForm(prev => ({ ...prev, images: urls }));
    } else {
      setAddGalleryText(text);
      setHallForm(prev => ({ ...prev, images: urls }));
    }
  };

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
      if (activeTab === 'halls') {
        const res = await api.get(`/halls/my-halls`);
        setHalls(res.data);
      } else if (activeTab === 'bookings') {
        const res = await api.get(`/bookings/owner/bookings`);
        setBookings(res.data);
      } else if (activeTab === 'stats') {
        const res = await api.get(`/bookings/owner/stats`);
        setStats(res.data);
      } else if (activeTab === 'requests') {
        const res = await api.get(`/halls/my-requests`);
        setRequests(res.data);
      }
    } catch (error: any) {
      console.error('Data load error:', error);
      const msg = error?.response?.data?.message || error?.message || 'Xato yuz berdi';
      const status = error?.response?.status;
      if (status === 401) {
        addToast('Sessiya tugagan. Qayta kiring.', 'error');
      } else if (status === 403) {
        addToast('Ruxsat yo\'q: ' + msg, 'error');
      } else {
        addToast('Xato: ' + msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      addToast('Iltimos, owner sifatida kiring', 'warning');
      return;
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleAddHall = async () => {
    if (!hallForm.hallName || !hallForm.region || !hallForm.capacity) {
      addToast('Barcha asosiy maydonlarni to\'ldiring', 'warning');
      return;
    }

    try {
      await api.post(`/halls`, hallForm);
      addToast("✅ To'yxona so'rovi yuborildi! Admin tasdiqlashini kuting.", 'success');
      setShowAddHall(false);
      setAddGalleryText('');
      setHallForm({
        hallName: '',
        description: '',
        region: '',
        district: '',
        address: '',
        latitude: 0,
        longitude: 0,
        capacity: 200,
        pricePerSeat: 50,
        phone: '',
        mainImage: '',
        images: [],
        amenities: { wifi: false, parking: false, airConditioner: false, stage: false, musicSystem: false },
      });
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleOpenEdit = async (hall: any) => {
    setShowEditHall(hall.hall_id);
    try {
      const res = await api.get(`/halls/${hall.hall_id}`);
      const fullHall = res.data;
      setEditForm({
        hallName: fullHall.hall_name,
        description: fullHall.description || '',
        capacity: fullHall.capacity,
        pricePerSeat: typeof fullHall.price_per_seat === 'string' ? parseFloat(fullHall.price_per_seat) : fullHall.price_per_seat,
        phone: fullHall.phone || '',
        mainImage: fullHall.main_image || '',
        images: fullHall.images || [],
        amenities: {
          wifi: fullHall.wifi || false,
          parking: fullHall.parking || false,
          airConditioner: fullHall.air_conditioner || false,
          stage: fullHall.stage || false,
          musicSystem: fullHall.music_system || false,
        },
      });
      setEditGalleryText((fullHall.images || []).join('\n'));
      setEditMainImgSource(fullHall.main_image?.startsWith('data:') ? 'file' : 'url');
      setEditGalleryImgSource('url');
    } catch (err) {
      console.error(err);
      setEditForm({
        hallName: hall.hall_name,
        description: hall.description || '',
        capacity: hall.capacity,
        pricePerSeat: typeof hall.price_per_seat === 'string' ? parseFloat(hall.price_per_seat) : hall.price_per_seat,
        phone: hall.phone || '',
        mainImage: hall.main_image || '',
        images: [],
        amenities: {
          wifi: hall.wifi || false,
          parking: hall.parking || false,
          airConditioner: hall.air_conditioner || false,
          stage: hall.stage || false,
          musicSystem: hall.music_system || false,
        },
      });
    }
  };

  const handleEditHall = async () => {
    if (!editForm.hallName || !editForm.capacity) {
      addToast('Maydonlarni to\'g\'ri to\'ldiring', 'warning');
      return;
    }

    try {
      await api.put(`/halls/${showEditHall}`, editForm);
      addToast("✅ Tahrirlash so'rovi adminga yuborildi!", 'success');
      setShowEditHall(null);
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleDeleteHall = (hallId: string) => {
    setConfirmModal({
      message: "To'yxonani o'chirmoqchimisiz? Bu amal qaytarilmaydi!",
      onConfirm: async () => {
        try {
          await api.delete(`/halls/${hallId}`);
          addToast("🗑️ To'yxona o'chirildi", 'success');
          loadData();
        } catch (error: any) {
          addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
    });
  };

  const handleUploadImages = async (hallId: string) => {
    if (!imageUrls.trim()) {
      addToast('Rasmlar URLlarini kiriting', 'warning');
      return;
    }

    const images = imageUrls.split('\n').filter((url) => url.trim());
    try {
      await api.post(`/halls/${hallId}/images`, { images });
      addToast("📸 Rasmlar muvaffaqiyatli qo'shildi!", 'success');
      setShowUploadImages(null);
      setImageUrls('');
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'confirmed' });
      addToast('✅ Booking tasdiqlandi', 'success');
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      addToast('❌ Booking rad etildi', 'warning');
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-50 dark:bg-luxury-950 transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Banner / Title Row */}
      <section className="bg-luxury-900 border-b border-gold-500/20 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-gold-500 uppercase tracking-widest">Tizim Egasining Kabineti</span>
            <h1 className="text-3xl font-bold font-poppins mt-1">
              To'yxona Owner <span className="bg-gradient-to-r from-gold-400 to-gold-200 bg-clip-text text-transparent">Boshqaruv Paneli</span>
            </h1>
          </div>
          <div className="flex gap-4 text-sm text-luxury-300">
            <span className="bg-luxury-800 px-4 py-2 rounded-xl border border-luxury-700/50">
              Biznes Panel
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid: Sidebar Tabs + Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Dashboard Left Sidebar Tabs */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {[
              { id: 'halls', label: t.halls, icon: '🏛️' },
              { id: 'requests', label: "So'rovlarim", icon: '📩' },
              { id: 'bookings', label: t.bookings, icon: '📋' },
              { id: 'stats', label: t.stats, icon: '📊' },
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
            
            {/* Loading Indicator */}
            {loading && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-12 text-center shadow-premium flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-gold-500/20 border-t-gold-500 animate-spin" />
                <span className="text-sm font-medium text-luxury-500">Yuklanmoqda...</span>
              </div>
            )}

            {/* Halls Tab View */}
            {activeTab === 'halls' && !loading && (
              <div className="animate-fade">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white">
                    Mening To'yxonalarim
                  </h3>
                  <button
                    onClick={() => setShowAddHall(true)}
                    className="gold-gradient text-luxury-950 font-semibold px-4 py-2.5 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300 text-xs sm:text-sm flex items-center gap-1.5"
                  >
                    <span>➕</span> {t.addHall}
                  </button>
                </div>

                {halls.length === 0 ? (
                  <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-16 text-center shadow-premium">
                    <span className="text-4xl block mb-4">🏛️</span>
                    <p className="font-semibold text-sm text-luxury-500">Sizda hali ro'yxatdan o'tgan to'yxona yo'q</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {halls.map((hall) => (
                      <div 
                        key={hall.hall_id}
                        className="bg-white dark:bg-luxury-900 border border-luxury-200/60 dark:border-luxury-800/60 rounded-2xl p-5 hover:border-gold-500/30 transition-all duration-300 flex flex-col shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-base text-luxury-900 dark:text-white">{hall.hall_name}</h4>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            hall.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}>
                            {hall.is_active ? 'Faol' : 'Nofaol'}
                          </span>
                        </div>

                        <div className="text-xs text-luxury-500 dark:text-luxury-400 flex flex-col gap-1.5 mb-5 flex-grow">
                          <p>📍 Hudud: {hall.region}</p>
                          <p>👥 Sig'im: {hall.capacity} kishi</p>
                          <p>💵 Narx: ${hall.price_per_seat} / kishi</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <button
                            onClick={() => handleOpenEdit(hall)}
                            className="bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 border border-amber-500/20 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer text-center"
                          >
                            ✏️ Tahrirlash
                          </button>
                          <button
                            onClick={() => handleDeleteHall(hall.hall_id)}
                            className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer text-center"
                          >
                            🗑️ O'chirish
                          </button>
                        </div>

                        <button
                          onClick={() => setShowUploadImages(hall.hall_id)}
                          className="w-full bg-luxury-100 dark:bg-luxury-800 hover:bg-gold-500 hover:text-luxury-950 text-gold-500 border border-gold-500/30 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors duration-300 cursor-pointer text-center"
                        >
                          📸 Galereya Rasmlari
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Management Tab View */}
            {activeTab === 'bookings' && !loading && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium animate-fade">
                <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-6 border-b border-luxury-100 dark:border-luxury-800/80 pb-4">
                  Kelib tushgan band qilish arizalari
                </h3>

                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-luxury-500">
                    <span className="text-4xl block mb-4">📋</span>
                    <p className="font-semibold text-sm">Hozircha arizalar mavjud emas</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {bookings.map((booking) => (
                      <div 
                        key={booking.booking_id}
                        className="border border-luxury-200/60 dark:border-luxury-800/60 rounded-2xl p-5 hover:border-gold-500/30 transition-all duration-300"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs bg-luxury-100 dark:bg-luxury-800 text-luxury-700 dark:text-luxury-300 px-2 py-0.5 rounded border border-luxury-200/50 dark:border-luxury-800/50 font-bold">
                                {booking.status.toUpperCase()}
                              </span>
                              <span className="text-xs text-luxury-400">Arizachi: {booking.fullname}</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-6 text-sm mt-3">
                              <p className="text-luxury-600 dark:text-luxury-400">
                                <strong>Sana:</strong> {formatDate(booking.booking_date)}
                              </p>
                              <p className="text-luxury-600 dark:text-luxury-400">
                                <strong>Mehmonlar:</strong> {booking.guest_count} kishi
                              </p>
                              <p className="text-luxury-600 dark:text-luxury-400">
                                <strong>Jami summa:</strong> <span className="text-gold-500 font-bold">${booking.total_price}</span>
                              </p>
                            </div>
                          </div>

                          {booking.status === 'pending' && (
                            <div className="flex gap-2 w-full md:w-auto">
                              <button
                                onClick={() => handleApproveBooking(booking.booking_id)}
                                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-all text-xs"
                              >
                                Tasdiqlash
                              </button>
                              <button
                                onClick={() => handleRejectBooking(booking.booking_id)}
                                className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-all text-xs"
                              >
                                Rad Etish
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab View */}
            {activeTab === 'stats' && !loading && stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade">
                <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl p-6 shadow-premium text-center">
                  <h4 className="text-xs font-semibold text-luxury-400 uppercase tracking-widest mb-1">Jami To'yxonalar</h4>
                  <p className="text-4xl font-bold font-poppins text-gold-500">{stats.halls}</p>
                </div>
                <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl p-6 shadow-premium text-center">
                  <h4 className="text-xs font-semibold text-luxury-400 uppercase tracking-widest mb-1">Jami Arizalar</h4>
                  <p className="text-4xl font-bold font-poppins text-gold-500">{stats.bookings}</p>
                </div>
                <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl p-6 shadow-premium text-center">
                  <h4 className="text-xs font-semibold text-luxury-400 uppercase tracking-widest mb-1">Biznes Daromad</h4>
                  <p className="text-4xl font-bold font-poppins text-emerald-500">${stats.revenue}</p>
                </div>
              </div>
            )}

            {/* Requests Tab View */}
            {activeTab === 'requests' && !loading && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium animate-fade">
                <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-6 border-b border-luxury-100 dark:border-luxury-800/80 pb-4">
                  Mening So'rovlarim (Admin Tasdiqlashi uchun)
                </h3>

                {requests.length === 0 ? (
                  <div className="text-center py-12 text-luxury-500">
                    <span className="text-4xl block mb-4">📩</span>
                    <p className="font-semibold text-sm">Hozircha so'rovlar mavjud emas</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {requests.map((req) => {
                      const requestData = typeof req.data === 'string' ? JSON.parse(req.data) : req.data;
                      return (
                        <div 
                          key={req.request_id}
                          className="border border-luxury-200/60 dark:border-luxury-800/60 rounded-2xl p-5 hover:border-gold-500/30 transition-all duration-300"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                                req.request_type === 'create' 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-500/20'
                              }`}>
                                {req.request_type === 'create' ? 'Yangi qo\'shish' : 'Tahrirlash'}
                              </span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                                req.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-500/20' :
                                req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-500/20' :
                                'bg-red-500/10 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-500/20'
                              }`}>
                                {req.status === 'pending' ? 'Kutilmoqda' :
                                 req.status === 'approved' ? 'Tasdiqlandi' : 'Rad etildi'}
                              </span>
                            </div>
                            <span className="text-xs text-luxury-400 font-mono">
                              {new Date(req.created_at).toLocaleString('uz-UZ')}
                            </span>
                          </div>

                          <div className="text-sm">
                            <h4 className="font-bold text-base text-luxury-900 dark:text-white mb-2">
                              {requestData.hallName}
                              {req.request_type === 'update' && req.existing_hall_name && (
                                <span className="text-xs font-normal text-luxury-400 ml-2">
                                  (Asl nomi: {req.existing_hall_name})
                                </span>
                              )}
                            </h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-luxury-600 dark:text-luxury-400">
                              {requestData.region && <p>📍 <strong>Hudud:</strong> {requestData.region}, {requestData.district}</p>}
                              {requestData.address && <p>🏠 <strong>Manzil:</strong> {requestData.address}</p>}
                              <p>👥 <strong>Sig'im:</strong> {requestData.capacity} kishi</p>
                              <p>💵 <strong>Narx:</strong> ${requestData.pricePerSeat} / kishi</p>
                              {requestData.phone && <p>📞 <strong>Telefon:</strong> {requestData.phone}</p>}
                            </div>

                            {requestData.amenities && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {Object.entries(requestData.amenities)
                                  .filter(([_, val]) => val)
                                  .map(([key]) => (
                                    <span key={key} className="text-[10px] bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-300 px-2 py-0.5 rounded border border-luxury-200/50 dark:border-luxury-800/50 font-semibold uppercase">
                                      {key === 'wifi' ? '📡 WiFi' :
                                       key === 'parking' ? '🅿️ Parking' :
                                       key === 'airConditioner' ? '❄️ A/C' :
                                       key === 'stage' ? '🎭 Sahna' : key}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Add Hall Modal Layout */}
      {showAddHall && (
        <div
          className="fixed inset-0 bg-luxury-950/70 backdrop-blur-md flex items-center justify-center p-4 z-1000 animate-fade"
          onClick={() => setShowAddHall(false)}
        >
          <div
            className="bg-white dark:bg-luxury-900 border border-luxury-200 dark:border-luxury-800 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold font-poppins text-luxury-900 dark:text-white">
                  Yangi To'yxona Qo'shish
                </h2>
                <p className="text-xs text-luxury-500 mt-1">Loyiha barcha ma'lumotlarini kiriting</p>
              </div>
              <button
                onClick={() => setShowAddHall(false)}
                className="bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-300 hover:bg-gold-500 hover:text-luxury-950 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Asosiy Rasm Section */}
              <div className="border border-luxury-200/65 dark:border-luxury-800/65 p-4 rounded-2xl flex flex-col gap-3">
                <label className="block text-xs font-bold text-luxury-400 uppercase tracking-wider">Asosiy Rasm (Muqova)</label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setAddMainImgSource('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${addMainImgSource === 'url' ? 'bg-gold-500 text-luxury-950 shadow' : 'bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-400'}`}
                  >
                    Saytdan (URL)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAddMainImgSource('file')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${addMainImgSource === 'file' ? 'bg-gold-500 text-luxury-950 shadow' : 'bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-400'}`}
                  >
                    Kompyuterdan (Fayl)
                  </button>
                </div>
                
                {addMainImgSource === 'url' ? (
                  <input
                    type="text"
                    placeholder="Rasm URL manzili (https://...)"
                    value={hallForm.mainImage}
                    onChange={(e) => setHallForm({ ...hallForm, mainImage: e.target.value })}
                    className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold-500"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, true, false)}
                    className="w-full text-xs text-luxury-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-luxury-100 file:text-luxury-700 dark:file:bg-luxury-800 dark:file:text-luxury-300 cursor-pointer"
                  />
                )}

                {hallForm.mainImage && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-luxury-200/50 dark:border-luxury-800/50 bg-luxury-50 dark:bg-luxury-950 flex items-center justify-center">
                    <img src={hallForm.mainImage} alt="Main Preview" className="max-w-full max-h-full object-contain" />
                    <button 
                      type="button" 
                      onClick={() => setHallForm({ ...hallForm, mainImage: '' })}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-750 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Qo'shimcha Rasmlar Section */}
              <div className="border border-luxury-200/65 dark:border-luxury-800/65 p-4 rounded-2xl flex flex-col gap-3">
                <label className="block text-xs font-bold text-luxury-400 uppercase tracking-wider">Qo'shimcha Rasmlar (Galereya)</label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setAddGalleryImgSource('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${addGalleryImgSource === 'url' ? 'bg-gold-500 text-luxury-950 shadow' : 'bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-400'}`}
                  >
                    Saytdan (URL)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAddGalleryImgSource('file')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${addGalleryImgSource === 'file' ? 'bg-gold-500 text-luxury-950 shadow' : 'bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-400'}`}
                  >
                    Kompyuterdan (Fayllar)
                  </button>
                </div>

                {addGalleryImgSource === 'url' ? (
                  <textarea
                    placeholder="Har bir rasm URL manzili alohida qatorda (https://...)"
                    value={addGalleryText}
                    onChange={(e) => handleGalleryTextChange(e.target.value, false)}
                    className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold-500 min-h-[70px]"
                  />
                ) : (
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, false, false)}
                    className="w-full text-xs text-luxury-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-luxury-100 file:text-luxury-700 dark:file:bg-luxury-800 dark:file:text-luxury-300 cursor-pointer"
                  />
                )}

                {hallForm.images && hallForm.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {hallForm.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-luxury-200/50 dark:border-luxury-800/50 bg-luxury-50 dark:bg-luxury-950 flex items-center justify-center">
                        <img src={img} alt="Gallery Preview" className="max-w-full max-h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => {
                            const updated = hallForm.images.filter((_, i) => i !== idx);
                            setHallForm({ ...hallForm, images: updated });
                            setAddGalleryText(updated.join('\n'));
                          }}
                          className="absolute top-1 right-1 bg-red-650 hover:bg-red-750 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="To'yxona nomi"
                value={hallForm.hallName}
                onChange={(e) => setHallForm({ ...hallForm, hallName: e.target.value })}
                className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500"
              />

              <textarea
                placeholder="Tavsifi"
                value={hallForm.description}
                onChange={(e) => setHallForm({ ...hallForm, description: e.target.value })}
                className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 min-h-[80px]"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Viloyat"
                  value={hallForm.region}
                  onChange={(e) => setHallForm({ ...hallForm, region: e.target.value })}
                  className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500"
                />
                <input
                  type="text"
                  placeholder="Tuman"
                  value={hallForm.district}
                  onChange={(e) => setHallForm({ ...hallForm, district: e.target.value })}
                  className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <input
                type="text"
                placeholder="Manzil"
                value={hallForm.address}
                onChange={(e) => setHallForm({ ...hallForm, address: e.target.value })}
                className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Maksimal Sig'im"
                  value={hallForm.capacity}
                  onChange={(e) => setHallForm({ ...hallForm, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 font-semibold"
                />
                <input
                  type="number"
                  placeholder="Narxi ($ / kishi)"
                  value={hallForm.pricePerSeat}
                  onChange={(e) => setHallForm({ ...hallForm, pricePerSeat: parseInt(e.target.value) || 0 })}
                  className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2 bg-luxury-50 dark:bg-luxury-950 border border-luxury-200/50 dark:border-luxury-800/50 p-4 rounded-xl">
                {[
                  { id: 'wifi', name: '📡 WiFi' },
                  { id: 'parking', name: '🅿️ Parking' },
                  { id: 'airConditioner', name: '❄️ A/C' },
                  { id: 'stage', name: '🎭 Sahna' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs font-semibold text-luxury-700 dark:text-luxury-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(hallForm.amenities as any)[item.id]}
                      onChange={(e) => setHallForm({ 
                        ...hallForm, 
                        amenities: { ...hallForm.amenities, [item.id]: e.target.checked } 
                      })}
                      className="rounded border-luxury-300 text-gold-500 focus:ring-gold-500/20"
                    />
                    {item.name}
                  </label>
                ))}
              </div>

              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleAddHall}
                  className="flex-1 gold-gradient text-luxury-950 font-semibold py-3 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 text-sm"
                >
                  {t.save}
                </button>
                <button
                  onClick={() => setShowAddHall(false)}
                  className="flex-1 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 font-semibold py-3 rounded-xl cursor-pointer transition-colors text-sm"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Images Modal Layout */}
      {showUploadImages && (
        <div
          className="fixed inset-0 bg-luxury-950/70 backdrop-blur-md flex items-center justify-center p-4 z-1000 animate-fade"
          onClick={() => setShowUploadImages(null)}
        >
          <div
            className="bg-white dark:bg-luxury-900 border border-luxury-200 dark:border-luxury-800 rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold font-poppins text-luxury-900 dark:text-white">
                  Rasm URLlarini yuklash
                </h2>
                <p className="text-xs text-luxury-500 mt-1">Har bir URL alohida yangi qatorda bo'lishi lozim</p>
              </div>
              <button
                onClick={() => setShowUploadImages(null)}
                className="bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-300 hover:bg-gold-500 hover:text-luxury-950 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <textarea
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              placeholder="https://example.com/rasm1.jpg&#10;https://example.com/rasm2.jpg"
              className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 min-h-[120px] font-mono text-xs"
            />

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => handleUploadImages(showUploadImages)}
                className="flex-1 gold-gradient text-luxury-950 font-semibold py-3 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 text-sm"
              >
                {t.save}
              </button>
              <button
                onClick={() => setShowUploadImages(null)}
                className="flex-1 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 font-semibold py-3 rounded-xl cursor-pointer transition-colors text-sm"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hall Modal Layout */}
      {showEditHall && (
        <div
          className="fixed inset-0 bg-luxury-950/70 backdrop-blur-md flex items-center justify-center p-4 z-1000 animate-fade"
          onClick={() => setShowEditHall(null)}
        >
          <div
            className="bg-white dark:bg-luxury-900 border border-luxury-200 dark:border-luxury-800 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold font-poppins text-luxury-900 dark:text-white">
                  To'yxonani Tahrirlash
                </h2>
                <p className="text-xs text-luxury-500 mt-1">Kerakli ma'lumotlarni o'zgartiring</p>
              </div>
              <button
                onClick={() => setShowEditHall(null)}
                className="bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-300 hover:bg-gold-500 hover:text-luxury-950 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="To'yxona nomi"
                value={editForm.hallName}
                onChange={(e) => setEditForm({ ...editForm, hallName: e.target.value })}
                className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500"
              />

              <textarea
                placeholder="Tavsifi"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 min-h-[80px]"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Maksimal Sig'im"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 font-semibold"
                />
                <input
                  type="number"
                  placeholder="Narxi ($ / kishi)"
                  value={editForm.pricePerSeat}
                  onChange={(e) => setEditForm({ ...editForm, pricePerSeat: parseInt(e.target.value) || 0 })}
                  className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 font-semibold"
                />
              </div>

              <input
                type="text"
                placeholder="Telefon raqam"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500"
              />

              <div className="grid grid-cols-2 gap-3 mt-2 bg-luxury-50 dark:bg-luxury-950 border border-luxury-200/50 dark:border-luxury-800/50 p-4 rounded-xl">
                {[
                  { id: 'wifi', name: '📡 WiFi' },
                  { id: 'parking', name: '🅿️ Parking' },
                  { id: 'airConditioner', name: '❄️ A/C' },
                  { id: 'stage', name: '🎭 Sahna' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs font-semibold text-luxury-700 dark:text-luxury-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(editForm.amenities as any)[item.id]}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        amenities: { ...editForm.amenities, [item.id]: e.target.checked } 
                      })}
                      className="rounded border-luxury-300 text-gold-500 focus:ring-gold-500/20"
                    />
                    {item.name}
                  </label>
                ))}
              </div>

              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleEditHall}
                  className="flex-1 gold-gradient text-luxury-950 font-semibold py-3 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 text-sm"
                >
                  {t.save}
                </button>
                <button
                  onClick={() => setShowEditHall(null)}
                  className="flex-1 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 font-semibold py-3 rounded-xl cursor-pointer transition-colors text-sm"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
            <h2 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-2">Tasdiqlash kerak</h2>
            <p className="text-sm text-luxury-500 dark:text-luxury-400 mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl cursor-pointer text-sm transition-colors"
              >
                Ha, davom etish
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 font-semibold py-3 rounded-xl cursor-pointer transition-colors text-sm"
              >
                Yo'q, bekor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

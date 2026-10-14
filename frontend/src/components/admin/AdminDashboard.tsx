import api from '../../utils/api';
import { useState, useEffect } from 'react';
import { translations as t } from '../../utils/translations';
import { ToastContainer, useToast } from '../Toast';

interface User {
  user_id: string;
  fullname: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Hall {
  hall_id: string;
  hall_name: string;
  region: string;
  owner_id: string;
  is_active: boolean;
}

interface Booking {
  booking_id: string;
  fullname: string;
  hall_name: string;
  booking_date: string;
  guest_count: number;
  total_price: number;
  status: string;
  note: string;
  created_at: string;
}

interface Stats {
  users: number;
  halls: number;
  bookings: number;
  payments: number;
}

type TabType = 'users' | 'halls' | 'bookings' | 'stats' | 'requests' | 'singers' | 'cars' | 'foods';

interface Singer {
  singer_id: string;
  fullname: string;
  description: string | null;
  image_url: string | null;
  price: number;
  is_active: boolean;
}

interface Car {
  car_id: string;
  name: string;
  brand: string | null;
  model_year: number | null;
  image_url: string | null;
  price: number;
  is_active: boolean;
}

interface Food {
  food_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_per_guest: number;
  is_active: boolean;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending:   { text: 'Kutilmoqda',  cls: 'bg-amber-100 dark:bg-amber-950 text-amber-600 border-amber-300/30' },
  confirmed: { text: 'Tasdiqlandi', cls: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border-emerald-300/30' },
  cancelled: { text: 'Bekor',       cls: 'bg-red-100 dark:bg-red-950 text-red-600 border-red-300/30' },
  completed: { text: 'Tugallandi',  cls: 'bg-blue-100 dark:bg-blue-950 text-blue-600 border-blue-300/30' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length < 3) {
    const datePart = dateStr.split('T')[0];
    const subParts = datePart.split('-');
    if (subParts.length < 3) return dateStr;
    const [y, m, d] = subParts;
    const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  }
  const [y, m, d] = parts;
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('halls');
  const [users, setUsers] = useState<User[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_owners, setOwners] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Extras state
  const [singers, setSingers] = useState<Singer[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);

  // Singer modals
  const [showAddSinger, setShowAddSinger] = useState(false);
  const [showEditSinger, setShowEditSinger] = useState<Singer | null>(null);
  const [singerForm, setSingerForm] = useState({ fullname: '', price: '', description: '', image_url: '' });

  // Car modals
  const [showAddCar, setShowAddCar] = useState(false);
  const [showEditCar, setShowEditCar] = useState<Car | null>(null);
  const [carForm, setCarForm] = useState({ name: '', price: '', brand: '', model_year: '', image_url: '' });

  // Food modals
  const [showAddFood, setShowAddFood] = useState(false);
  const [showEditFood, setShowEditFood] = useState<Food | null>(null);
  const [foodForm, setFoodForm] = useState({ name: '', price_per_guest: '', description: '', image_url: '' });

  // Modals
  const [showAddHall, setShowAddHall] = useState(false);
  const [showEditHall, setShowEditHall] = useState<string | null>(null);
  const [showUploadImages, setShowUploadImages] = useState<string | null>(null);

  // Forms
  const [hallForm, setHallForm] = useState({
    ownerId: '',
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
    amenities: { wifi: false, parking: false, airConditioner: false, stage: false, musicSystem: false },
  });

  const { toasts, addToast, removeToast } = useToast();

  const [editForm, setEditForm] = useState({
    hallName: '',
    description: '',
    capacity: 200,
    pricePerSeat: 50,
    phone: '',
    amenities: { wifi: false, parking: false, airConditioner: false, stage: false, musicSystem: false },
  });

  const [imageUrls, setImageUrls] = useState('');
  const [hallImages, setHallImages] = useState<string[]>([]);
  const [imageInputMode, setImageInputMode] = useState<'url' | 'file'>('url');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [mainImageInputMode, setMainImageInputMode] = useState<'url' | 'file'>('url');
  const [rejectModal, setRejectModal] = useState<{ requestId: string; comment: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  
  // Pagination & Filtering States
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const ITEMS_PER_PAGE = 6;

  const getPaginatedData = <T,>(data: T[]): T[] => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const token = localStorage.getItem('token');

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, roleFilter, statusFilter]);

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setHallForm(prev => ({ ...prev, mainImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await api.get(`/admin/users`);
        setUsers(res.data);
      } else if (activeTab === 'halls') {
        const res = await api.get(`/admin/halls`);
        setHalls(res.data);
        const ownersRes = await api.get(`/admin/owners`);
        setOwners(ownersRes.data);
      } else if (activeTab === 'bookings') {
        const res = await api.get(`/bookings`);
        setBookings(res.data);
      } else if (activeTab === 'stats') {
        const res = await api.get(`/admin/stats`);
        setStats(res.data);
      } else if (activeTab === 'requests') {
        const res = await api.get(`/admin/hall-requests`);
        setRequests(res.data);
      }
    } catch (error: any) {
      console.error('Data load error:', error);
      addToast('Maʼlumotlarni olishda xato yuz berdi. Iltimos, tarmoqni tekshiring.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      addToast('Iltimos, admin sifatida kiring', 'warning');
      return;
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleBlockUser = async (userId: string, isActive: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/block`, { block: isActive });
      addToast(isActive ? '🔒 Foydalanuvchi bloklandi' : '✅ Foydalanuvchi aktivlashtirildi', isActive ? 'warning' : 'success');
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleApproveHall = async (hallId: string, isActive: boolean) => {
    try {
      await api.put(`/admin/halls/${hallId}/approve`, { approve: !isActive });
      addToast(!isActive ? '✅ To\'yxona tasdiqlandi' : '⚠️ To\'yxona faolsizlantirildi', !isActive ? 'success' : 'warning');
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmModal({
      message: "Foydalanuvchini butunlay o'chirmoqchimisiz?",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${userId}`);
          addToast("🗑️ Foydalanuvchi o'chirildi", 'success');
          loadData();
        } catch (error: any) {
          addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
    });
  };

  const handleDeleteHallAdmin = (hallId: string) => {
    setConfirmModal({
      message: "To'yxonani butunlay o'chirmoqchimisiz?",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/halls/${hallId}`);
          addToast("🗑️ To'yxona o'chirildi", 'success');
          loadData();
        } catch (error: any) {
          addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
    });
  };

  const handleAddHall = async () => {
    if (!hallForm.hallName || !hallForm.region || !hallForm.capacity) {
      addToast("Barcha asosiy maydonlarni to'ldiring", 'warning');
      return;
    }

    try {
      // mainImage: hallForm.mainImage yoki hallImages[0] (birinchi rasm asosiy)
      const payload = {
        ...hallForm,
        mainImage: hallForm.mainImage || (hallImages.length > 0 ? hallImages[0] : ''),
        images: hallImages,
      };

      const res = await api.post(`/halls`, payload);
      
      const newHallId = res.data?.hall?.hall_id;
      if (newHallId && hallImages.length > 0) {
        try {
          await api.post(`/halls/${newHallId}/images`, { images: hallImages });
        } catch {}
      }

      addToast("✅ To'yxona muvaffaqiyatli yaratildi!", 'success');
      setShowAddHall(false);
      setHallImages([]);
      setImageUrlInput('');
      setImageInputMode('url');
      setHallForm({
        ownerId: '',
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
        amenities: { wifi: false, parking: false, airConditioner: false, stage: false, musicSystem: false },
      });
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleOpenEdit = (hall: any) => {
    setShowEditHall(hall.hall_id);
    setEditForm({
      hallName: hall.hall_name,
      description: hall.description || '',
      capacity: hall.capacity,
      pricePerSeat: typeof hall.price_per_seat === 'string' ? parseFloat(hall.price_per_seat) : hall.price_per_seat,
      phone: hall.phone || '',
      amenities: {
        wifi: hall.wifi || false,
        parking: hall.parking || false,
        airConditioner: hall.air_conditioner || false,
        stage: hall.stage || false,
        musicSystem: hall.music_system || false,
      },
    });
  };

  const handleEditHall = async () => {
    if (!editForm.hallName || !editForm.capacity) {
      addToast("Maydonlarni to'g'ri to'ldiring", 'warning');
      return;
    }

    try {
      await api.put(`/halls/${showEditHall}`, editForm);
      addToast("✅ To'yxona muvaffaqiyatli tahrirlandi", 'success');
      setShowEditHall(null);
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
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

  const handleApproveRequest = async (requestId: string) => {
    try {
      await api.put(`/admin/hall-requests/${requestId}/approve`, {});
      addToast("✅ So'rov muvaffaqiyatli tasdiqlandi!", 'success');
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleRejectRequest = async (requestId: string, adminComment: string = '') => {
    try {
      await api.put(`/admin/hall-requests/${requestId}/reject`, { adminComment });
      addToast("❌ So'rov rad etildi", 'warning');
      setRejectModal(null);
      loadData();
    } catch (error: any) {
      addToast('Xato: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  // Filter calculations
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const filteredHalls = halls.filter((h) => {
    const matchesSearch =
      h.hall_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.region?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter
      ? statusFilter === 'faol'
        ? h.is_active
        : !h.is_active
      : true;
    return matchesSearch && matchesStatus;
  });

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.hall_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.status?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? b.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const filteredRequests = requests.filter((req) => {
    const requestData = typeof req.data === 'string' ? JSON.parse(req.data) : req.data;
    const matchesSearch =
      requestData.hallName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? req.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Get active list for pagination count
  const getActiveList = () => {
    if (activeTab === 'users') return filteredUsers;
    if (activeTab === 'halls') return filteredHalls;
    if (activeTab === 'bookings') return filteredBookings;
    if (activeTab === 'requests') return filteredRequests;
    return [];
  };

  const totalPages = Math.ceil(getActiveList().length / ITEMS_PER_PAGE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-6 py-4 border-t border-luxury-100 dark:border-luxury-800/80">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-luxury-200 dark:border-luxury-800 text-xs font-semibold text-luxury-600 dark:text-luxury-400 hover:bg-luxury-50 dark:hover:bg-luxury-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ‹ Oldingi
        </button>
        <span className="text-xs font-bold text-luxury-600 dark:text-luxury-300">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-luxury-200 dark:border-luxury-800 text-xs font-semibold text-luxury-600 dark:text-luxury-400 hover:bg-luxury-50 dark:hover:bg-luxury-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Keyingi ›
        </button>
      </div>
    );
  };

  const tabs = [
    { id: 'users',    label: t.users,    icon: '👥' },
    { id: 'halls',    label: t.halls,    icon: '🏛️' },
    { id: 'requests', label: 'Arizalar', icon: '📩' },
    { id: 'bookings', label: 'Bronlar',  icon: '📅' },
    { id: 'stats',    label: t.stats,    icon: '📊' },
    { id: 'singers',  label: '🎤 Xonandalar', icon: '🎤' },
    { id: 'cars',     label: '🚗 Mashinalar', icon: '🚗' },
    { id: 'foods',    label: '🍽️ Ovqatlar',  icon: '🍽️' },
  ];

  return (
    <div className="min-h-screen bg-luxury-50 dark:bg-luxury-950 transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Banner */}
      <section className="bg-luxury-900 border-b border-gold-500/20 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-gold-500 uppercase tracking-widest">Platforma Ma'muriyati</span>
            <h1 className="text-3xl font-bold font-poppins mt-1">
              Tizim Adminstratori <span className="bg-gradient-to-r from-gold-400 to-gold-200 bg-clip-text text-transparent">Boshqaruv Paneli</span>
            </h1>
          </div>
          <div className="flex gap-4 text-sm text-luxury-300">
            <span className="bg-red-500/10 border border-red-500/20 text-red-500 font-bold px-4 py-2 rounded-xl">
              Tizim Nazorati
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as TabType); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer text-left border ${
                  activeTab === tab.id
                    ? 'bg-luxury-900 text-gold-500 border-gold-500/30 shadow-md dark:bg-luxury-900'
                    : 'bg-white hover:bg-luxury-100/50 text-luxury-700 border-luxury-200/50 hover:border-luxury-200 dark:bg-luxury-900 dark:hover:bg-luxury-800/50 dark:text-luxury-300 dark:border-luxury-800/80 dark:hover:border-luxury-800'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'bookings' && bookings.length > 0 && activeTab !== 'bookings' && (
                  <span className="ml-auto bg-gold-500 text-luxury-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {bookings.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Loading */}
            {loading && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-12 text-center shadow-premium flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-gold-500/20 border-t-gold-500 animate-spin" />
                <span className="text-sm font-medium text-luxury-500">Yuklanmoqda...</span>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && !loading && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium animate-fade">
                
                {/* User filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-luxury-100 dark:border-luxury-800/80">
                  <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white">
                    Platforma Foydalanuvchilari ({filteredUsers.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ism yoki email..."
                      className="px-4 py-2 text-xs bg-luxury-50 dark:bg-luxury-950 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl focus:outline-none focus:border-gold-500 transition-all w-48"
                    />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-luxury-50 dark:bg-luxury-950 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl focus:outline-none focus:border-gold-500 cursor-pointer"
                    >
                      <option value="">Barcha rollar</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <p className="text-center py-12 text-luxury-500 text-sm">Foydalanuvchilar topilmadi</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-luxury-200 dark:border-luxury-800 text-xs uppercase font-bold text-luxury-400">
                            <th className="py-4 px-3">Ism</th>
                            <th className="py-4 px-3">Email</th>
                            <th className="py-4 px-3">Telefon</th>
                            <th className="py-4 px-3">Rol</th>
                            <th className="py-4 px-3">Holati</th>
                            <th className="py-4 px-3 text-right">Amallar</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-luxury-700 dark:text-luxury-300">
                          {getPaginatedData(filteredUsers).map((user) => (
                            <tr key={user.user_id} className="border-b border-luxury-100 dark:border-luxury-800/50 hover:bg-luxury-50/50 dark:hover:bg-luxury-800/30 transition-colors">
                              <td className="py-4 px-3 font-semibold text-luxury-900 dark:text-white">{user.fullname}</td>
                              <td className="py-4 px-3 font-mono text-xs">{user.email}</td>
                              <td className="py-4 px-3">{user.phone || '—'}</td>
                              <td className="py-4 px-3">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                  user.role === 'admin' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                                  user.role === 'owner' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                  'bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-300'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-4 px-3">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  user.is_active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-red-100 dark:bg-red-950 text-red-600'
                                }`}>
                                  {user.is_active ? 'Faol' : 'Bloklangan'}
                                </span>
                              </td>
                              <td className="py-4 px-3 text-right">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleBlockUser(user.user_id, user.is_active)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors duration-250 cursor-pointer ${
                                      user.is_active
                                        ? 'bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 border border-amber-500/20'
                                        : 'bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 border border-emerald-500/20'
                                    }`}
                                  >
                                    {user.is_active ? t.block : t.unblock}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.user_id)}
                                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 transition-colors cursor-pointer"
                                    title="Foydalanuvchini o'chirish"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination()}
                  </>
                )}
              </div>
            )}

            {/* Halls Tab */}
            {activeTab === 'halls' && !loading && (
              <div className="animate-fade">
                
                {/* Halls filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-luxury-100 dark:border-luxury-800/80">
                  <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white">
                    Tizimdagi Barcha To'yxonalar ({filteredHalls.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddHall(true)}
                      className="gold-gradient text-luxury-950 font-semibold px-4 py-2 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300 text-xs flex items-center gap-1.5 mr-2"
                    >
                      <span>➕</span> To'yxona Qo'shish
                    </button>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nomi yoki hudud..."
                      className="px-4 py-2 text-xs bg-white dark:bg-luxury-900 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl focus:outline-none focus:border-gold-500 transition-all w-48"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-white dark:bg-luxury-900 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl focus:outline-none focus:border-gold-500 cursor-pointer"
                    >
                      <option value="">Barcha holatlar</option>
                      <option value="faol">Faol</option>
                      <option value="nofaol">Nofaol</option>
                    </select>
                  </div>
                </div>

                {filteredHalls.length === 0 ? (
                  <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-16 text-center shadow-premium">
                    <p className="font-semibold text-sm text-luxury-500">To'yxonalar topilmadi</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {getPaginatedData(filteredHalls).map((hall: any) => (
                        <div
                          key={hall.hall_id}
                          className="bg-white dark:bg-luxury-900 border border-luxury-200/60 dark:border-luxury-800/60 rounded-2xl p-5 flex flex-col shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-base text-luxury-900 dark:text-white">{hall.hall_name}</h4>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              hall.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
                             }`}>
                              {hall.is_active ? 'Faol' : 'Nofaol'}
                            </span>
                          </div>
                          <div className="text-xs text-luxury-500 dark:text-luxury-400 flex flex-col gap-1 mb-4 flex-grow">
                            <p>📍 Hudud: {hall.region}</p>
                            <p>👥 Sig'im: {hall.capacity} kishi</p>
                            <p>💵 Narx: ${hall.price_per_seat} / kishi</p>
                            {hall.phone && <p>📞 Tel: {hall.phone}</p>}
                            <p>👤 Owner: <span className="text-gold-600 dark:text-gold-450 font-semibold">{hall.owner_name || 'Tizim (Admin)'}</span></p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <button
                              onClick={() => handleOpenEdit(hall)}
                              className="bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 border border-amber-500/20 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer text-center"
                            >
                              ✏️ Tahrirlash
                            </button>
                            <button
                              onClick={() => handleDeleteHallAdmin(hall.hall_id)}
                              className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer text-center"
                            >
                              🗑️ O'chirish
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveHall(hall.hall_id, hall.is_active)}
                              className={`flex-grow py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer text-center border ${
                                hall.is_active
                                  ? 'bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 border-amber-500/20'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                              }`}
                            >
                              {hall.is_active ? 'Faolsizlantirish' : t.approve}
                            </button>
                            <button
                              onClick={() => setShowUploadImages(hall.hall_id)}
                              className="px-3 py-2 rounded-xl bg-luxury-100 dark:bg-luxury-800 hover:bg-gold-500 hover:text-luxury-950 text-gold-500 border border-gold-500/30 text-xs font-semibold transition-all duration-350 cursor-pointer"
                              title="Rasm yuklash"
                            >
                              📸
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {renderPagination()}
                  </>
                )}
              </div>
            )}

            {/* ===== BOOKINGS TAB ===== */}
            {activeTab === 'bookings' && !loading && (
              <div className="animate-fade flex flex-col gap-5">
                
                {/* Bookings filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-luxury-100 dark:border-luxury-800/80">
                  <div>
                    <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white">
                      Barcha Bronlar ({filteredBookings.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Mijoz yoki to'yxona..."
                      className="px-4 py-2 text-xs bg-white dark:bg-luxury-900 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-700 rounded-xl focus:outline-none focus:border-gold-500 transition-all w-48"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-white dark:bg-luxury-900 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-700 rounded-xl focus:outline-none focus:border-gold-500 cursor-pointer"
                    >
                      <option value="">Barcha holatlar</option>
                      <option value="pending">Kutilmoqda</option>
                      <option value="confirmed">Tasdiqlangan</option>
                      <option value="cancelled">Bekor qilingan</option>
                      <option value="completed">Tugallangan</option>
                    </select>
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-16 text-center shadow-premium">
                    <div className="text-4xl mb-3">📅</div>
                    <p className="font-semibold text-sm text-luxury-500">Bronlar topilmadi</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl shadow-premium overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-luxury-200 dark:border-luxury-800 bg-luxury-50 dark:bg-luxury-950/50 text-xs uppercase font-bold text-luxury-400">
                              <th className="py-4 px-4">Mijoz</th>
                              <th className="py-4 px-4">To'yxona</th>
                              <th className="py-4 px-4">Sana</th>
                              <th className="py-4 px-4">Mehmonlar</th>
                              <th className="py-4 px-4">Summa</th>
                              <th className="py-4 px-4">Holat</th>
                              <th className="py-4 px-4">Yaratildi</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm text-luxury-700 dark:text-luxury-300 divide-y divide-luxury-100 dark:divide-luxury-800/50">
                            {getPaginatedData(filteredBookings).map((booking) => {
                              const st = STATUS_LABEL[booking.status] || { text: booking.status, cls: 'bg-luxury-100 text-luxury-600' };
                              return (
                                <tr
                                  key={booking.booking_id}
                                  className="hover:bg-luxury-50/50 dark:hover:bg-luxury-800/30 transition-colors"
                                >
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-xs font-bold text-gold-600">
                                        {booking.fullname?.charAt(0).toUpperCase() || '?'}
                                      </div>
                                      <span className="font-semibold text-luxury-900 dark:text-white">{booking.fullname || '—'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="font-medium text-luxury-800 dark:text-luxury-200">{booking.hall_name || '—'}</span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="font-semibold text-gold-600 dark:text-gold-400">
                                      📅 {formatDate(booking.booking_date)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="flex items-center gap-1">
                                      👥 <strong>{booking.guest_count}</strong>
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="font-bold text-luxury-900 dark:text-white">
                                      ${booking.total_price?.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${st.cls}`}>
                                      {st.text}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-xs text-luxury-400">
                                    {formatDate(booking.created_at)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {renderPagination()}
                  </>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {[
                    { label: 'Jami Bronlar', val: bookings.length, icon: '📅', color: 'text-gold-500' },
                    { label: 'Kutilmoqda', val: bookings.filter(b => b.status === 'pending').length, icon: '⏳', color: 'text-amber-500' },
                    { label: 'Tasdiqlangan', val: bookings.filter(b => b.status === 'confirmed').length, icon: '✅', color: 'text-emerald-500' },
                    { label: 'Bekor', val: bookings.filter(b => b.status === 'cancelled').length, icon: '❌', color: 'text-red-500' },
                  ].map((card) => (
                    <div key={card.label} className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl p-4 shadow-sm text-center">
                      <p className="text-xl mb-1">{card.icon}</p>
                      <p className={`text-2xl font-bold font-poppins ${card.color}`}>{card.val}</p>
                      <p className="text-[10px] uppercase font-semibold text-luxury-400 tracking-wider mt-0.5">{card.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && !loading && stats && (
              <div className="animate-fade">
                <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-6">
                  Tizim Umumiy Hisobotlari
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl p-6 shadow-premium text-center">
                    <h4 className="text-xs font-semibold text-luxury-400 uppercase tracking-widest mb-1">A'zolar</h4>
                    <p className="text-3xl font-bold font-poppins text-gold-500">{stats.users}</p>
                  </div>
                  <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl p-6 shadow-premium text-center">
                    <h4 className="text-xs font-semibold text-luxury-400 uppercase tracking-widest mb-1">To'yxonalar</h4>
                    <p className="text-3xl font-bold font-poppins text-gold-500">{stats.halls}</p>
                  </div>
                  <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl p-6 shadow-premium text-center">
                    <h4 className="text-xs font-semibold text-luxury-400 uppercase tracking-widest mb-1">Jami Bandlar</h4>
                    <p className="text-3xl font-bold font-poppins text-gold-500">{stats.bookings}</p>
                  </div>
                  <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl p-6 shadow-premium text-center">
                    <h4 className="text-xs font-semibold text-luxury-400 uppercase tracking-widest mb-1">To'lovlar</h4>
                    <p className="text-3xl font-bold font-poppins text-emerald-500">{stats.payments}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && !loading && (
              <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium animate-fade">
                <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-6 border-b border-luxury-100 dark:border-luxury-800/80 pb-4">
                  To'yxona Qo'shish va Tahrirlash Arizalari ({filteredRequests.length})
                </h3>

                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12 text-luxury-500">
                    <span className="text-4xl block mb-4">📩</span>
                    <p className="font-semibold text-sm">Hozircha arizalar mavjud emas</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {getPaginatedData(filteredRequests).map((req: any) => {
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
                            <div className="mb-3 border-b border-luxury-100 dark:border-luxury-800/80 pb-2">
                              <p className="text-xs text-luxury-500">Arizachi (Owner):</p>
                              <p className="font-bold text-luxury-800 dark:text-luxury-200">
                                👤 {req.owner_name} {req.company_name ? `(${req.company_name})` : ''}
                              </p>
                            </div>

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

                            {req.status === 'pending' && (
                              <div className="flex gap-3 mt-5">
                                <button
                                  onClick={() => handleApproveRequest(req.request_id)}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl cursor-pointer text-xs transition-colors"
                                >
                                  Tasdiqlash
                                </button>
                                <button
                                  onClick={() => setRejectModal({ requestId: req.request_id, comment: '' })}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl cursor-pointer text-xs transition-colors"
                                >
                                  Rad Etish
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {renderPagination()}
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
                  Yangi To'yxona Qo'shish (Admin)
                </h2>
                <p className="text-xs text-luxury-500 mt-1">To'yxona ma'lumotlarini kiriting va egasini (owner) tanlang</p>
              </div>
              <button
                onClick={() => setShowAddHall(false)}
                className="bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-300 hover:bg-gold-500 hover:text-luxury-950 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">

              {/* ===== ASOSIY RASM (mainImage) ===== */}
              <div className="border border-luxury-200/65 dark:border-luxury-800/65 p-4 rounded-2xl flex flex-col gap-3">
                <label className="block text-xs font-bold text-luxury-400 uppercase tracking-wider">🖼️ Asosiy Rasm (Muqova)</label>
                {/* URL / File toggle */}
                <div className="flex gap-1 bg-luxury-100 dark:bg-luxury-950 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMainImageInputMode('url')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      mainImageInputMode === 'url'
                        ? 'bg-white dark:bg-luxury-800 text-luxury-900 dark:text-white shadow-sm'
                        : 'text-luxury-500 hover:text-luxury-700 dark:hover:text-luxury-300'
                    }`}
                  >
                    🌐 URL orqali
                  </button>
                  <button
                    type="button"
                    onClick={() => setMainImageInputMode('file')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      mainImageInputMode === 'file'
                        ? 'bg-white dark:bg-luxury-800 text-luxury-900 dark:text-white shadow-sm'
                        : 'text-luxury-500 hover:text-luxury-700 dark:hover:text-luxury-300'
                    }`}
                  >
                    💻 Kompyuterdan
                  </button>
                </div>
                {mainImageInputMode === 'url' ? (
                  <input
                    type="url"
                    placeholder="https://example.com/main-rasm.jpg"
                    value={hallForm.mainImage}
                    onChange={(e) => setHallForm({ ...hallForm, mainImage: e.target.value })}
                    className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold-500 transition-all"
                  />
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-luxury-300 dark:border-luxury-700 rounded-xl cursor-pointer hover:border-gold-500 hover:bg-gold-500/5 transition-all bg-luxury-50 dark:bg-luxury-950 group">
                    <span className="text-xl mb-1 group-hover:scale-110 transition-transform">📷</span>
                    <span className="text-xs text-luxury-500 font-medium">Asosiy rasmni kompyuterdan tanlang</span>
                    <span className="text-[10px] text-luxury-400 mt-0.5">JPG, PNG, WEBP qabul qilinadi</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainFileChange} />
                  </label>
                )}
                {hallForm.mainImage && (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-luxury-200/50 dark:border-luxury-800/50 bg-luxury-100 dark:bg-luxury-800">
                    <img
                      src={hallForm.mainImage}
                      alt="Asosiy rasm preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Rasm+topilmadi'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setHallForm({ ...hallForm, mainImage: '' })}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer"
                    >✕</button>
                  </div>
                )}
              </div>

              {/* ===== QO'SHIMCHA RASMLAR ===== */}
              <div>
                <label className="block text-xs font-bold text-luxury-400 uppercase tracking-wider mb-2">📸 Qo'shimcha Rasmlar (Galereya)</label>

                {/* Tab switcher */}
                <div className="flex gap-1 mb-3 bg-luxury-100 dark:bg-luxury-950 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      imageInputMode === 'url'
                        ? 'bg-white dark:bg-luxury-800 text-luxury-900 dark:text-white shadow-sm'
                        : 'text-luxury-500 hover:text-luxury-700 dark:hover:text-luxury-300'
                    }`}
                  >
                    🌐 URL orqali
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('file')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      imageInputMode === 'file'
                        ? 'bg-white dark:bg-luxury-800 text-luxury-900 dark:text-white shadow-sm'
                        : 'text-luxury-500 hover:text-luxury-700 dark:hover:text-luxury-300'
                    }`}
                  >
                    💻 Kompyuterdan
                  </button>
                </div>

                {/* URL input mode */}
                {imageInputMode === 'url' && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/rasm.jpg"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && imageUrlInput.trim()) {
                          e.preventDefault();
                          setHallImages((prev) => [...prev, imageUrlInput.trim()]);
                          setImageUrlInput('');
                        }
                      }}
                      className="flex-1 bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageUrlInput.trim()) {
                          setHallImages((prev) => [...prev, imageUrlInput.trim()]);
                          setImageUrlInput('');
                        }
                      }}
                      className="px-4 py-2.5 gold-gradient text-luxury-950 font-bold rounded-xl text-xs cursor-pointer hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300"
                    >
                      ➕
                    </button>
                  </div>
                )}

                {/* File input mode */}
                {imageInputMode === 'file' && (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-luxury-300 dark:border-luxury-700 rounded-xl cursor-pointer hover:border-gold-500 hover:bg-gold-500/5 transition-all bg-luxury-50 dark:bg-luxury-950 group">
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📁</span>
                    <span className="text-xs text-luxury-500 font-medium">Rasmlarni tanlash (bir yoki bir nechta)</span>
                    <span className="text-[10px] text-luxury-400 mt-0.5">JPG, PNG, WEBP qabul qilinadi</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setHallImages((prev) => [...prev, ev.target?.result as string]);
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}

                {/* Thumbnails preview */}
                {hallImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {hallImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img}
                          alt={`rasm ${i + 1}`}
                          className="w-16 h-16 object-cover rounded-xl border-2 border-luxury-200 dark:border-luxury-700 shadow-sm"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setHallImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center shadow-md"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-[8px] font-bold px-1 rounded">
                          {i + 1}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setHallImages([])}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-red-300 dark:border-red-800 text-red-400 text-xs font-semibold hover:border-red-500 hover:bg-red-500/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <span className="text-base">🗑️</span>
                      <span className="text-[9px]">Hammasi</span>
                    </button>
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

              <input
                type="text"
                placeholder="Telefon raqam"
                value={hallForm.phone}
                onChange={(e) => setHallForm({ ...hallForm, phone: e.target.value })}
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
                  Saqlash
                </button>
                <button
                  onClick={() => setShowAddHall(false)}
                  className="flex-1 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 font-semibold py-3 rounded-xl cursor-pointer transition-colors text-sm"
                >
                  Bekor qilish
                </button>
              </div>
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
                  To'yxonani Tahrirlash (Admin)
                </h2>
                <p className="text-xs text-luxury-500 mt-1">Ma'lumotlarni o'zgartiring</p>
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
                  Saqlash
                </button>
                <button
                  onClick={() => setShowEditHall(null)}
                  className="flex-1 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 font-semibold py-3 rounded-xl cursor-pointer transition-colors text-sm"
                >
                  Bekor qilish
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
                Saqlash
              </button>
              <button
                onClick={() => setShowUploadImages(null)}
                className="flex-1 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 font-semibold py-3 rounded-xl cursor-pointer transition-colors text-sm"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REJECT COMMENT MODAL ===== */}
      {rejectModal && (
        <div
          className="fixed inset-0 bg-luxury-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[2000] animate-fade"
          onClick={() => setRejectModal(null)}
        >
          <div
            className="bg-white dark:bg-luxury-900 border border-luxury-200 dark:border-luxury-800 rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-xl font-bold font-poppins text-luxury-900 dark:text-white">❌ Arizani Rad Etish</h2>
                <p className="text-xs text-luxury-500 mt-1">Rad etish sababini kiriting (ixtiyoriy)</p>
              </div>
              <button
                onClick={() => setRejectModal(null)}
                className="bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-300 hover:bg-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >✕</button>
            </div>
            <textarea
              value={rejectModal.comment}
              onChange={(e) => setRejectModal(prev => prev ? { ...prev, comment: e.target.value } : null)}
              placeholder="Masalan: Ma'lumotlar to'liq emas, rasm sifatsiz, hujjatlar talab qilinadi..."
              className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 min-h-[100px] resize-none transition-all"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => handleRejectRequest(rejectModal.requestId, rejectModal.comment)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl cursor-pointer text-sm transition-colors"
              >
                ❌ Rad Etishni Tasdiqlash
              </button>
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 font-semibold py-3 rounded-xl cursor-pointer transition-colors text-sm"
              >
                Bekor qilish
              </button>
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

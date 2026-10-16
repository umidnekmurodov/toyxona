import api from '../../utils/api';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { translations as t } from '../../utils/translations';
import { ToastContainer, useToast } from '../Toast';
import { formatPrice } from '../../utils/formatPrice';

interface Singer {
  singer_id: string;
  fullname: string;
  price: number | string;
  description: string | null;
  image_url: string | null;
}

interface Car {
  car_id: string;
  name: string;
  brand: string | null;
  model_year: number | null;
  price: number | string;
  image_url: string | null;
}

interface Food {
  food_id: string;
  name: string;
  description: string | null;
  price_per_guest: number | string;
  image_url: string | null;
}

interface Hall {
  hall_id: string;
  hall_name: string;
  description: string;
  region: string;
  district: string;
  address: string;
  capacity: number;
  price_per_seat: number | string;
  rating: number;
  main_image: string;
  wifi: boolean;
  parking: boolean;
  air_conditioner: boolean;
  stage: boolean;
  music_system: boolean;
  images: string[];
  is_favorited?: boolean;
  favorites_count?: number;
}

function toPriceNumber(value: number | string | null | undefined): number {
  const price = Number(value);
  return Number.isFinite(price) ? price : 0;
}

// --- Mini Calendar Component ---
interface CalendarProps {
  bookedDates: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

function BookingCalendar({ bookedDates, selectedDate, onSelect }: CalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const bookedSet = new Set(bookedDates);

  const toKey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthNames = [
    'Yanvar','Fevral','Mart','Aprel','May','Iyun',
    'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'
  ];
  const dayNames = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];

  const cells: (number | null)[] = [];
  const offset = (firstDay + 6) % 7;
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-luxury-100 dark:bg-luxury-800 hover:bg-gold-500 hover:text-luxury-950 text-luxury-600 dark:text-luxury-300 transition-all cursor-pointer text-sm font-bold"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-luxury-900 dark:text-white">
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-luxury-100 dark:bg-luxury-800 hover:bg-gold-500 hover:text-luxury-950 text-luxury-600 dark:text-luxury-300 transition-all cursor-pointer text-sm font-bold"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {dayNames.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-luxury-400 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const key = toKey(viewYear, viewMonth, day);
          const dateObj = new Date(viewYear, viewMonth, day);
          const isPast = dateObj < today;
          const isBooked = bookedSet.has(key);
          const isSelected = key === selectedDate;
          const isToday = dateObj.getTime() === today.getTime();
          const isDisabled = isPast || isBooked;

          let cellClass = 'w-full aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200 ';

          if (isSelected) {
            cellClass += 'bg-gold-500 text-luxury-950 shadow-md scale-105 ';
          } else if (isBooked) {
            cellClass += 'bg-luxury-200 dark:bg-luxury-800 text-luxury-400 dark:text-luxury-600 cursor-not-allowed line-through ';
          } else if (isPast) {
            cellClass += 'text-luxury-300 dark:text-luxury-700 cursor-not-allowed ';
          } else if (isToday) {
            cellClass += 'border-2 border-gold-500 text-gold-600 dark:text-gold-400 hover:bg-gold-500 hover:text-luxury-950 cursor-pointer ';
          } else {
            cellClass += 'text-luxury-700 dark:text-luxury-200 hover:bg-luxury-100 dark:hover:bg-luxury-800 cursor-pointer ';
          }

          return (
            <button
              key={key}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(key)}
              className={cellClass}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-luxury-100 dark:border-luxury-800/80 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gold-500" />
          <span className="text-[10px] text-luxury-400">Tanlangan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-luxury-200 dark:bg-luxury-800" />
          <span className="text-[10px] text-luxury-400">Band</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-gold-500" />
          <span className="text-[10px] text-luxury-400">Bugun</span>
        </div>
      </div>
    </div>
  );
}

// --- Singer Card Component ---
function SingerCard({ singer, isSelected, onSelect }: {
  singer: Singer;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 ${
        isSelected
          ? 'border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/20'
          : 'border-luxury-200 dark:border-luxury-700 bg-white dark:bg-luxury-900 hover:border-gold-500/50 hover:shadow-md'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
          ✓
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-2xl overflow-hidden">
          {singer.image_url ? (
            <img src={singer.image_url} alt={singer.fullname} className="w-full h-full object-cover" />
          ) : (
            '🎤'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-luxury-900 dark:text-white truncate">{singer.fullname}</h4>
          <p className="text-xs text-luxury-500 dark:text-luxury-400 truncate">{singer.description || 'Professional xonanda'}</p>
          <p className="text-sm font-bold text-gold-500 mt-1">{formatPrice(toPriceNumber(singer.price))}</p>
        </div>
      </div>
    </div>
  );
}

// --- Car Card Component ---
function CarCard({ car, isSelected, onSelect }: {
  car: Car;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 ${
        isSelected
          ? 'border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/20'
          : 'border-luxury-200 dark:border-luxury-700 bg-white dark:bg-luxury-900 hover:border-gold-500/50 hover:shadow-md'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
          ✓
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-luxury-700 to-luxury-900 flex items-center justify-center text-2xl overflow-hidden">
          {car.image_url ? (
            <img src={car.image_url} alt={car.name} className="w-full h-full object-cover" />
          ) : (
            '🚗'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-luxury-900 dark:text-white truncate">{car.name}</h4>
          <p className="text-xs text-luxury-500 dark:text-luxury-400">
            {car.brand} {car.model_year && `• ${car.model_year}`}
          </p>
          <p className="text-sm font-bold text-gold-500 mt-1">{formatPrice(toPriceNumber(car.price))}</p>
        </div>
      </div>
    </div>
  );
}

// --- Food Card Component ---
function FoodCard({ food, isSelected, onSelect }: {
  food: Food;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 ${
        isSelected
          ? 'border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/20'
          : 'border-luxury-200 dark:border-luxury-700 bg-white dark:bg-luxury-900 hover:border-gold-500/50 hover:shadow-md'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
          ✓
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl overflow-hidden">
          {food.image_url ? (
            <img src={food.image_url} alt={food.name} className="w-full h-full object-cover" />
          ) : (
            '🍽️'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-luxury-900 dark:text-white truncate">{food.name}</h4>
          <p className="text-xs text-luxury-500 dark:text-luxury-400 line-clamp-2">{food.description || 'Zamonaviy taom'}</p>
          <p className="text-sm font-bold text-gold-500 mt-1">{formatPrice(toPriceNumber(food.price_per_guest))} / kishi</p>
        </div>
      </div>
    </div>
  );
}

// --- Main HallDetail Component ---
export default function HallDetail() {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();
  const [hall, setHall] = useState<Hall | null>(null);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [guestCount, setGuestCount] = useState(150);
  const [note, setNote] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [kiyovName, setKiyovName] = useState('');
  const [kelinName, setKelinName] = useState('');
  const [activeExtrasTab, setActiveExtrasTab] = useState<'singers' | 'cars' | 'foods'>('singers');

  // Extras state
  const [singers, setSingers] = useState<Singer[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedSingerId, setSelectedSingerId] = useState<string | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [extrasLoading, setExtrasLoading] = useState(false);

  const token = localStorage.getItem('token');
  const { toasts, addToast, removeToast } = useToast();

  // Fetch extras data
  const fetchExtras = async () => {
    setExtrasLoading(true);
    try {
      const [singersRes, carsRes, foodsRes] = await Promise.all([
        api.get('/singers'),
        api.get('/cars'),
        api.get('/foods'),
      ]);
      setSingers(singersRes.data);
      setCars(carsRes.data);
      setFoods(foodsRes.data);
    } catch (error) {
      console.error('Extras fetch error:', error);
    } finally {
      setExtrasLoading(false);
    }
  };

  const fetchHallDetail = async () => {
    try {
      const response = await api.get(`/halls/${hallId}`);
      setHall(response.data);
    } catch (error) {
      console.error('Hall detail fetch error:', error);
      addToast("To'yxona ma'lumotlarini yuklashda xato", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!token || !hall) {
      addToast("Iltimos, sevimlilarga qo'shish uchun tizimga kiring", 'warning');
      return;
    }

    try {
      if (hall.is_favorited) {
        await api.delete(`/favorites/${hall.hall_id}`);
        setHall((prev) =>
          prev ? { ...prev, is_favorited: false, favorites_count: Math.max(0, (prev.favorites_count || 0) - 1) } : null
        );
      } else {
        await api.post(`/favorites`, { hallId: hall.hall_id });
        setHall((prev) =>
          prev ? { ...prev, is_favorited: true, favorites_count: (prev.favorites_count || 0) + 1 } : null
        );
      }
    } catch (err: any) {
      addToast('Xato: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const fetchBookedDates = async () => {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(new Date().setDate(new Date().getDate() + 90)).toISOString().split('T')[0];
      const response = await api.get(`/halls/${hallId}/availability?start=${startDate}&end=${endDate}`);
      
      const available = new Set(response.data.available as string[]);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const booked: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth() + 1;
        const day = d.getUTCDate();
        const key = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!available.has(key)) booked.push(key);
      }
      setBookedDates(booked);
    } catch (error) {
      console.error('Availability fetch error:', error);
    }
  };

  useEffect(() => {
    if (hallId) {
      fetchHallDetail();
      fetchBookedDates();
      fetchExtras();
    }
  }, [hallId]);

  const handleBooking = async () => {
    if (!token) {
      addToast('Iltimos, avval tizimga kiring', 'warning');
      return;
    }
    if (!selectedDate) {
      addToast('Iltimos, sanani tanlang', 'warning');
      return;
    }
    if (!guestCount || guestCount < 1) {
      addToast('Mehmonlar sonini kiriting', 'warning');
      return;
    }

    try {
      setBookingLoading(true);
      await api.post(`/bookings`, {
        hallId,
        bookingDate: selectedDate,
        guestCount: parseInt(guestCount.toString()),
        note,
        singerId: selectedSingerId,
        carId: selectedCarId,
        foodId: selectedFoodId,
      });
      setBookingSuccess(true);
      setBookedDates(prev => [...prev, selectedDate]);

      // Agar checkbox bosilgan va ikkala ism to'ldirilgan bo'lsa → avtomatik taklifnomaga o't
      if (showInfo && kiyovName.trim() && kelinName.trim()) {
        const bookingInfo = {
          kiyovName,
          kelinName,
          hallName: hall!.hall_name,
          date: formatDate(selectedDate),
          singerName: selectedSinger?.fullname ?? null,
          carName: selectedCar?.name ?? null,
          foodName: selectedFood?.name ?? null,
        };
        localStorage.setItem('bookingInfo', JSON.stringify(bookingInfo));
        navigate('/taklifnoma');
      }
    } catch (error: any) {
      addToast('Booking yaratishda xato: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  // Derived selections and prices are inexpensive to calculate on each render.
  const selectedSinger = singers.find(s => s.singer_id === selectedSingerId);
  const selectedCar = cars.find(c => c.car_id === selectedCarId);
  const selectedFood = foods.find(f => f.food_id === selectedFoodId);
  const pricePerSeat = toPriceNumber(hall?.price_per_seat);
  const hallPrice = pricePerSeat * guestCount;
  const singerPrice = toPriceNumber(selectedSinger?.price);
  const carPrice = toPriceNumber(selectedCar?.price);
  const foodPrice = toPriceNumber(selectedFood?.price_per_guest) * guestCount;
  const totalPrice = hallPrice + singerPrice + carPrice + foodPrice;

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-50 dark:bg-luxury-950 flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-gold-500/30 border-t-gold-500 animate-spin" />
        <p className="text-luxury-500 font-medium">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (!hall) {
    return (
      <div className="min-h-screen bg-luxury-50 dark:bg-luxury-950 flex flex-col justify-center items-center gap-4">
        <span className="text-5xl">🏛️</span>
        <h2 className="text-2xl font-bold text-luxury-800 dark:text-white">To'yxona topilmadi</h2>
        <Link to="/" className="text-gold-500 font-semibold underline mt-2">Bosh sahifaga qaytish</Link>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  };

  return (
    <div className="min-h-screen bg-luxury-50 dark:bg-luxury-950 pb-20 transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Detail Header */}
      <section className="bg-white dark:bg-luxury-900 border-b border-luxury-200/60 dark:border-luxury-800/60 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gold-500/10 text-gold-600 dark:text-gold-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-gold-500/20">
                Premium To'yxona
              </span>
              <span className="text-yellow-400 text-sm font-bold flex items-center gap-1">
                ⭐ {hall.rating || '4.9'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-poppins text-luxury-900 dark:text-white">
              {hall.hall_name}
            </h1>
            <p className="text-sm text-luxury-500 dark:text-luxury-400 mt-2 flex items-center gap-1.5 font-medium">
              <span>📍</span> {hall.region}, {hall.district} | {hall.address}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-luxury-400 uppercase tracking-widest">Narxi (kishi boshi)</p>
              <p className="text-2xl font-bold text-gold-500">{formatPrice(pricePerSeat)}</p>
            </div>
            
            <button
              onClick={handleToggleFavorite}
              className={`p-3 rounded-xl border transition-all duration-300 shadow-sm cursor-pointer flex items-center justify-center gap-1.5 ${
                hall.is_favorited
                  ? 'bg-red-500/20 border-red-500/40 text-red-500 scale-105'
                  : 'bg-luxury-100 dark:bg-luxury-800 border-luxury-200 dark:border-luxury-800 text-luxury-400 dark:text-luxury-300 hover:text-red-500'
              }`}
            >
              <span className="text-base">❤️</span>
              <span className="text-xs font-bold font-mono">{hall.favorites_count || 0}</span>
            </button>

            <button
              onClick={() => setShowBooking(true)}
              className="gold-gradient text-luxury-950 font-semibold px-6 py-3 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300"
            >
              Bron qilish
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Image Gallery */}
          <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 shadow-premium">
            <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-4">Galereya</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 h-96 rounded-2xl overflow-hidden shadow-sm bg-luxury-100 dark:bg-luxury-800">
                {hall.main_image ? (
                  <img src={hall.main_image} alt={hall.hall_name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-6xl gap-3 text-luxury-400">
                    <span>🏛️</span>
                    <span className="text-sm font-medium">Asosiy rasm yuklanmagan</span>
                  </div>
                )}
              </div>
              {hall.images?.map((img, idx) => (
                <div key={idx} className="h-32 rounded-xl overflow-hidden shadow-sm bg-luxury-100 dark:bg-luxury-800">
                  <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium">
            <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-4">Tavsif</h3>
            <p className="text-luxury-600 dark:text-luxury-300 text-sm sm:text-base leading-relaxed">
              {hall.description || "Ushbu to'yxona haqida batafsil ma'lumot kiritilmagan."}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium">
            <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-6">Xususiyatlar va Qulayliklar</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[
                { name: 'Bepul WiFi', val: hall.wifi, icon: '📡' },
                { name: 'Katta Avtoturargoh', val: hall.parking, icon: '🅿️' },
                { name: 'Konditsioner', val: hall.air_conditioner, icon: '❄️' },
                { name: 'Katta Sahna', val: hall.stage, icon: '🎭' },
                { name: 'Professional Ovoz', val: hall.music_system, icon: '🔊' },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                    item.val
                      ? 'border-gold-500/20 bg-gold-500/5 text-luxury-950 dark:text-white'
                      : 'border-luxury-200 dark:border-luxury-800 opacity-40 text-luxury-400'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-semibold">{item.name}</span>
                  <span className="text-xs">{item.val ? 'Mavjud' : 'Mavjud emas'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inline Calendar Preview */}
          <div className="bg-white dark:bg-luxury-900 border border-luxury-200/50 dark:border-luxury-800/50 rounded-3xl p-6 sm:p-8 shadow-premium">
            <h3 className="text-lg font-bold font-poppins text-luxury-900 dark:text-white mb-2">Band Qilish Kalendari</h3>
            <p className="text-xs text-luxury-400 mb-6">Kulrang sanalar band qilingan. Sana tanlang va bron tugmasini bosing.</p>
            <BookingCalendar
              bookedDates={bookedDates}
              selectedDate={selectedDate}
              onSelect={(date) => setSelectedDate(date)}
            />
            {selectedDate && (
              <div className="mt-4 p-3 bg-gold-500/10 border border-gold-500/30 rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold text-luxury-800 dark:text-white">
                  📅 {formatDate(selectedDate)} tanlandi
                </span>
                <button
                  onClick={() => setShowBooking(true)}
                  className="gold-gradient text-luxury-950 text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer hover:shadow-md transition-all active:scale-95"
                >
                  Davom etish →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sticky Calculator Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white dark:bg-luxury-900 border border-luxury-200/60 dark:border-luxury-800/60 rounded-3xl p-6 shadow-premium transition-shadow hover:shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold uppercase tracking-wider text-luxury-500 dark:text-luxury-400">Hisob-kitob</span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">Faol</span>
            </div>

            {/* Extras Tabs */}
            <div className="flex gap-1 mb-4 bg-luxury-100 dark:bg-luxury-950 p-1 rounded-xl">
              {[
                { id: 'singers', label: '🎤 Xonandalar' },
                { id: 'cars', label: '🚗 Mashinalar' },
                { id: 'foods', label: '🍽️ Ovqatlar' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveExtrasTab(tab.id as typeof activeExtrasTab)}
                  className={`flex-1 py-2 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                    activeExtrasTab === tab.id
                      ? 'bg-white dark:bg-luxury-800 text-luxury-900 dark:text-white shadow-sm'
                      : 'text-luxury-500 hover:text-luxury-700 dark:hover:text-luxury-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Extras Content */}
            {extrasLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {activeExtrasTab === 'singers' && singers.map((singer) => (
                  <SingerCard
                    key={singer.singer_id}
                    singer={singer}
                    isSelected={selectedSingerId === singer.singer_id}
                    onSelect={() => setSelectedSingerId(selectedSingerId === singer.singer_id ? null : singer.singer_id)}
                  />
                ))}
                {activeExtrasTab === 'cars' && cars.map((car) => (
                  <CarCard
                    key={car.car_id}
                    car={car}
                    isSelected={selectedCarId === car.car_id}
                    onSelect={() => setSelectedCarId(selectedCarId === car.car_id ? null : car.car_id)}
                  />
                ))}
                {activeExtrasTab === 'foods' && foods.map((food) => (
                  <FoodCard
                    key={food.food_id}
                    food={food}
                    isSelected={selectedFoodId === food.food_id}
                    onSelect={() => setSelectedFoodId(selectedFoodId === food.food_id ? null : food.food_id)}
                  />
                ))}
                {!singers.length && !cars.length && !foods.length && (
                  <p className="text-center text-luxury-400 text-sm py-4">Ma'lumotlar mavjud emas</p>
                )}
              </div>
            )}

            {/* Taklifnoma uchun nomlar */}
            <div className="mb-4">
              {/* Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group mb-3">
                <div
                  onClick={() => { setShowInfo(!showInfo); if (showInfo) { setKiyovName(''); setKelinName(''); } }}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${
                    showInfo ? 'bg-gold-500' : 'bg-luxury-200 dark:bg-luxury-700'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                    showInfo ? 'left-[22px]' : 'left-0.5'
                  }`} />
                </div>
                <span className="text-xs font-semibold text-luxury-600 dark:text-luxury-300 group-hover:text-luxury-900 dark:group-hover:text-white transition-colors">
                  💍 Taklifnoma tayyorlash
                </span>
              </label>

              {/* Inputlar — faqat checkbox yoqilganda */}
              {showInfo && (
                <div className="p-4 bg-gradient-to-br from-gold-500/5 to-luxury-100/30 dark:from-gold-500/5 dark:to-luxury-900/50 border border-gold-500/20 rounded-2xl flex flex-col gap-2 animate-fade">
                  <input
                    type="text"
                    value={kiyovName}
                    onChange={(e) => setKiyovName(e.target.value)}
                    placeholder="🤵 Kuyov ismi"
                    className="w-full bg-white/70 dark:bg-luxury-950/70 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-700 focus:border-gold-500 dark:focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm font-medium placeholder:text-luxury-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                  />
                  <input
                    type="text"
                    value={kelinName}
                    onChange={(e) => setKelinName(e.target.value)}
                    placeholder="👰 Kelin ismi"
                    className="w-full bg-white/70 dark:bg-luxury-950/70 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-700 focus:border-gold-500 dark:focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm font-medium placeholder:text-luxury-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
                  />
                  {kiyovName.trim() && kelinName.trim() && (
                    <p className="text-[10px] text-gold-500 font-semibold flex items-center gap-1">
                      ✓ Bron qilingandan so'ng taklifnoma ochiladi
                    </p>
                  )}
                  {showInfo && (!kiyovName.trim() || !kelinName.trim()) && (
                    <p className="text-[10px] text-luxury-400 flex items-center gap-1">
                      Ikkala ismni to'ldiring
                    </p>
                  )}
                </div>
              )}
            </div>
            <label className="text-xs font-semibold text-luxury-500 dark:text-luxury-400 uppercase tracking-wider mb-2 block">
              Mehmonlar soni
            </label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
              min={1}
              max={hall.capacity}
              className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 transition-all font-semibold mb-2"
            />
            <span className="text-[11px] text-luxury-400 mt-1 block mb-4">Maksimal sig'im: {hall.capacity} kishi</span>

            {selectedDate && (
              <div className="p-3 bg-gold-500/10 border border-gold-500/20 rounded-xl mb-4">
                <p className="text-xs text-luxury-500 dark:text-luxury-400 mb-0.5">Tanlangan sana:</p>
                <p className="text-sm font-bold text-luxury-900 dark:text-white">📅 {formatDate(selectedDate)}</p>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="bg-luxury-50 dark:bg-luxury-950 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl p-4 mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-luxury-500">Zal narxi:</span>
                  <span className="font-semibold text-luxury-800 dark:text-luxury-200">{formatPrice(hallPrice)}</span>
                </div>
                {singerPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-luxury-500">Xonanda:</span>
                    <span className="font-semibold text-luxury-800 dark:text-luxury-200">{formatPrice(singerPrice)}</span>
                  </div>
                )}
                {carPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-luxury-500">Mashina:</span>
                    <span className="font-semibold text-luxury-800 dark:text-luxury-200">{formatPrice(carPrice)}</span>
                  </div>
                )}
                {foodPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-luxury-500">Ovqat:</span>
                    <span className="font-semibold text-luxury-800 dark:text-luxury-200">{formatPrice(foodPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-luxury-200/50 dark:border-luxury-800/50 pt-2 mt-2">
                  <span className="font-bold text-luxury-900 dark:text-white">Jami:</span>
                  <span className="font-bold text-gold-500 text-lg">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBooking(true)}
              className="w-full gold-gradient text-luxury-950 font-semibold py-3 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300 text-center text-sm"
            >
              {selectedDate ? `${formatDate(selectedDate)} — Bron qilish` : 'Sanani Tanlang'}
            </button>
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {showBooking && (
        <div
          className="fixed inset-0 bg-luxury-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[1000] animate-fade"
          onClick={() => setShowBooking(false)}
        >
          <div
            className="bg-white dark:bg-luxury-900 border border-luxury-200 dark:border-luxury-800 rounded-3xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {bookingSuccess ? (
              <div className="p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-4xl animate-scale-in">
                  🎉
                </div>
                <h2 className="text-xl font-bold font-poppins text-luxury-900 dark:text-white">
                  Muvaffaqiyatli!
                </h2>
                <p className="text-sm text-luxury-500 dark:text-luxury-400 leading-relaxed">
                  Broningiz qabul qilindi. Owner tasdiqlashini kuting.
                </p>
                <button
                  onClick={() => { setShowBooking(false); setBookingSuccess(false); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl cursor-pointer hover:shadow-lg active:scale-95 transition-all duration-300 text-sm flex items-center justify-center gap-2"
                >
                  <span>👍</span> Yaxshi
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start p-6 sm:p-8 pb-4 border-b border-luxury-100 dark:border-luxury-800/80">
                  <div>
                    <h2 className="text-xl font-bold font-poppins text-luxury-900 dark:text-white">Zalni Band Qilish</h2>
                    <p className="text-xs text-luxury-500 dark:text-luxury-400 mt-1">{hall.hall_name}</p>
                  </div>
                  <button
                    onClick={() => setShowBooking(false)}
                    className="bg-luxury-100 dark:bg-luxury-800 text-luxury-600 dark:text-luxury-300 hover:bg-gold-500 hover:text-luxury-950 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 sm:p-8 pt-5 flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-luxury-500 dark:text-luxury-400 uppercase tracking-wider">📅 Sanani Tanlang</label>
                    <div className="border border-luxury-200 dark:border-luxury-700 rounded-2xl p-4 bg-luxury-50/50 dark:bg-luxury-950/50">
                      <BookingCalendar bookedDates={bookedDates} selectedDate={selectedDate} onSelect={(date) => setSelectedDate(date)} />
                    </div>
                    {selectedDate && <p className="text-xs text-gold-600 dark:text-gold-400 font-semibold mt-1">✔ {formatDate(selectedDate)} tanlandi</p>}
                    {!selectedDate && <p className="text-xs text-luxury-400 mt-1">Yuqoridan sana tanlang</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-luxury-500 dark:text-luxury-400 uppercase tracking-wider">👥 Mehmonlar soni</label>
                    <input
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                      min={1}
                      max={hall.capacity}
                      className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 font-semibold"
                    />
                    <span className="text-[11px] text-luxury-400">Maksimal: {hall.capacity} kishi</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-luxury-500 dark:text-luxury-400 uppercase tracking-wider">📝 Izoh (ixtiyoriy)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Maxsus talablar..."
                      rows={3}
                      className="w-full bg-luxury-100/50 dark:bg-luxury-950/50 text-luxury-900 dark:text-white border border-luxury-200 dark:border-luxury-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold-500 resize-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-luxury-50 dark:bg-luxury-950 border border-luxury-200/50 dark:border-luxury-800/50 rounded-2xl p-4">
                    <div className="flex justify-between items-center text-sm mb-1.5">
                      <span className="text-luxury-500">Zal narxi:</span>
                      <span className="font-semibold text-luxury-800 dark:text-luxury-200">{formatPrice(hallPrice)}</span>
                    </div>
                    {singerPrice > 0 && (
                      <div className="flex justify-between items-center text-sm mb-1.5">
                        <span className="text-luxury-500">Xonanda:</span>
                        <span className="font-semibold text-luxury-800 dark:text-luxury-200">{formatPrice(singerPrice)}</span>
                      </div>
                    )}
                    {carPrice > 0 && (
                      <div className="flex justify-between items-center text-sm mb-1.5">
                        <span className="text-luxury-500">Mashina:</span>
                        <span className="font-semibold text-luxury-800 dark:text-luxury-200">{formatPrice(carPrice)}</span>
                      </div>
                    )}
                    {foodPrice > 0 && (
                      <div className="flex justify-between items-center text-sm mb-1.5">
                        <span className="text-luxury-500">Ovqat:</span>
                        <span className="font-semibold text-luxury-800 dark:text-luxury-200">{formatPrice(foodPrice)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm border-t border-luxury-200/40 dark:border-luxury-800/40 pt-2.5 mt-1.5">
                      <span className="font-bold text-luxury-900 dark:text-white">Jami to'lov:</span>
                      <span className="font-bold text-gold-500 text-lg">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleBooking}
                      disabled={bookingLoading || !selectedDate}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl cursor-pointer hover:shadow-lg active:scale-95 transition-all duration-300 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bookingLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>✔</span>}
                      {bookingLoading ? 'Yuborilmoqda...' : 'Bronlash'}
                    </button>
                    <button
                      onClick={() => setShowBooking(false)}
                      className="flex-1 border border-luxury-200 dark:border-luxury-800 text-luxury-600 dark:text-luxury-400 hover:bg-luxury-100 dark:hover:bg-luxury-800 font-semibold py-3 rounded-xl cursor-pointer transition-colors text-sm"
                    >
                      {t.cancel}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';

interface BookingInfo {
  kiyovName: string;
  kelinName: string;
  hallName: string;
  date: string;
  singerName?: string | null;
  carName?: string | null;
  foodName?: string | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

const UZBEK_MONTHS: Record<string, number> = {
  'Yanvar': 0, 'Fevral': 1, 'Mart': 2, 'Aprel': 3, 'May': 4, 'Iyun': 5,
  'Iyul': 6, 'Avgust': 7, 'Sentabr': 8, 'Oktabr': 9, 'Noyabr': 10, 'Dekabr': 11,
};

function parseUzbekDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(' ');
  if (parts.length < 3) return null;
  const day = parseInt(parts[0]);
  const month = UZBEK_MONTHS[parts[1]];
  const year = parseInt(parts[2]);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;
  return new Date(year, month, day, 12, 0, 0);
}

function getTimeLeft(target: Date | null): TimeLeft {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast: false,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function Taklifnoma() {
  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  const targetDate = useMemo(() => info ? parseUzbekDate(info.date) : null, [info]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bookingInfo');
      if (stored) setInfo(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!targetDate) return;
    setTimeLeft(getTimeLeft(targetDate));
    const interval = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!info) {
    return (
      <div className="min-h-screen bg-luxury-950 flex items-center justify-center">
        <div className="text-center text-luxury-300 px-4">
          <span className="text-6xl block mb-6">💍</span>
          <h2 className="text-2xl font-bold text-white mb-3">Taklifnoma topilmadi</h2>
          <p className="text-luxury-400 text-sm mb-6">Avval to'yxona bron qiling</p>
          <a href="/" className="gold-gradient text-luxury-950 font-bold px-6 py-3 rounded-xl">
            Bosh sahifaga qaytish
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-950 via-luxury-900 to-luxury-800 flex items-center justify-center p-4 sm:p-8 transition-colors duration-300">
      <div className="w-full max-w-2xl animate-scale-in">

        {/* Outer gold border */}
        <div
          className="relative p-[1px] rounded-3xl"
          style={{ background: 'linear-gradient(135deg, #C89B3C, #F3EAD3, #C89B3C, #856120, #C89B3C)' }}
        >
          <div className="rounded-3xl overflow-hidden bg-luxury-950/80 backdrop-blur-xl">

            {/* Top gold bar */}
            <div className="gold-gradient h-2 w-full" />

            <div className="p-8 sm:p-12">

              {/* Header */}
              <div className="text-center mb-10 animate-fade">
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    <span className="text-6xl filter drop-shadow-2xl">💍</span>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full animate-pulse" />
                  </div>
                </div>
                <p className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em] mb-3">
                  Premium To'y Taklifnomasi
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold font-poppins text-white">
                  Sizni To'yimizga
                </h1>
                <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-gold-400 mt-1">
                  Taklif Qilamiz!
                </h2>

                {/* Decorative divider */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-500/60" />
                  <span className="text-gold-500 text-lg">✦</span>
                  <span className="text-gold-300 text-sm">✦</span>
                  <span className="text-gold-500 text-lg">✦</span>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-500/60" />
                </div>
              </div>

              {/* Kelin & Kuyov */}
              <div className="text-center mb-10">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-300/20 to-rose-400/20 border border-rose-300/30 flex items-center justify-center text-3xl mb-2">
                      👰
                    </div>
                    <p className="text-[10px] text-gold-400/70 uppercase tracking-[0.2em] mb-1">Kelin</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white font-poppins">
                      {info.kelinName || 'Kelin ismi'}
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="text-4xl animate-pulse">💗</div>
                    <p className="text-xs text-gold-400/50 mt-1 font-light italic">va</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-300/20 to-indigo-400/20 border border-blue-300/30 flex items-center justify-center text-3xl mb-2">
                      🤵
                    </div>
                    <p className="text-[10px] text-gold-400/70 uppercase tracking-[0.2em] mb-1">Kuyov</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white font-poppins">
                      {info.kiyovName || 'Kuyov ismi'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px flex-1 bg-luxury-700/50" />
                <span className="text-gold-500/50 text-xs tracking-widest">✦ ✦ ✦</span>
                <div className="h-px flex-1 bg-luxury-700/50" />
              </div>

              {/* Wedding Details Cards — Sana va To'yxona */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-luxury-900/60 border border-luxury-700/30 rounded-2xl p-5 text-center hover:border-gold-500/30 transition-all">
                  <span className="text-3xl block mb-3">📅</span>
                  <p className="text-[10px] text-gold-400/70 uppercase tracking-wider mb-1">To'y Kuni</p>
                  <p className="text-sm font-bold text-white leading-snug">{info.date}</p>
                </div>

                <div className="bg-luxury-900/60 border border-luxury-700/30 rounded-2xl p-5 text-center hover:border-gold-500/30 transition-all">
                  <span className="text-3xl block mb-3">🏛️</span>
                  <p className="text-[10px] text-gold-400/70 uppercase tracking-wider mb-1">To'yxona</p>
                  <p className="text-sm font-bold text-white leading-snug">{info.hallName}</p>
                </div>
              </div>

              {/* Tanlangan xizmatlar */}
              {(info.singerName || info.carName || info.foodName) && (
                <div className="bg-luxury-900/50 border border-gold-500/20 rounded-2xl p-5 mb-8">
                  <p className="text-[10px] text-gold-400/70 uppercase tracking-wider text-center mb-4">
                    Tanlangan Xizmatlar
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {info.singerName && (
                      <span className="bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs px-4 py-2 rounded-full font-semibold">
                        🎤 {info.singerName}
                      </span>
                    )}
                    {info.carName && (
                      <span className="bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs px-4 py-2 rounded-full font-semibold">
                        🚗 {info.carName}
                      </span>
                    )}
                    {info.foodName && (
                      <span className="bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs px-4 py-2 rounded-full font-semibold">
                        🍽️ {info.foodName}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Wedding Quote */}
              <div className="text-center mb-8 px-4">
                <p className="text-luxury-300 text-sm italic leading-relaxed font-light">
                  "Baxtli oilaviy hayot — eng katta boylik.
                  <br />
                  Sizlarning yangi hayotingiz muborak bo'lsin!"
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="mb-8">
                <p className="text-[10px] text-luxury-400 uppercase tracking-widest text-center mb-5">
                  {timeLeft.isPast ? "🎉 To'y bo'lib o'tdi" : "To'yga qolgan vaqt"}
                </p>
                {!timeLeft.isPast && (
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: timeLeft.days, label: 'Kun' },
                      { value: timeLeft.hours, label: 'Soat' },
                      { value: timeLeft.minutes, label: 'Daqiqa' },
                      { value: timeLeft.seconds, label: 'Soniya' },
                    ].map(({ value, label }) => (
                      <div
                        key={label}
                        className="bg-luxury-900/80 border border-gold-500/20 rounded-2xl p-4 text-center hover:border-gold-500/40 transition-all"
                      >
                        <p className="text-2xl sm:text-3xl font-bold text-gold-400 font-poppins">
                          {pad(value)}
                        </p>
                        <p className="text-[9px] text-luxury-500 uppercase tracking-wider mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {timeLeft.isPast && (
                  <div className="text-center py-6">
                    <span className="text-5xl block mb-3">🎊</span>
                    <p className="text-gold-400 font-semibold text-lg">Yangi hayotingiz muborak bo'lsin!</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 gold-gradient text-luxury-950 font-bold py-4 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-gold-500/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>🖨️</span> Chop Etish
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 border border-luxury-700/60 text-luxury-300 hover:border-gold-500/40 hover:text-gold-400 font-semibold py-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>←</span> Orqaga
                </button>
              </div>

            </div>

            {/* Bottom gold bar */}
            <div className="gold-gradient h-2 w-full" />
          </div>
        </div>

      </div>
    </div>
  );
}

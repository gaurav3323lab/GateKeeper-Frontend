import React, { useState, useEffect } from 'react';
import { ExternalLink, Tag, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { adsAPI } from '../services/api';

const DUMMY_ADS = [
  {
    id: 1,
    title: 'Fresh Organic Groceries',
    description: 'Special 15% discount for Society Residents. Delivered to your door!',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=200',
    link: '#',
    bgColor: 'from-green-500/20 to-emerald-700/20'
  },
  {
    id: 2,
    title: 'Expert Home Cleaning',
    description: 'Deep cleaning services starting at ₹999. Book now!',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400&h=200',
    link: '#',
    bgColor: 'from-blue-500/20 to-indigo-700/20'
  }
];

export default function AdBanner() {
  const { isDark } = useTheme();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await adsAPI.getAll();
        setAds(res.data.length > 0 ? res.data : DUMMY_ADS);
      } catch (err) {
        console.error('Failed to fetch ads, falling back to dummy:', err);
        setAds(DUMMY_ADS);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length === 0) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [ads]);

  if (loading) return null;
  if (ads.length === 0) return null;

  const ad = ads[currentAdIndex];

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-xl transition-all duration-700 ease-in-out border ${isDark ? 'border-slate-700/60 bg-slate-800/40' : 'border-gray-200 bg-white/60'} backdrop-blur-md`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${ad.bgColor} opacity-50`}></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center p-4 gap-4">
        {/* Image/Visual Area */}
        <div className="w-full md:w-1/3 h-32 md:h-24 rounded-xl overflow-hidden shrink-0 relative">
           <img src={ad.image} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
           <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
             <Tag size={10} /> Promoted
           </div>
        </div>

        {/* Ad Content */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className={`text-lg font-black leading-tight mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {ad.title}
          </h3>
          <p className={`text-sm mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {ad.description}
          </p>
          <a 
            href={ad.link} 
            className="self-start inline-flex items-center gap-1 text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/30"
          >
            Claim Offer <ExternalLink size={12} />
          </a>
        </div>
      </div>
      
      {/* Dots Indicator */}
      <div className="absolute bottom-2 right-4 flex gap-1 z-10">
        {ads.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentAdIndex ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-400/50'}`}
          />
        ))}
      </div>
    </div>
  );
}

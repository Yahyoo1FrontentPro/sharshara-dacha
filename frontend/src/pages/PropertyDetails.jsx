import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { DayPicker } from 'react-day-picker';
import { addDays, isBefore, startOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { ru, uz } from 'date-fns/locale';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { t, language } = useContext(LanguageContext);
  
  const [property, setProperty] = useState(null);
  const [takenDates, setTakenDates] = useState([]);
  const [selectedRange, setSelectedRange] = useState();
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    api.getProperty(id).then(setProperty).catch(console.error);
    fetchBookings();
  }, [id]);

  const fetchBookings = () => {
    api.getPropertyBookings(id).then(bookings => {
      const dates = bookings.map(b => ({
        from: new Date(b.check_in),
        to: new Date(b.check_out)
      }));
      setTakenDates(dates);
    }).catch(console.error);
  };

  const isDateDisabled = (date) => {
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return true;
    
    if (property?.available_from && property?.available_to) {
      if (date < startOfDay(new Date(property.available_from)) || date > startOfDay(new Date(property.available_to))) {
        return true;
      }
    }

    return takenDates.some(range => 
      date >= startOfDay(range.from) && date <= startOfDay(range.to)
    );
  };

  const handleSelect = (range) => {
    setError('');
    setSuccess('');
    
    if (range?.from && range?.to) {
      const days = eachDayOfInterval({ start: range.from, end: range.to });
      
      if (user?.role !== 'ADMIN' && days.length - 1 > 3) {
        setError(t('error_max_3_days') || "Maksimum 3 kun bron qilish mumkin / Максимум 3 дня");
        setSelectedRange({ from: range.from, to: undefined });
        return;
      }

      const hasDisabled = days.some(day => isDateDisabled(day));
      
      if (hasDisabled) {
        setError(t('error_taken_dates'));
        setSelectedRange({ from: range.from, to: undefined });
        return;
      }
    }
    setSelectedRange(range);
  };

  const bookQuick = (days) => {
    let start = addDays(startOfDay(new Date()), 1); 
    
    let found = false;
    for (let i = 0; i < 30; i++) {
      let testStart = addDays(start, i);
      let testEnd = addDays(testStart, days - 1);
      
      let testDays = eachDayOfInterval({ start: testStart, end: testEnd });
      if (!testDays.some(d => isDateDisabled(d))) {
        setSelectedRange({ from: testStart, to: testEnd });
        found = true;
        break;
      }
    }
    if (!found) setError(t('error_no_free_days'));
  };

  const handleBook = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedRange?.from || !selectedRange?.to) {
      setError(t('error_select_dates'));
      return;
    }
    
    try {
      await api.createBooking({
        property_id: id,
        check_in: selectedRange.from.toISOString().split('T')[0],
        check_out: selectedRange.to.toISOString().split('T')[0],
        comment
      });
      setSuccess(t('success_booking'));
      setSelectedRange(undefined);
      setComment('');
      fetchBookings(); 
    } catch (err) {
      setError(err.message);
    }
  };

  // Sort media: videos first, then images
  const mediaList = useMemo(() => {
    if (!property?.images) return [];
    const videos = property.images.filter(src => src.match(/\.(mp4|webm|ogg)$/i));
    const images = property.images.filter(src => src.match(/\.(jpg|jpeg|png|webp|gif)$/i));
    return [...videos, ...images];
  }, [property]);

  const handleNextMedia = () => {
    setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrevMedia = () => {
    setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  if (!property) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>{t('loading')}</div>;

  const currentMedia = mediaList[activeMediaIndex];
  const isVideo = currentMedia && currentMedia.match(/\.(mp4|webm|ogg)$/i);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>{property.name}</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {property.amenities.map((am, i) => (
            <span key={i} style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem' }}>
              {am}
            </span>
          ))}
        </div>
      </div>

      <div className="grid">
        {/* Left Column: Images & Description */}
        <div>
          {mediaList.length > 0 ? (
            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <div style={{ width: '100%', height: '400px', backgroundColor: '#000', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isVideo ? (
                  <video 
                    key={currentMedia} 
                    src={`http://localhost:3000${currentMedia}`} 
                    controls 
                    autoPlay
                    style={{ width: '100%', maxHeight: '100%' }} 
                  />
                ) : (
                  <img 
                    key={currentMedia}
                    src={`http://localhost:3000${currentMedia}`} 
                    alt={property.name} 
                    className="gallery-img"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                )}
              </div>
              
              {mediaList.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn btn-outline" onClick={handlePrevMedia} style={{ padding: '0.5rem 1rem' }}>&larr; {language === 'uz' ? 'Oldingi' : 'Пред'}</button>
                  <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>{activeMediaIndex + 1} / {mediaList.length}</span>
                  <button className="btn btn-outline" onClick={handleNextMedia} style={{ padding: '0.5rem 1rem' }}>{language === 'uz' ? 'Keyingi' : 'След'} &rarr;</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ width: '100%', height: '300px', backgroundColor: '#e0e0e0', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}></div>
          )}
          
          <h3>{t('description_title')}</h3>
          <p style={{ whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>{property.description}</p>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '1rem' }}>{language === 'uz' ? 'Joylashuv / Lokatsiya' : 'Локация'}</h3>
              <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d310.076975857165!2d70.07122233001962!3d41.56247592194746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38af73005cb9e731%3A0xabfa9acf656946c2!2sShaxriyorni%20dachasi!5e1!3m2!1sru!2s!4v1782736406812!5m2!1sru!2s" width="100%" height="350" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              </div>
              
              <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                {language === 'uz' ? "Navigator orqali yo'nalish qurish:" : "Построить маршрут в навигаторе:"}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="yandexnavi://build_route_on_map?lat_to=41.562476&lon_to=70.071222" className="btn btn-outline" style={{ flex: 1, textAlign: 'center', minWidth: '140px', padding: '0.8rem', fontWeight: 'bold' }}>Yandex Navigator</a>
                <a href="https://yandex.ru/maps/?pt=70.071222,41.562476&z=18&l=map" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, textAlign: 'center', minWidth: '140px', padding: '0.8rem' }}>Yandex Maps</a>
                <a href="https://www.google.com/maps/dir/?api=1&destination=41.562476,70.071222" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, textAlign: 'center', minWidth: '140px', padding: '0.8rem' }}>Google Maps</a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calendar & Booking form */}
        <div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ textAlign: 'center' }}>{t('choose_dates')}</h3>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <DayPicker
                  mode="range"
                  selected={selectedRange}
                  onSelect={handleSelect}
                  disabled={isDateDisabled}
                  locale={language === 'ru' ? ru : uz}
                  numberOfMonths={1}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {(!user || user?.role === 'ADMIN') && (
                  <button onClick={() => bookQuick(7)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.9rem' }}>{t('week_btn')}</button>
                )}
                <button onClick={() => bookQuick(3)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.9rem' }}>{t('weekend_btn')}</button>
              </div>

              {selectedRange?.from && selectedRange?.to && (
                <div style={{ backgroundColor: 'rgba(74, 124, 89, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                  <strong>{t('check_in_label')}</strong> {selectedRange.from.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ')} <br />
                  <strong>{t('check_out_label')}</strong> {selectedRange.to.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ')}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t('comment_label')}</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  value={comment} 
                  onChange={e => setComment(e.target.value)}
                  placeholder={t('comment_placeholder')}
                ></textarea>
              </div>

              {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
              {success && <div style={{ color: 'var(--color-success)', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{success}</div>}

              <button 
                onClick={handleBook} 
                className="btn btn-primary btn-block"
                disabled={!selectedRange?.from || !selectedRange?.to}
              >
                {t('send_request')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

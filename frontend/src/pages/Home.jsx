import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { MapPin, Users, Home as HomeIcon } from 'lucide-react';
import { LanguageContext } from '../context/LanguageContext';

export default function Home() {
  const { t } = useContext(LanguageContext);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProperties()
      .then(data => {
        setProperties(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>{t('loading')}</div>;

  return (
    <div>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '4rem', 
        padding: '5rem 2rem', 
        background: 'linear-gradient(135deg, rgba(151,188,98,0.2) 0%, rgba(44,95,45,0.05) 100%)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: 'var(--glass-border)'
      }}>
        <h1 style={{ fontSize: '3.5rem', color: 'var(--color-primary)', marginBottom: '1rem', fontWeight: '800' }}>
          {t('hero_title')}
        </h1>
        <p style={{ color: 'var(--color-text-main)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', fontWeight: '400', lineHeight: '1.8' }}>
          {t('hero_desc')}
        </p>
      </div>

      <div className="grid">
        {properties.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>{t('no_properties')}</p>
        ) : (
          properties.map(p => {
            const firstMedia = p.images && p.images.length > 0 ? p.images[0] : null;
            const isVideo = firstMedia && firstMedia.match(/\.(mp4|webm|ogg)$/i);
            return (
            <div key={p.id} className="card">
              {firstMedia ? (
                isVideo ? (
                  <video src={`http://localhost:3000${firstMedia}`} className="card-img" style={{ backgroundColor: '#000' }} muted />
                ) : (
                  <img src={`http://localhost:3000${firstMedia}`} alt={p.name} className="card-img" />
                )
              ) : (
                <img src="https://via.placeholder.com/400x300?text=No+Media" alt="Placeholder" className="card-img" />
              )}
              <div className="card-body">
                <h3>{p.name}</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.description}
                </p>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {p.amenities.slice(0, 3).map((am, i) => (
                    <span key={i} style={{ backgroundColor: '#f0f0f0', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' }}>
                      {am}
                    </span>
                  ))}
                  {p.amenities.length > 3 && <span style={{ padding: '4px' }}>+{p.amenities.length - 3}</span>}
                </div>

                <Link to={`/property/${p.id}`} className="btn btn-primary btn-block">
                  {t('more_details')}
                </Link>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}

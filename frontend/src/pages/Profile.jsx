import React, { useEffect, useState, useContext } from 'react';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const { t, language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api.getBookings()
      .then(data => {
        setBookings(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [user, navigate]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return <span className="badge badge-pending">{t('status_pending')}</span>;
      case 'APPROVED': return <span className="badge badge-approved">{t('status_approved')}</span>;
      case 'REJECTED': return <span className="badge badge-rejected">{t('status_rejected')}</span>;
      case 'BLOCKED': return <span className="badge badge-blocked">{t('status_blocked')}</span>;
      default: return status;
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>{t('loading')}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>{t('profile_title')}</h2>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h3>{t('my_data')}</h3>
          <p><strong>{t('name_label')}:</strong> {user.name}</p>
          <p><strong>{t('phone_label')}:</strong> {user.phone}</p>
        </div>
      </div>

      <h3>{t('my_bookings')}</h3>
      {bookings.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>{t('no_bookings')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map(b => (
            <div key={b.id} className="card">
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{b.property_name}</h4>
                  <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0 0' }}>
                    {new Date(b.check_in).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ')} &mdash; {new Date(b.check_out).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ')}
                  </p>
                  {b.comment && <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>"{b.comment}"</p>}
                </div>
                <div>
                  {getStatusBadge(b.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

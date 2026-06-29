import React, { useEffect, useState, useContext } from 'react';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { formatPhone } from '../utils';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const { t, language } = useContext(LanguageContext);
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');

  const [newProp, setNewProp] = useState({ name: '', description: '', amenities: '', mediaFiles: '' });
  const [availability, setAvailability] = useState({ property_id: '', available_from: '', available_to: '' });
  const [manualBooking, setManualBooking] = useState({ property_id: '', check_in: '', check_out: '', guest_name: '', guest_phone: '+998', comment: '' });
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const bks = await api.getBookings();
      setBookings(bks);
      const props = await api.getProperties();
      setProperties(props);
      if (props.length > 0) {
        if (!manualBooking.property_id) setManualBooking(prev => ({ ...prev, property_id: props[0].id }));
        if (!availability.property_id) setAvailability({ property_id: props[0].id, available_from: props[0].available_from || '', available_to: props[0].available_to || '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateBookingStatus(id, status);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    try {
      const data = { ...newProp };
      if (data.mediaFiles) {
        data.images = data.mediaFiles.split(',').map(s => s.trim());
      }
      await api.createProperty(data);
      alert(t('success_booking') || 'Success');
      setNewProp({ name: '', description: '', amenities: '', mediaFiles: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateAvailability = async (e) => {
    e.preventDefault();
    try {
      await api.updatePropertyAvailability(availability.property_id, {
        available_from: availability.available_from,
        available_to: availability.available_to
      });
      alert('Success');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleManualBooking = async (e) => {
    e.preventDefault();
    setManualError('');
    setManualSuccess('');
    try {
      await api.createBooking({
        property_id: manualBooking.property_id,
        check_in: manualBooking.check_in,
        check_out: manualBooking.check_out,
        comment: manualBooking.comment || 'Manual Block',
        guest_name: manualBooking.guest_name,
        guest_phone: manualBooking.guest_phone,
        status: 'APPROVED'
      });
      setManualSuccess('Бронь создана!');
      setManualBooking({ ...manualBooking, check_in: '', check_out: '', guest_name: '', guest_phone: '+998', comment: '' });
      fetchData();
    } catch (err) {
      setManualError(err.message);
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const otherBookings = bookings.filter(b => b.status !== 'PENDING');

  const getStatusText = (status) => {
    if (status === 'APPROVED') return t('status_approved');
    if (status === 'REJECTED') return t('status_rejected');
    if (status === 'BLOCKED') return t('status_blocked');
    return t('status_pending');
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>{t('admin_panel_title')}</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('requests')}>
          {t('incoming_requests')} ({pendingBookings.length})
        </button>
        <button className={`btn ${activeTab === 'manual' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('manual')}>
          {t('manual_booking')}
        </button>
        <button className={`btn ${activeTab === 'properties' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('properties')}>
          {t('manage_properties')}
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="grid">
          {pendingBookings.length === 0 ? <p>Нет новых заявок.</p> : pendingBookings.map(b => (
            <div key={b.id} className="card">
              <div className="card-body">
                <h4>{b.property_name}</h4>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>{t('check_in_label')}</strong> {new Date(b.check_in).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ')} <br />
                  <strong>{t('check_out_label')}</strong> {new Date(b.check_out).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ')}
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <small>{b.user_name} ({b.user_phone})</small>
                </div>
                {b.comment && (
                  <p style={{ fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '1rem' }}>"{b.comment}"</p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleUpdateStatus(b.id, 'APPROVED')} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>{t('approve')}</button>
                  <button onClick={() => handleUpdateStatus(b.id, 'REJECTED')} className="btn btn-danger" style={{ flex: 1, padding: '0.5rem' }}>{t('reject')}</button>
                </div>
              </div>
            </div>
          ))}

          {otherBookings.length > 0 && (
            <div style={{ gridColumn: '1 / -1', marginTop: '3rem' }}>
              <h3>История заявок</h3>
              <div className="grid">
                {otherBookings.map(b => (
                  <div key={b.id} className="card" style={{ opacity: 0.8 }}>
                    <div className="card-body">
                      <h4>{b.property_name}</h4>
                      <div>{new Date(b.check_in).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ')} - {new Date(b.check_out).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ')}</div>
                      <div style={{ margin: '0.5rem 0' }}>
                        <small>{b.user_name} ({b.user_phone})</small>
                      </div>
                      <div>
                        <span className={`badge badge-${b.status.toLowerCase()}`}>
                          {getStatusText(b.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="grid">
          <div className="card" style={{ maxWidth: '500px' }}>
            <div className="card-body">
              <h3>{t('block_dates_title')}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {t('block_dates_desc')}
              </p>
              
              <form onSubmit={handleManualBooking}>
                <div className="form-group">
                  <label className="form-label">{t('property_label')}</label>
                  <select className="form-control" value={manualBooking.property_id} onChange={e => setManualBooking({...manualBooking, property_id: e.target.value})} required>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">{t('check_in_label')}</label>
                    <input type="date" className="form-control" value={manualBooking.check_in} onChange={e => setManualBooking({...manualBooking, check_in: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">{t('check_out_label')}</label>
                    <input type="date" className="form-control" value={manualBooking.check_out} onChange={e => setManualBooking({...manualBooking, check_out: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Имя гостя (необязательно)</label>
                  <input type="text" className="form-control" value={manualBooking.guest_name} onChange={e => setManualBooking({...manualBooking, guest_name: e.target.value})} placeholder="Иван" />
                </div>
                <div className="form-group">
                  <label className="form-label">Телефон гостя (необязательно)</label>
                  <input type="text" className="form-control" value={manualBooking.guest_phone} onChange={e => setManualBooking({...manualBooking, guest_phone: formatPhone(e.target.value)})} placeholder="+998901234567" />
                </div>
                
                {manualError && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{manualError}</div>}
                {manualSuccess && <div style={{ color: 'var(--color-success)', marginBottom: '1rem' }}>{manualSuccess}</div>}

                <button type="submit" className="btn btn-primary btn-block">{t('create_booking_btn')}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ maxWidth: '600px' }}>
          <div className="card-body">
            <h3>{t('new_property_title')}</h3>
            <form onSubmit={handleCreateProperty}>
              <div className="form-group">
                <label className="form-label">{t('name_label')}</label>
                <input type="text" className="form-control" value={newProp.name} onChange={e => setNewProp({...newProp, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('desc_label')}</label>
                <textarea className="form-control" rows="4" value={newProp.description} onChange={e => setNewProp({...newProp, description: e.target.value})} required></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">{t('amenities_comma')}</label>
                <input type="text" className="form-control" value={newProp.amenities} onChange={e => setNewProp({...newProp, amenities: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('media_comma')}</label>
                <input type="text" className="form-control" value={newProp.mediaFiles} onChange={e => setNewProp({...newProp, mediaFiles: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary btn-block">{t('save')}</button>
            </form>
          </div>
        </div>

        <div className="card" style={{ maxWidth: '600px' }}>
          <div className="card-body">
            <h3>{t('availability_title')}</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{t('availability_desc')}</p>
            <form onSubmit={handleUpdateAvailability}>
              <div className="form-group">
                <label className="form-label">{t('property_label')}</label>
                <select className="form-control" value={availability.property_id} onChange={e => {
                  const prop = properties.find(p => p.id == e.target.value);
                  setAvailability({ property_id: prop.id, available_from: prop.available_from || '', available_to: prop.available_to || '' });
                }} required>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('available_from')}</label>
                  <input type="date" className="form-control" value={availability.available_from} onChange={e => setAvailability({...availability, available_from: e.target.value})} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('available_to')}</label>
                  <input type="date" className="form-control" value={availability.available_to} onChange={e => setAvailability({...availability, available_to: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="btn btn-outline btn-block">{t('update_season')}</button>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

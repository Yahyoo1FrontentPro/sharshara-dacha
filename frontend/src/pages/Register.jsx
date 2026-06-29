import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { formatPhone } from '../utils';

export default function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.register({ name, phone, password });
      const res = await api.login({ phone, password });
      login(res.user, res.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="card">
        <div className="card-body">
          <h2 style={{ textAlign: 'center', color: 'var(--color-primary)' }}>{t('register_title')}</h2>
          {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('name_label')}</label>
              <input type="text" className="form-control" placeholder={t('name_placeholder')} value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone_label')}</label>
              <input type="text" className="form-control" placeholder="123 45 67" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('password_label')}</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">{t('register_btn')}</button>
          </form>
          <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {t('have_account')} <Link to="/login" style={{ color: 'var(--color-primary)' }}>{t('login_btn')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

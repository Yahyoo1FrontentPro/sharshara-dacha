import React, { useContext } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { LanguageProvider, LanguageContext } from './context/LanguageContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PropertyDetails from './pages/PropertyDetails';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { language, toggleLanguage, t } = useContext(LanguageContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          {t('app_title') || "Dacha Booking"}
        </Link>
        <div className="navbar-links">
          <button 
            onClick={toggleLanguage} 
            className="btn btn-outline" 
            style={{ padding: '0.4rem 0.8rem', marginRight: '1rem', fontSize: '0.9rem' }}
          >
            {language === 'uz' ? "O'Z" : "RU"}
          </button>
          
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="btn btn-outline">{t('admin_panel')}</Link>
              )}
              <Link to="/profile" className="btn btn-outline">{t('profile_title') || "Личный Кабинет"}</Link>
              <button onClick={handleLogout} className="btn btn-danger">{t('logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">{t('login')}</Link>
              <Link to="/register" className="btn btn-primary">{t('register')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Navbar />
        <main className="container" style={{ padding: '2rem 20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

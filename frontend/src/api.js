const API_URL = '/api';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // If body is FormData (for file uploads), let browser set content-type
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Что-то пошло не так');
  }
  
  if (response.status === 204) return null;
  return response.json();
};

export const api = {
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProperties: () => request('/properties'),
  getProperty: (id) => request(`/properties/${id}`),
  createProperty: (data) => request('/properties', { method: 'POST', body: JSON.stringify(data) }),
  updatePropertyAvailability: (id, data) => request(`/properties/${id}/availability`, { method: 'PUT', body: JSON.stringify(data) }),
  getBookings: () => request('/bookings'),
  getPropertyBookings: (id) => request(`/bookings/property/${id}`),
  createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBookingStatus: (id, status) => request(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  blockDates: (data) => request('/bookings/block', { method: 'POST', body: JSON.stringify(data) }),
  manualBooking: (data) => request('/bookings/manual', { method: 'POST', body: JSON.stringify(data) }),
};

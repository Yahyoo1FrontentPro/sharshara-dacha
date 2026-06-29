const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'dacha_secret_super_key';

app.use(cors());
app.use(express.json());

// Serve static media from the "photos and videos" folder in the project root
const mediaDir = path.join(__dirname, '..', 'photos and videos');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir);
}
app.use('/media', express.static(mediaDir));

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });
  next();
};

// --- AUTH API ---
app.post('/api/auth/register', (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'All fields are required' });

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.run(`INSERT INTO users (name, phone, password) VALUES (?, ?, ?)`, [name, phone, hash], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Phone number already registered' });
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'User registered successfully', id: this.lastID });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  db.get(`SELECT * FROM users WHERE phone = ?`, [phone], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(400).json({ error: 'User not found' });

    bcrypt.compare(password, user.password, (err, match) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!match) return res.status(400).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    });
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get(`SELECT id, name, phone, role FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// --- PROPERTIES API ---
app.get('/api/properties', (req, res) => {
  db.all(`SELECT * FROM properties`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const properties = rows.map(r => ({
      ...r,
      images: JSON.parse(r.images || '[]'),
      amenities: JSON.parse(r.amenities || '[]')
    }));
    res.json(properties);
  });
});

app.get('/api/properties/:id', (req, res) => {
  db.get(`SELECT * FROM properties WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    row.images = JSON.parse(row.images || '[]');
    row.amenities = JSON.parse(row.amenities || '[]');
    res.json(row);
  });
});

app.post('/api/properties', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, amenities, mediaFiles } = req.body;
  
  // Parse media files string into array
  const mediaArray = mediaFiles ? mediaFiles.split(',').map(s => s.trim()).filter(Boolean) : [];
  const imagePaths = mediaArray.map(f => '/media/' + f);
  
  // Amenities might be passed as JSON string or array
  let parsedAmenities = Array.isArray(amenities) ? amenities : [];
  if (typeof amenities === 'string') {
    parsedAmenities = amenities.split(',').map(s => s.trim()).filter(Boolean);
  }

  db.run(`INSERT INTO properties (name, description, images, amenities, available_from, available_to) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, JSON.stringify(imagePaths), JSON.stringify(parsedAmenities), '2020-01-01', '2100-12-31'],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ id: this.lastID, message: 'Property created' });
    }
  );
});

app.put('/api/properties/:id/availability', authenticateToken, requireAdmin, (req, res) => {
  const { available_from, available_to } = req.body;
  if (!available_from || !available_to) return res.status(400).json({ error: 'Missing dates' });

  db.run(`UPDATE properties SET available_from = ?, available_to = ? WHERE id = ?`,
    [available_from, available_to, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ message: 'Availability updated successfully' });
    }
  );
});

// --- BOOKINGS API ---

// Utility function to check for overlaps
const checkOverlap = (propertyId, checkIn, checkOut, excludeBookingId = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE property_id = ? 
      AND status IN ('APPROVED', 'BLOCKED') 
      AND (check_in < ? AND check_out > ?)
    `;
    let params = [propertyId, checkOut, checkIn];

    if (excludeBookingId) {
      query += ` AND id != ?`;
      params.push(excludeBookingId);
    }

    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row.count > 0);
    });
  });
};

app.get('/api/bookings', authenticateToken, (req, res) => {
  let query = `
    SELECT b.*, p.name as property_name, 
           COALESCE(u.name, b.guest_name) as user_name, 
           COALESCE(u.phone, b.guest_phone) as user_phone
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    LEFT JOIN users u ON b.user_id = u.id
  `;
  const params = [];

  // If normal user, only show their bookings. If admin, show all.
  if (req.user.role !== 'ADMIN') {
    query += ` WHERE b.user_id = ?`;
    params.push(req.user.id);
  } else {
    // Optionally filter by property for admin calendar
    if (req.query.property_id) {
      query += ` WHERE b.property_id = ?`;
      params.push(req.query.property_id);
    }
  }

  query += ` ORDER BY b.check_in ASC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.get('/api/bookings/property/:id', (req, res) => {
  // Public endpoint to get taken dates for a property calendar
  db.all(`
    SELECT check_in, check_out, status 
    FROM bookings 
    WHERE property_id = ? AND status IN ('APPROVED', 'BLOCKED')
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { property_id, check_in, check_out, comment } = req.body;
  const user_id = req.user.id;

  if (!property_id || !check_in || !check_out) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (check_in >= check_out) {
    return res.status(400).json({ error: 'Check-out date must be after check-in date' });
  }

  const durationDays = (new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24);
  if (req.user.role !== 'ADMIN' && durationDays > 3) {
    return res.status(400).json({ error: 'Maksimum 3 kun bron qilish mumkin / Максимум 3 дня' });
  }

  try {
    const isOverlapping = await checkOverlap(property_id, check_in, check_out);
    if (isOverlapping) {
      return res.status(409).json({ error: 'Выбранные даты уже заняты' }); // The requested exact error message in Russian
    }

    db.run(`INSERT INTO bookings (user_id, property_id, check_in, check_out, status, comment) VALUES (?, ?, ?, ?, 'PENDING', ?)`,
      [user_id, property_id, check_in, check_out, comment],
      function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ id: this.lastID, message: 'Booking request sent' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin approves/rejects
app.put('/api/bookings/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body; // 'APPROVED' or 'REJECTED'
  const bookingId = req.params.id;

  if (status === 'APPROVED') {
    // Re-verify no overlap before approving
    db.get(`SELECT property_id, check_in, check_out FROM bookings WHERE id = ?`, [bookingId], async (err, booking) => {
      if (err || !booking) return res.status(404).json({ error: 'Booking not found' });
      
      try {
        const isOverlapping = await checkOverlap(booking.property_id, booking.check_in, booking.check_out, bookingId);
        if (isOverlapping) {
          return res.status(409).json({ error: 'These dates have already been taken by another approved booking.' });
        }

        db.run(`UPDATE bookings SET status = ? WHERE id = ?`, [status, bookingId], (err) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          
          // Reject other pending overlapping bookings for the same property
          db.run(`
            UPDATE bookings 
            SET status = 'REJECTED' 
            WHERE property_id = ? AND status = 'PENDING' AND id != ?
            AND (check_in < ? AND check_out > ?)
          `, [booking.property_id, bookingId, booking.check_out, booking.check_in]);

          res.json({ message: 'Booking approved' });
        });
      } catch (e) {
        res.status(500).json({ error: 'Server error' });
      }
    });
  } else if (status === 'REJECTED') {
    db.run(`UPDATE bookings SET status = ? WHERE id = ?`, [status, bookingId], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ message: 'Booking rejected' });
    });
  } else {
    res.status(400).json({ error: 'Invalid status' });
  }
});

// Admin manual block or manual guest booking
app.post('/api/bookings/manual', authenticateToken, requireAdmin, async (req, res) => {
  const { property_id, check_in, check_out, guest_name, guest_phone, comment } = req.body;
  const user_id = req.user.id; // Admin user who created it

  try {
    const isOverlapping = await checkOverlap(property_id, check_in, check_out);
    if (isOverlapping) {
      return res.status(409).json({ error: 'Выбранные даты уже заняты' });
    }

    const status = 'APPROVED'; // Automatically approved if admin creates it

    db.run(`INSERT INTO bookings (user_id, guest_name, guest_phone, property_id, check_in, check_out, status, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, guest_name || null, guest_phone || null, property_id, check_in, check_out, status, comment || (guest_name ? 'Ручная бронь' : 'Заблокировано админом')],
      function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        // Also reject overlapping pending bookings automatically
        db.run(`
          UPDATE bookings 
          SET status = 'REJECTED' 
          WHERE property_id = ? AND status = 'PENDING'
          AND (check_in < ? AND check_out > ?)
        `, [property_id, check_out, check_in]);

        res.status(201).json({ id: this.lastID, message: 'Бронь успешно добавлена' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDb();
  }
});

function initializeDb() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER'
    )`);

    // Properties table
    db.run(`CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      images TEXT, -- JSON array of paths
      amenities TEXT, -- JSON array of strings
      available_from DATE,
      available_to DATE
    )`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      guest_name TEXT,
      guest_phone TEXT,
      property_id INTEGER,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      comment TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(property_id) REFERENCES properties(id)
    )`);

    // Seed default admin user
    const adminPhone = '+998 70 035 44 33';
    const adminPasswordPlain = 'nokia6120';
    
    db.get(`SELECT * FROM users WHERE role = 'ADMIN'`, [], (err, row) => {
      if (!row) {
        bcrypt.hash(adminPasswordPlain, 10, (err, hash) => {
          if (!err) {
            db.run(`INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)`, 
              ['Главный Администратор', adminPhone, hash, 'ADMIN'], 
              (err) => {
                if (!err) console.log('Default admin user created. Phone: admin, Password: admin');
              });
          }
        });
      }
    });

    // Seed default property if missing
    db.get(`SELECT count(*) as count FROM properties`, [], (err, row) => {
      if (!err && row.count === 0) {
        const mediaDir = path.resolve(__dirname, '..', 'photos and videos');
        let mediaFiles = [];
        if (fs.existsSync(mediaDir)) {
          mediaFiles = fs.readdirSync(mediaDir).filter(f => f.match(/\.(jpg|jpeg|png|webp|gif|mp4|webm|ogg)$/i));
        }
        const mediaPaths = mediaFiles.map(f => '/media/' + f);
        const amenities = JSON.stringify(['Баня', 'Мангал', 'Wi-Fi', 'Парковка', 'Бассейн']);
        
        // Set default availability window to current year
        const currentYear = new Date().getFullYear();
        const defaultFrom = `${currentYear}-01-01`;
        const defaultTo = `${currentYear}-12-31`;

        db.run(`INSERT INTO properties (name, description, images, amenities, available_from, available_to) VALUES (?, ?, ?, ?, ?, ?)`,
          ['Наша Дача', 'Уютная дача на природе, идеально подходящая для семейного отдыха. Замечательное место вдали от городской суеты.', JSON.stringify(mediaPaths), amenities, defaultFrom, defaultTo],
          (err) => {
            if (!err) console.log('Default property created automatically with media files.');
            else console.error('Failed to create default property:', err.message);
          }
        );
      } else if (!err) {
        // Schema update for existing properties (if they don't have available_from)
        // SQLite ALTER TABLE ADD COLUMN does not support adding multiple at once, so we'll do it safely using try/catch
        db.run(`ALTER TABLE properties ADD COLUMN available_from DATE`, [], (err) => {
          // Ignore error if column already exists
        });
        db.run(`ALTER TABLE properties ADD COLUMN available_to DATE`, [], (err) => {
          // Ignore error if column already exists
        });
      }
    });
  });
}

module.exports = db;

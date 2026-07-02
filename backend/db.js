require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set. Please set it in your Render environment variables.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Utility to convert SQLite `?` placeholders to PostgreSQL `$1, $2, ...`
const convertQuery = (sql) => {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
};

const db = {
  run: async (sql, params = [], callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      let pgSql = convertQuery(sql);
      // Automatically add RETURNING id for INSERT queries to simulate this.lastID
      if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql += ' RETURNING id';
      }
      const result = await pool.query(pgSql, params);
      const context = {
        lastID: result.rows.length && result.rows[0].id ? result.rows[0].id : null,
        changes: result.rowCount
      };
      if (callback) callback.call(context, null);
    } catch (err) {
      if (callback) callback.call(null, err);
    }
  },
  get: async (sql, params = [], callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const pgSql = convertQuery(sql);
      const result = await pool.query(pgSql, params);
      if (callback) callback(null, result.rows[0]);
    } catch (err) {
      if (callback) callback(err);
    }
  },
  all: async (sql, params = [], callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const pgSql = convertQuery(sql);
      const result = await pool.query(pgSql, params);
      if (callback) callback(null, result.rows);
    } catch (err) {
      if (callback) callback(err);
    }
  }
};

async function initializeDb() {
  try {
    // Users table
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'USER'
    )`);

    // Properties table
    await pool.query(`CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      images TEXT,
      amenities TEXT,
      available_from DATE,
      available_to DATE
    )`);

    // Bookings table
    await pool.query(`CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      guest_name VARCHAR(255),
      guest_phone VARCHAR(255),
      property_id INTEGER,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      comment TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(property_id) REFERENCES properties(id)
    )`);

    // Seed default admin user
    const adminPhone = '+998 70 035 44 33';
    const adminPasswordPlain = 'nokia6120';
    
    db.get(`SELECT * FROM users WHERE role = 'ADMIN'`, [], (err, row) => {
      if (!err && !row) {
        bcrypt.hash(adminPasswordPlain, 10, (err, hash) => {
          if (!err) {
            db.run(`INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)`, 
              ['Главный Администратор', adminPhone, hash, 'ADMIN'], 
              (err) => {
                if (!err) console.log('Default admin user created.');
              });
          }
        });
      }
    });

    // Seed default property if missing
    db.get(`SELECT count(*) as count FROM properties`, [], (err, row) => {
      // In PG, count comes back as string, so we parseInt
      const count = parseInt(row.count, 10);
      if (!err && count === 0) {
        const mediaDir = path.resolve(__dirname, '..', 'photos and videos');
        let mediaFiles = [];
        if (fs.existsSync(mediaDir)) {
          mediaFiles = fs.readdirSync(mediaDir).filter(f => f.match(/\.(jpg|jpeg|png|webp|gif|mp4|webm|ogg)$/i));
        }
        const mediaPaths = mediaFiles.map(f => '/media/' + f);
        const amenities = JSON.stringify(['Баня', 'Мангал', 'Wi-Fi', 'Парковка', 'Бассейн']);
        
        const currentYear = new Date().getFullYear();
        const defaultFrom = `${currentYear}-01-01`;
        const defaultTo = `${currentYear}-12-31`;

        db.run(`INSERT INTO properties (name, description, images, amenities, available_from, available_to) VALUES (?, ?, ?, ?, ?, ?)`,
          ['Наша Дача', 'Уютная дача на природе, идеально подходящая для семейного отдыха. Замечательное место вдали от городской суеты.', JSON.stringify(mediaPaths), amenities, defaultFrom, defaultTo],
          (err) => {
            if (!err) console.log('Default property created automatically with media files.');
            else console.error('Failed to create default property:', err);
          }
        );
      }
    });

  } catch (err) {
    console.error("Error initializing DB schema:", err);
  }
}

initializeDb();

module.exports = db;

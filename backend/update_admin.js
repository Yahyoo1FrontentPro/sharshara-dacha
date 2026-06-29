const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const adminPhone = '+998 70 035 44 33';
const adminPasswordPlain = 'nokia6120';

bcrypt.hash(adminPasswordPlain, 10, (err, hash) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  db.run(`UPDATE users SET phone = ?, password = ? WHERE role = 'ADMIN'`, [adminPhone, hash], function(err) {
    if (err) {
      console.error(err);
    } else {
      console.log(`Updated ${this.changes} admin user(s).`);
    }
    db.close();
  });
});

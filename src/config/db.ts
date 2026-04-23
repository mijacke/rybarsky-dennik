import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ticha_voda",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function ensureSchema(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      isAdmin TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS water_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(80) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      region VARCHAR(120) NOT NULL,
      city VARCHAR(120) NOT NULL,
      gps_lat DECIMAL(9,6) NULL,
      gps_lon DECIMAL(9,6) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS fishing_spots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      description TEXT NOT NULL,
      water_type_id INT NOT NULL,
      address_id INT NOT NULL,
      image_location VARCHAR(255) NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (water_type_id) REFERENCES water_types(id) ON DELETE RESTRICT,
      FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS catches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      spot_id INT NOT NULL,
      user_id INT NOT NULL,
      species VARCHAR(120) NOT NULL,
      weight_kg DECIMAL(6,2) NOT NULL,
      length_cm DECIMAL(6,1) NOT NULL,
      rating TINYINT NOT NULL,
      comment TEXT NULL,
      photo_path VARCHAR(255) NULL,
      caught_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (spot_id) REFERENCES fishing_spots(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INT NOT NULL,
      spot_id INT NOT NULL,
      PRIMARY KEY (user_id, spot_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (spot_id) REFERENCES fishing_spots(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

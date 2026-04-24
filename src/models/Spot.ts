import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface SpotData {
  id?: number;
  name: string;
  description: string;
  water_type_id: number;
  address_id: number;
  image_location: string | null;
  user_id: number;
  created_at?: Date;
}
interface SpotRow extends RowDataPacket, SpotData {}

export interface SpotDetail extends SpotRow {
  water_type_name: string;
  region: string;
  city: string;
  gps_lat: number | null;
  gps_lon: number | null;
  author_name: string;
  catches_count: number;
  avg_rating: number | null;
}

export class Spot {
  id?: number;
  name: string;
  description: string;
  water_type_id: number;
  address_id: number;
  image_location: string | null;
  user_id: number;
  created_at?: Date;

  constructor(data: Partial<SpotData>) {
    this.id = data.id;
    this.name = data.name || "";
    this.description = data.description || "";
    this.water_type_id = data.water_type_id ?? 0;
    this.address_id = data.address_id ?? 0;
    this.image_location = data.image_location ?? null;
    this.user_id = data.user_id ?? 0;
    this.created_at = data.created_at;
  }

  merge(data: Partial<SpotData>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    if (data.water_type_id !== undefined) this.water_type_id = data.water_type_id;
    if (data.address_id !== undefined) this.address_id = data.address_id;
    if (data.image_location !== undefined) this.image_location = data.image_location;
  }

  static async findById(id: number): Promise<Spot | null> {
    const [rows] = await db.query<SpotRow[]>("SELECT * FROM fishing_spots WHERE id = ?", [id]);
    return rows.length ? new Spot(rows[0]) : null;
  }

  static async findAllWithJoin(filters?: {
    water_type_id?: number;
    region?: string;
  }): Promise<SpotDetail[]> {
    const where: string[] = [];
    const params: any[] = [];

    if (filters?.water_type_id) {
      where.push("s.water_type_id = ?");
      params.push(filters.water_type_id);
    }
    if (filters?.region) {
      where.push("a.region LIKE ?");
      params.push(`%${filters.region}%`);
    }

    const sql = `
      SELECT s.*, wt.name AS water_type_name,
             a.region, a.city, a.gps_lat, a.gps_lon,
             u.name AS author_name,
             (SELECT COUNT(*) FROM catches c WHERE c.spot_id = s.id) AS catches_count,
             (SELECT AVG(c.rating) FROM catches c WHERE c.spot_id = s.id) AS avg_rating
      FROM fishing_spots s
      INNER JOIN water_types wt ON s.water_type_id = wt.id
      INNER JOIN addresses a ON s.address_id = a.id
      INNER JOIN users u ON s.user_id = u.id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY s.created_at DESC
    `;
    const [rows] = await db.query<SpotDetail[]>(sql, params);
    return rows;
  }

  static async findDetailById(id: number): Promise<SpotDetail | null> {
    const [rows] = await db.query<SpotDetail[]>(
      `SELECT s.*, wt.name AS water_type_name,
              a.region, a.city, a.gps_lat, a.gps_lon,
              u.name AS author_name,
              (SELECT COUNT(*) FROM catches c WHERE c.spot_id = s.id) AS catches_count,
              (SELECT AVG(c.rating) FROM catches c WHERE c.spot_id = s.id) AS avg_rating
       FROM fishing_spots s
       INNER JOIN water_types wt ON s.water_type_id = wt.id
       INNER JOIN addresses a ON s.address_id = a.id
       INNER JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findByUserId(userId: number): Promise<SpotDetail[]> {
    const [rows] = await db.query<SpotDetail[]>(
      `SELECT s.*, wt.name AS water_type_name,
              a.region, a.city, a.gps_lat, a.gps_lon,
              u.name AS author_name,
              (SELECT COUNT(*) FROM catches c WHERE c.spot_id = s.id) AS catches_count,
              (SELECT AVG(c.rating) FROM catches c WHERE c.spot_id = s.id) AS avg_rating
       FROM fishing_spots s
       INNER JOIN water_types wt ON s.water_type_id = wt.id
       INNER JOIN addresses a ON s.address_id = a.id
       INNER JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [userId],
    );
    return rows;
  }

  static async findFavoritesByUser(userId: number): Promise<SpotDetail[]> {
    const [rows] = await db.query<SpotDetail[]>(
      `SELECT s.*, wt.name AS water_type_name,
              a.region, a.city, a.gps_lat, a.gps_lon,
              u.name AS author_name,
              (SELECT COUNT(*) FROM catches c WHERE c.spot_id = s.id) AS catches_count,
              (SELECT AVG(c.rating) FROM catches c WHERE c.spot_id = s.id) AS avg_rating
       FROM favorites f
       INNER JOIN fishing_spots s ON f.spot_id = s.id
       INNER JOIN water_types wt ON s.water_type_id = wt.id
       INNER JOIN addresses a ON s.address_id = a.id
       INNER JOIN users u ON s.user_id = u.id
       WHERE f.user_id = ?
       ORDER BY s.name`,
      [userId],
    );
    return rows;
  }

  static async featured(limit = 4): Promise<SpotDetail[]> {
    const [rows] = await db.query<SpotDetail[]>(
      `SELECT s.*, wt.name AS water_type_name,
              a.region, a.city, a.gps_lat, a.gps_lon,
              u.name AS author_name,
              (SELECT COUNT(*) FROM catches c WHERE c.spot_id = s.id) AS catches_count,
              (SELECT AVG(c.rating) FROM catches c WHERE c.spot_id = s.id) AS avg_rating
       FROM fishing_spots s
       INNER JOIN water_types wt ON s.water_type_id = wt.id
       INNER JOIN addresses a ON s.address_id = a.id
       INNER JOIN users u ON s.user_id = u.id
       ORDER BY catches_count DESC, s.created_at DESC
       LIMIT ?`,
      [limit],
    );
    return rows;
  }

  async save(): Promise<void> {
    if (this.id) {
      await db.query(
        "UPDATE fishing_spots SET name=?, description=?, water_type_id=?, address_id=?, image_location=? WHERE id=?",
        [this.name, this.description, this.water_type_id, this.address_id, this.image_location, this.id],
      );
    } else {
      const [r] = await db.query<ResultSetHeader>(
        "INSERT INTO fishing_spots (name, description, water_type_id, address_id, image_location, user_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          this.name,
          this.description,
          this.water_type_id,
          this.address_id,
          this.image_location,
          this.user_id,
        ],
      );
      this.id = r.insertId;
    }
  }

  static async delete(id: number): Promise<void> {
    await db.query("DELETE FROM fishing_spots WHERE id = ?", [id]);
  }

  static async toggleFavorite(userId: number, spotId: number): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT 1 FROM favorites WHERE user_id = ? AND spot_id = ?",
      [userId, spotId],
    );
    if (rows.length) {
      await db.query("DELETE FROM favorites WHERE user_id = ? AND spot_id = ?", [userId, spotId]);
      return false;
    }
    await db.query("INSERT INTO favorites (user_id, spot_id) VALUES (?, ?)", [userId, spotId]);
    return true;
  }

  static async isFavorite(userId: number, spotId: number): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT 1 FROM favorites WHERE user_id = ? AND spot_id = ?",
      [userId, spotId],
    );
    return rows.length > 0;
  }
}

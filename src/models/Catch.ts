import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface CatchData {
  id?: number;
  spot_id: number;
  user_id: number;
  species: string;
  weight_kg: number;
  length_cm: number;
  rating: number;
  comment: string | null;
  photo_path: string | null;
  caught_at?: Date;
}
interface CatchRow extends RowDataPacket, CatchData {}

export interface CatchWithAuthor extends CatchRow {
  author_name: string;
}

export class Catch {
  id?: number;
  spot_id: number;
  user_id: number;
  species: string;
  weight_kg: number;
  length_cm: number;
  rating: number;
  comment: string | null;
  photo_path: string | null;
  caught_at?: Date;

  constructor(data: Partial<CatchData>) {
    this.id = data.id;
    this.spot_id = data.spot_id ?? 0;
    this.user_id = data.user_id ?? 0;
    this.species = data.species || "";
    this.weight_kg = Number(data.weight_kg) || 0;
    this.length_cm = Number(data.length_cm) || 0;
    this.rating = data.rating ?? 0;
    this.comment = data.comment ?? null;
    this.photo_path = data.photo_path ?? null;
    this.caught_at = data.caught_at;
  }

  static async findById(id: number): Promise<Catch | null> {
    const [rows] = await db.query<CatchRow[]>("SELECT * FROM catches WHERE id = ?", [id]);
    return rows.length ? new Catch(rows[0]) : null;
  }

  static async findBySpot(spotId: number): Promise<CatchWithAuthor[]> {
    const [rows] = await db.query<CatchWithAuthor[]>(
      `SELECT c.*, u.name AS author_name
       FROM catches c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.spot_id = ?
       ORDER BY c.caught_at DESC`,
      [spotId],
    );
    return rows;
  }

  static async findTopBySpot(spotId: number, limit = 5): Promise<CatchWithAuthor[]> {
    const [rows] = await db.query<CatchWithAuthor[]>(
      `SELECT c.*, u.name AS author_name
       FROM catches c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.spot_id = ?
       ORDER BY c.weight_kg DESC
       LIMIT ?`,
      [spotId, limit],
    );
    return rows;
  }

  static async findRecent(limit = 6): Promise<(CatchWithAuthor & { spot_name: string })[]> {
    const [rows] = await db.query<(CatchWithAuthor & { spot_name: string } & RowDataPacket)[]>(
      `SELECT c.*, u.name AS author_name, s.name AS spot_name
       FROM catches c
       INNER JOIN users u ON c.user_id = u.id
       INNER JOIN fishing_spots s ON c.spot_id = s.id
       ORDER BY c.caught_at DESC
       LIMIT ?`,
      [limit],
    );
    return rows;
  }

  static async findByUser(userId: number): Promise<(CatchWithAuthor & { spot_name: string })[]> {
    const [rows] = await db.query<(CatchWithAuthor & { spot_name: string } & RowDataPacket)[]>(
      `SELECT c.*, u.name AS author_name, s.name AS spot_name
       FROM catches c
       INNER JOIN users u ON c.user_id = u.id
       INNER JOIN fishing_spots s ON c.spot_id = s.id
       WHERE c.user_id = ?
       ORDER BY c.caught_at DESC`,
      [userId],
    );
    return rows;
  }

  async save(): Promise<void> {
    if (this.id) {
      await db.query(
        "UPDATE catches SET species=?, weight_kg=?, length_cm=?, rating=?, comment=?, photo_path=? WHERE id=?",
        [
          this.species,
          this.weight_kg,
          this.length_cm,
          this.rating,
          this.comment,
          this.photo_path,
          this.id,
        ],
      );
    } else {
      const [r] = await db.query<ResultSetHeader>(
        "INSERT INTO catches (spot_id, user_id, species, weight_kg, length_cm, rating, comment, photo_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          this.spot_id,
          this.user_id,
          this.species,
          this.weight_kg,
          this.length_cm,
          this.rating,
          this.comment,
          this.photo_path,
        ],
      );
      this.id = r.insertId;
    }
  }

  static async delete(id: number): Promise<void> {
    await db.query("DELETE FROM catches WHERE id = ?", [id]);
  }
}

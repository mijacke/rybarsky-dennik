import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface UserData {
  id?: number;
  name: string;
  email: string;
  password: string;
  isAdmin: number;
  created_at?: Date;
}
interface UserRow extends RowDataPacket, UserData {}

export class User {
  id?: number;
  name: string;
  email: string;
  password: string;
  isAdmin: number;
  created_at?: Date;

  constructor(data: Partial<UserData>) {
    this.id = data.id;
    this.name = data.name || "";
    this.email = data.email || "";
    this.password = data.password || "";
    this.isAdmin = data.isAdmin ?? 0;
    this.created_at = data.created_at;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await db.query<UserRow[]>("SELECT * FROM users WHERE id = ?", [id]);
    return rows.length ? new User(rows[0]) : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await db.query<UserRow[]>("SELECT * FROM users WHERE email = ?", [email]);
    return rows.length ? new User(rows[0]) : null;
  }

  static async findAll(): Promise<User[]> {
    const [rows] = await db.query<UserRow[]>("SELECT * FROM users ORDER BY created_at DESC");
    return rows.map((r) => new User(r));
  }

  async save(): Promise<void> {
    if (this.id) {
      await db.query(
        "UPDATE users SET name=?, email=?, password=?, isAdmin=? WHERE id=?",
        [this.name, this.email, this.password, this.isAdmin, this.id],
      );
    } else {
      const [r] = await db.query<ResultSetHeader>(
        "INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
        [this.name, this.email, this.password, this.isAdmin],
      );
      this.id = r.insertId;
    }
  }

  static async delete(id: number): Promise<void> {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
  }
}

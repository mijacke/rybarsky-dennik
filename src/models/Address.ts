import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface AddressData {
  id?: number;
  region: string;
  city: string;
  gps_lat: number | null;
  gps_lon: number | null;
}
interface AddressRow extends RowDataPacket, AddressData {}

export class Address {
  id?: number;
  region: string;
  city: string;
  gps_lat: number | null;
  gps_lon: number | null;

  constructor(data: Partial<AddressData>) {
    this.id = data.id;
    this.region = data.region || "";
    this.city = data.city || "";
    this.gps_lat = data.gps_lat ?? null;
    this.gps_lon = data.gps_lon ?? null;
  }

  static async findById(id: number): Promise<Address | null> {
    const [rows] = await db.query<AddressRow[]>("SELECT * FROM addresses WHERE id = ?", [id]);
    return rows.length ? new Address(rows[0]) : null;
  }

  merge(data: Partial<AddressData>): void {
    if (data.region !== undefined) this.region = data.region;
    if (data.city !== undefined) this.city = data.city;
    if (data.gps_lat !== undefined) this.gps_lat = data.gps_lat;
    if (data.gps_lon !== undefined) this.gps_lon = data.gps_lon;
  }

  async save(): Promise<void> {
    if (this.id) {
      await db.query(
        "UPDATE addresses SET region=?, city=?, gps_lat=?, gps_lon=? WHERE id=?",
        [this.region, this.city, this.gps_lat, this.gps_lon, this.id],
      );
    } else {
      const [r] = await db.query<ResultSetHeader>(
        "INSERT INTO addresses (region, city, gps_lat, gps_lon) VALUES (?, ?, ?, ?)",
        [this.region, this.city, this.gps_lat, this.gps_lon],
      );
      this.id = r.insertId;
    }
  }

  static async delete(id: number): Promise<void> {
    await db.query("DELETE FROM addresses WHERE id = ?", [id]);
  }
}

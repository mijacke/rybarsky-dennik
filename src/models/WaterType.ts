import { db } from "../config/db";
import { RowDataPacket } from "mysql2";

interface WaterTypeRow extends RowDataPacket {
  id: number;
  name: string;
}

export class WaterType {
  id: number;
  name: string;

  constructor(data: WaterTypeRow) {
    this.id = data.id;
    this.name = data.name;
  }

  static async findAll(): Promise<WaterType[]> {
    const [rows] = await db.query<WaterTypeRow[]>("SELECT * FROM water_types ORDER BY name");
    return rows.map((r) => new WaterType(r));
  }
}

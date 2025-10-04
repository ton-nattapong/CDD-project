import express, { Request, Response } from "express";
import pool from "../models/db";
import bcrypt from "bcryptjs";

const router = express.Router();

/**
 * GET /api/customers?role=customer
 * - ดึงผู้ใช้ทั้งหมด โดยกรอง role ได้ผ่าน query (default = 'customer')
 */
router.get("/", async (req, res) => {
  try {
    const role = (req.query.role as string) || "customer";
    const withCount = String(req.query.withPolicyCount || "") === "1";

    const sql = withCount
      ? `
        SELECT
          u.id, u.full_name AS name, u.citizen_id, u.email, u.phone_number, u.address,
          u.role, u.created_at,
          COALESCE(p.cnt, 0) AS policy_count
        FROM users u
        LEFT JOIN (
          SELECT citizen_id, COUNT(*)::int AS cnt
          FROM insurance_policies
          GROUP BY citizen_id
        ) p ON p.citizen_id = u.citizen_id
        WHERE u.role = $1
        ORDER BY u.created_at DESC, u.id DESC
      `
      : `
        SELECT id, full_name AS name, citizen_id, email, phone_number, address, role, created_at
        FROM users
        WHERE role = $1
        ORDER BY created_at DESC, id DESC
      `;

    const result = await pool.query(sql, [role]);
    return res.json(result.rows);
  } catch (e) {
    console.error("GET /api/customers error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/customers/:id
 * - ดึงข้อมูลลูกค้ารายบุคคลตาม id + กรมธรรม์
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `
      SELECT 
        u.id, u.full_name AS name, u.citizen_id, u.email, u.phone_number, u.address, u.role, u.created_at,
        p.policy_number, p.insurance_company, p.insurance_type,
        p.coverage_start_date, p.coverage_end_date
      FROM users u
      LEFT JOIN insurance_policies p ON p.citizen_id = u.citizen_id
      WHERE u.id = $1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.json(rows[0]);
  } catch (err: any) {
    console.error("GET /api/customers/:id error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /api/customers/:id
 * - อัปเดตเบอร์โทร/ที่อยู่
 * - เปลี่ยนรหัสผ่าน (ต้องส่ง currentPassword + newPassword)
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phone_number, address, currentPassword, newPassword } = req.body;

    // อัปเดตข้อมูลติดต่อ
    if (phone_number || address) {
      await pool.query(
        `UPDATE users
         SET phone_number = COALESCE($1, phone_number),
             address = COALESCE($2, address)
         WHERE id = $3`,
        [phone_number, address, id]
      );
    }

    // อัปเดตรหัสผ่าน
    if (currentPassword && newPassword) {
      const { rows } = await pool.query(
        `SELECT password FROM users WHERE id = $1`,
        [id]
      );
      if (rows.length === 0) return res.status(404).json({ message: "User not found" });

      const match = await bcrypt.compare(currentPassword, rows[0].password);
      if (!match) return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });

      const hashed = await bcrypt.hash(newPassword, 10);
      await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, id]);
    }

    return res.json({ message: "อัปเดตข้อมูลเรียบร้อย" });
  } catch (err: any) {
    console.error("PATCH /api/customers/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

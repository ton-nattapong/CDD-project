// src/api/routes/customers.routes.ts
import express, { Request, Response } from "express";
import pool from "../models/db";

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
        SELECT id, full_name, citizen_id, email, phone_number, address, role, created_at
        FROM users
        WHERE role = $1
        ORDER BY created_at DESC, id DESC
      `;

    const result = await pool.query(sql, [role]);
    return res.json(result.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/customers/:id
 * - ดึงข้อมูลลูกค้ารายบุคคลตาม id
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT id, full_name AS name, citizen_id, email, phone_number, address, role, created_at
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/customers/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

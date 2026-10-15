// ─── Tizim modellarining TypeScript interfeyslari ─────────────────────────────

/**
 * To'yxona qo'shish yoki tahrirlash bo'yicha admin tasdiqlash so'rovi
 */
export interface ApprovalRequest {
  request_id: string;
  hall_id: string | null;
  owner_id: string;
  request_type: 'create' | 'update';
  status: 'pending' | 'approved' | 'rejected';
  data: any;
  admin_comment: string | null;
  approved_by: string | null;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Xavfsizlik va nazorat uchun tizim audit loglari
 */
export interface AuditLog {
  log_id: string;
  user_id: string;
  action: string;
  details: string | null;
  created_at: Date;
}

/**
 * Foydalanuvchilarga yuboriladigan bildirishnomalar
 */
export interface Notification {
  notification_id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

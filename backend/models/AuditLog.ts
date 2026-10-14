export interface AuditLog {
  log_id: string;
  user_id: string;
  action: string;
  details: string | null;
  created_at: Date;
}

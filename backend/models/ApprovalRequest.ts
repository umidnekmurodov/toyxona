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

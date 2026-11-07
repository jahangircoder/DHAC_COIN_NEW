export interface StudentRecord {
  id: string;
  studentId: string;
  officialId: string; // DHAC/ST/2026/[CLASS]/[AD.NO.]
  adNo: string;
  adFlag: 'VALID' | 'ORIGINAL_ASTERISK' | 'MISSING_AD';
  name: string;
  className: string;
  batchName?: string;
  mentorName: string;
  totalCoins: number;
  coinStatus: 'CONFIRMED' | 'MISSING_OR_ZERO' | 'ASSUMED_ZERO' | 'ZERO';
  mentorGroupRank: string;
  mentorRankNum: number;
  mentorGroupSize: number;
  classRank: string;
  classRankNum: number;
  classSize: number;
  campusRank: string;
  campusRankNum: number;
  campusTotalStudents: number;
  rankStatus: 'OFFICIAL' | 'PROVISIONAL';
  notes: string;
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Starter' | 'Zero';
  photoUrl?: string;
  linkedUid?: string;
  studentEmail?: string;
}

export interface MentorStats {
  mentorName: string;
  teacherId?: string;
  studentCount: number;
  totalCoins: number;
  averageCoins: number;
  activeStudents: number;
  zeroCoinStudents: number;
  topStudent: StudentRecord | null;
  rank: number;
}

export interface ClassStats {
  className: string;
  batchName: string;
  category: 'Degree' | 'Higher Secondary' | 'Secondary';
  studentCount: number;
  studentCoins: number;
  classAwardCoins: number;
  totalCoins: number;
  averageCoins: number;
  activeStudents: number;
  zeroCoinStudents: number;
  topStudent: StudentRecord | null;
  rank: number;
}

export interface UnionDefinition {
  id: string;
  unionName: string;
  classes: string[];
  category?: 'Degree' | 'Higher Secondary' | 'Secondary';
  isNoUnionBatch?: boolean; // e.g. S1 (13th Batch) with no union created yet
}

export interface UnionStats {
  id: string;
  unionName: string;
  classes: string[];
  category: 'Degree' | 'Higher Secondary' | 'Secondary';
  studentCount: number;
  studentCoins: number;
  classAwardCoins: number;
  totalCoins: number;
  averageCoins: number;
  activeStudents: number;
  zeroCoinStudents: number;
  topStudent: StudentRecord | null;
  rank: number;
}

export interface CoinTransaction {
  id: string;
  timestamp: string;
  targetType: 'STUDENT' | 'CLASS';
  studentDocId?: string;
  studentId?: string;
  studentName?: string;
  adNo?: string;
  className: string;
  category: string;
  activityName: string;
  coins: number;
  awardedBy: string;
  awardedByUid?: string;
  notes?: string;
}

export interface CoinClaim {
  id: string;
  submittedByUid?: string;
  studentDocId?: string;
  studentId: string;
  studentName: string;
  adNo: string;
  className: string;
  mentorName: string;
  category: string;
  activityName: string;
  coins: number;
  proofNotes?: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedByUid?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface TeacherRecord {
  id?: string; // Firestore doc ID e.g. STAFF-01
  serialNo: string;
  teacherId: string; // DHAC/STAFF/[SERIAL_NO.]
  name: string;
  username: string; // STAFF.[FIRST_NAME]
  assignedEmail?: string; // Pre-authorized Google email for instant faculty login
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorUid: string;
  actorName: string;
  targetPath: string;
  summary: string;
  createdAtLabel?: string;
}

export interface AuthUser {
  uid?: string;
  email?: string;
  username: string;
  role: 'SUPER_ADMIN' | 'TEACHER_ADMIN' | 'STUDENT' | 'VIEWER';
  displayName: string;
  studentId?: string;
  studentDocId?: string;
  teacherId?: string;
  mentorDocId?: string;
  mentorName?: string;
  className?: string;
  adNo?: string;
  photoUrl?: string;
}

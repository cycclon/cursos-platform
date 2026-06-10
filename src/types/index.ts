export type UserRole = 'visitor' | 'student' | 'teacher' | 'superuser';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isMainTeacher?: boolean;
}

export interface Teacher {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  credentials: string[];
  videoUrl?: string;
  showStudentCount?: boolean;
  totalStudents?: number;
}

export interface ModuleVideo {
  id: string;
  url: string;
  title: string;
  duration: number; // seconds
  order: number;
}

export interface Module {
  id: string;
  courseId: string;
  number: number;
  title: string;
  description: string;
  videoUrl?: string;
  videoDuration?: string;
  videos: ModuleVideo[];
  videoCount?: number;
  materials: Material[];
  isFree: boolean;
}

export interface Material {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  size: string;
  fileUrl?: string;
}

export interface Course {
  id: string;
  teacherId: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  description: string;
  imageUrl: string;
  price: number;
  discountPrice?: number;
  discountLabel?: string;
  duration: string;
  modules: Module[];
  prerequisites: string[];
  prerequisiteCourseIds: string[];
  tableOfContents: string[];
  availability: string;
  hasTest: boolean;
  testConfig?: TestConfig;
  hasCertificate: boolean;
  moneyBackGuarantee?: string;
  rating: number;
  reviewCount: number;
  studentCount: number;
  createdAt: string;
  featured: boolean;
}

export interface TestConfig {
  totalQuestions: number;
  timeLimit: number; // in minutes
  maxRetries: number;
  passingScore: number; // percentage
}

export interface TestQuestion {
  id: string;
  courseId: string;
  question: string;
  options: string[];
  correctIndex: number;
  order: number;
}

export interface Question {
  id: string;
  courseId: string;
  type: 'multiple-choice' | 'true-false';
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Review {
  id: string;
  courseId: string;
  studentId?: string;
  studentName: string;
  studentAvatar?: string;
  rating: number;
  categories: {
    contenido: number;
    claridad: number;
    material: number;
    valorPrecio: number;
  };
  comment: string;
  date: string;
  teacherReply?: string;
  teacherReplyDate?: string;
  courseTitle?: string;
}

export interface VideoProgress {
  watchedSeconds: number;
  maxReachedSeconds: number;
  duration: number;
  lastPosition: number;
  completed: boolean;
}

export interface ModuleProgressEntry {
  videos: Record<string, VideoProgress>;
  completed: boolean;
  lastVideoId?: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  progress: number; // percentage
  completedModules: string[];
  moduleProgress?: Record<string, ModuleProgressEntry | number>;
  lastWatchedModule?: string;
  enrolledAt: string;
  testPassed?: boolean;
  testScore?: number;
  testAttempts?: number;
  certificateId?: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  teacherName: string;
  issuedAt: string;
  score?: number;
}

export interface SalesData {
  month: string;
  revenue: number;
  sales: number;
  students: number;
}

export type ResourceStatType = 'course' | 'workshop' | 'bundle';

export interface CourseStat {
  /** Legacy id field — equals `id` */
  courseId: string;
  /** Legacy title field — equals `title` */
  courseTitle: string;
  id: string;
  type: ResourceStatType;
  title: string;
  views: number;
  enrollments: number;
  revenue: number;
  avgRating: number;
}

export interface SaleDetail {
  id: string;
  type: ResourceStatType;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  paidAt: string | null;
  createdAt: string | null;
  mercadoPagoId: string | null;
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  item: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  courseTitle: string;
}

export interface Bundle {
  id: string;
  title: string;
  slug: string;
  description: string;
  courseIds: string[];
  workshopIds: string[];
  price: number;
  originalPrice: number;
  discountLabel: string;
  imageUrl: string;
  featured: boolean;
}

export type WorkshopModality = 'online' | 'presencial';
export type AttendanceStatus = 'registered' | 'attended' | 'cancelled' | 'no_show';
export type RegistrationSource = 'standalone' | 'bundle';

export interface Workshop {
  id: string;
  teacherId: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  description: string;
  imageUrl: string;
  price: number;
  discountPrice?: number;
  discountLabel?: string;
  scheduledAt: string;
  durationMinutes: number;
  modality: WorkshopModality;
  meetingUrl?: string;
  location?: string;
  capacity?: number;
  registeredCount: number;
  prerequisiteCourseIds: string[];
  prerequisitesText: string[];
  availability: string;
  featured: boolean;
  createdAt: string;
}

export interface WorkshopRegistration {
  id: string;
  studentId: string;
  workshopId: string | Workshop;
  attendanceStatus: AttendanceStatus;
  source: RegistrationSource;
  bundleId?: string;
  paymentId?: string;
  registeredAt: string;
  attendanceMarkedAt?: string;
}

export interface WorkshopAccessResponse {
  eligible: boolean;
  missing: { id: string; title: string; slug: string }[];
  meetingUrl?: string;
  location?: string;
  scheduledAt: string;
  durationMinutes: number;
  modality: WorkshopModality;
}

export interface PrereqProgress {
  id: string;
  title: string;
  slug: string;
  progress: number;
  enrolled: boolean;
  completed: boolean;
  hasTest: boolean;
  testPassed: boolean | null;
}

export interface WorkshopRosterEntry extends WorkshopRegistration {
  student: { id: string; name: string; email: string } | null;
  eligible: boolean;
  missing: { id: string; title: string; slug: string }[];
  prereqProgress: PrereqProgress[];
}

// ── Student progress tracking (teacher / superuser analytics) ──────────────

export interface ProgressOverview {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  averageProgress: number;
  completedEnrollments: number;
  completionRate: number;
}

export interface CourseProgressRow {
  courseId: string;
  title: string;
  slug: string;
  imageUrl: string;
  moduleCount: number;
  enrolledCount: number;
  averageProgress: number;
  completedCount: number;
}

export interface ModuleProgressRow {
  moduleId: string;
  number: number;
  title: string;
  enrolledCount: number;
  averageProgress: number;
  completedCount: number;
}

export interface CourseModulesProgress {
  course: { courseId: string; title: string };
  enrolledCount: number;
  modules: ModuleProgressRow[];
}

export interface CourseStudentProgressRow {
  studentId: string;
  name: string;
  email: string;
  avatar: string | null;
  progress: number;
  completedModules: number;
  totalModules: number;
  lastWatchedModule: string | null;
  enrolledAt: string;
  testPassed: boolean | null;
  testScore: number | null;
  certificateId: string | null;
}

export interface CourseStudentsProgress {
  course: { courseId: string; title: string };
  students: CourseStudentProgressRow[];
}

export interface StudentModuleProgress {
  moduleId: string;
  number: number;
  title: string;
  progress: number;
  completed: boolean;
}

export interface StudentEnrollmentProgress {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseImageUrl: string;
  progress: number;
  completedModulesCount: number;
  totalModules: number;
  enrolledAt: string;
  testPassed: boolean | null;
  testScore: number | null;
  certificateId: string | null;
  modules: StudentModuleProgress[];
}

export interface StudentProgressDetail {
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: UserRole;
    createdAt: string;
  };
  enrollments: StudentEnrollmentProgress[];
  summary: {
    courseCount: number;
    averageProgress: number;
    completedCourses: number;
  };
}

// ── Reminders (teacher → student outreach) ─────────────────────────────────

export type ReminderStatus = 'sent' | 'logged' | 'failed';
export type ReminderSource = 'single' | 'mass';

export interface ReminderCourseSnapshot {
  courseId: string;
  title: string;
  progress: number;
  remainingModules: number;
}

export interface Reminder {
  id: string;
  subject: string;
  body: string;
  signature: string;
  courses: ReminderCourseSnapshot[];
  status: ReminderStatus;
  source: ReminderSource;
  teacherName: string;
  sentAt: string;
}

export interface ReminderDraftCourse {
  courseId: string;
  title: string;
  progress: number;
  remainingModules: number;
  remainingTitles: string[];
}

export interface ReminderDraft {
  student: { id: string; name: string; email: string };
  canSend: boolean;
  courses: ReminderDraftCourse[];
  draft: { subject: string; body: string; signature: string };
  lastReminderAt: string | null;
  recentlyReminded: boolean;
  cooldownDays: number;
}

export interface MassReminderParams {
  staleDays: number;
  courseIds?: string[];
  cooldownDays: number;
}

export interface MassReminderStudent {
  studentId: string;
  name: string;
  email: string;
  staleDays: number;
  lastReminderAt: string | null;
  willSkip: boolean;
  courses: { courseId: string; title: string; progress: number }[];
}

export interface MassReminderPreview {
  params: { staleDays: number; courseIds: string[]; cooldownDays: number };
  total: number;
  willSend: number;
  willSkip: number;
  truncated: boolean;
  students: MassReminderStudent[];
}

export interface MassReminderResult {
  matched: number;
  attempted: number;
  skipped: number;
  sent: number;
  logged: number;
  failed: number;
  truncated: boolean;
  failures: { studentId: string; email: string; error: string }[];
}

// ── Bug reports / feedback ─────────────────────────────────────────────────

export type BugReportType = 'bug' | 'suggestion' | 'question';
export type BugReportStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
export type BugReportEmailKind = 'ack' | 'status_change' | 'custom';
export type BugReportEmailStatus = 'sent' | 'logged' | 'failed';

export interface BugReportContextInput {
  url: string;
  path: string;
  pageLabel?: string;
  pageHeading?: string;
  userAgent?: string;
  viewport?: string;
  screen?: string;
  language?: string;
  referrer?: string;
  consoleLogs?: string;
}

export interface BugReportCreateInput {
  type: BugReportType;
  message: string;
  attachmentUrl?: string;
  context: BugReportContextInput;
  website?: string; // honeypot
}

export interface BugReportCreated {
  id: string | null;
  ticketId: string;
  status: BugReportStatus;
}

export interface BugReportListItem {
  id: string;
  ticketId: string;
  type: BugReportType;
  status: BugReportStatus;
  message: string;
  reporter: { name: string; email: string };
  pageLabel: string;
  hasAttachment: boolean;
  notifyOnStatusChange: boolean;
  emailCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BugReportStatusEvent {
  status: BugReportStatus;
  note: string | null;
  changedByName: string | null;
  at: string;
}

export interface BugReportEmail {
  kind: BugReportEmailKind;
  subject: string;
  body: string;
  to: string;
  status: BugReportEmailStatus;
  error: string | null;
  at: string;
}

export interface BugReportDetail {
  id: string;
  ticketId: string;
  type: BugReportType;
  status: BugReportStatus;
  message: string;
  reporter: { userId: string | null; name: string; email: string; role: string };
  pageLabel: string;
  hasAttachment: boolean;
  notifyOnStatusChange: boolean;
  emailCount: number;
  attachmentUrl: string | null;
  internalNotes: string;
  context: {
    url: string;
    path: string;
    pageLabel: string | null;
    pageHeading: string | null;
    userAgent: string | null;
    viewport: string | null;
    screen: string | null;
    language: string | null;
    referrer: string | null;
    consoleLogs: string | null;
  };
  statusHistory: BugReportStatusEvent[];
  emails: BugReportEmail[];
  createdAt: string;
  updatedAt: string;
  emailResult?: 'sent' | 'logged' | 'failed' | 'skipped';
}

export interface BugReportListResponse {
  items: BugReportListItem[];
  total: number;
  page: number;
  limit: number;
  counts: Record<string, number>;
}

export interface BugReportStats {
  new: number;
  in_progress: number;
  resolved: number;
  closed: number;
  wont_fix: number;
  total: number;
}

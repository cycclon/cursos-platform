export type UserRole = 'visitor' | 'student' | 'teacher' | 'superuser';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Teacher {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  credentials: string[];
  videoUrl?: string;
}

export interface Module {
  id: string;
  courseId: string;
  number: number;
  title: string;
  description: string;
  videoUrl?: string;
  videoDuration?: string;
  materials: Material[];
  isFree: boolean;
}

export interface Material {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  size: string;
}

export interface Course {
  id: string;
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
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  progress: number; // percentage
  completedModules: string[];
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

export interface CourseStat {
  courseId: string;
  courseTitle: string;
  views: number;
  enrollments: number;
  revenue: number;
  avgRating: number;
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

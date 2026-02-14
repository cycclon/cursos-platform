import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Layouts
import PublicLayout from './components/layout/PublicLayout'
import DashboardLayout from './components/layout/DashboardLayout'

// Public pages
import Landing from './pages/public/Landing'
import Catalog from './pages/public/Catalog'
import CourseDetail from './pages/public/CourseDetail'
import About from './pages/public/About'
import Faq from './pages/public/Faq'
import Bundles from './pages/public/Bundles'
import BundleDetail from './pages/public/BundleDetail'
import Login from './pages/public/Login'
import Register from './pages/public/Register'

// Student pages
import StudentDashboard from './pages/student/Dashboard'
import CoursePlayer from './pages/student/CoursePlayer'
import Test from './pages/student/Test'
import Certificate from './pages/student/Certificate'

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import CourseManager from './pages/teacher/CourseManager'
import BundleManager from './pages/teacher/BundleManager'
import Statistics from './pages/teacher/Statistics'

// Admin pages
import SuperuserPanel from './pages/admin/SuperuserPanel'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/cursos" element={<Catalog />} />
          <Route path="/cursos/:slug" element={<CourseDetail />} />
          <Route path="/combos" element={<Bundles />} />
          <Route path="/combos/:slug" element={<BundleDetail />} />
          <Route path="/sobre-mi" element={<About />} />
          <Route path="/preguntas-frecuentes" element={<Faq />} />
          <Route path="/ingresar" element={<Login />} />
          <Route path="/registrarse" element={<Register />} />
        </Route>

        {/* Student routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/mi-panel" element={<StudentDashboard />} />
        </Route>

        {/* Student full-screen routes (no dashboard sidebar) */}
        <Route path="/aprender/:id" element={<CoursePlayer />} />
        <Route path="/examen/:courseId" element={<Test />} />

        {/* Certificate (public layout) */}
        <Route element={<PublicLayout />}>
          <Route path="/certificado/:id" element={<Certificate />} />
        </Route>

        {/* Teacher routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/admin/panel" element={<TeacherDashboard />} />
          <Route path="/admin/cursos" element={<CourseManager />} />
          <Route path="/admin/combos" element={<BundleManager />} />
          <Route path="/admin/estadisticas" element={<Statistics />} />
        </Route>

        {/* Superuser routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/superusuario" element={<SuperuserPanel />} />
        </Route>
      </Routes>
    </>
  )
}

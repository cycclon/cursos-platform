import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import RoleSwitcher from './RoleSwitcher';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <RoleSwitcher />
    </div>
  );
}

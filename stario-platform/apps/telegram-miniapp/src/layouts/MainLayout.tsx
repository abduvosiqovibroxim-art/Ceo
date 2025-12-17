import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

export default function MainLayout() {
  useEffect(() => {
    // Set header color
    WebApp.setHeaderColor('#8B5CF6');
    WebApp.setBackgroundColor('#ffffff');
  }, []);

  return (
    <div className="min-h-screen bg-tg-bg">
      <main className="pb-safe">
        <Outlet />
      </main>
    </div>
  );
}

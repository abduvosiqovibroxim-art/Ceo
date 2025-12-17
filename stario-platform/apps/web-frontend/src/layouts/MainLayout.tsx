import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  SparklesIcon,
  ShoppingBagIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  SparklesIcon as SparklesIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';
import LanguageSwitcher from '../components/LanguageSwitcher';

const navItems = [
  { path: '/', labelKey: 'common.home', icon: HomeIcon, iconActive: HomeIconSolid },
  { path: '/artists', labelKey: 'common.artists', icon: SparklesIcon, iconActive: SparklesIconSolid },
  { path: '/merch', labelKey: 'common.shop', icon: ShoppingBagIcon, iconActive: ShoppingBagIconSolid },
  { path: '/profile', labelKey: 'common.profile', icon: UserCircleIcon, iconActive: UserCircleIconSolid },
];

export default function MainLayout() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            Stario
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/cart" className="relative">
              <ShoppingBagIcon className="h-6 w-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-indigo-600 rounded-full text-white text-xs flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.iconActive : item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-1 px-3 ${
                  isActive ? 'text-indigo-600' : 'text-gray-500'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

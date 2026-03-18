import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TreesIcon,
  UserIcon,
  UsersIcon,
  LogOutIcon,
  MenuIcon,
  HomeIcon,
  SettingsIcon,
  ChevronRightIcon } from
'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Trang chủ',
      icon: HomeIcon,
      href: '/dashboard'
    },
    {
      id: 'trees',
      label: 'Cây gia phả',
      icon: TreesIcon,
      href: '/dashboard'
    },
    {
      id: 'persons',
      label: 'Danh bạ person',
      icon: UsersIcon,
      href: '/persons'
    },
    {
      id: 'profile',
      label: 'Hồ sơ cá nhân',
      icon: UserIcon,
      href: '/profile'
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: SettingsIcon,
      href: '/profile'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-cream flex">
      {/* Mobile overlay */}
      {sidebarOpen &&
      <div
        className="fixed inset-0 bg-warm-900/40 z-40 lg:hidden animate-fade-in"
        onClick={() => setSidebarOpen(false)} />

      }

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-72
          bg-warm-800 text-warm-100 flex flex-col
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
        
        {/* Logo */}
        <div className="p-6 border-b border-warm-700/50">
          <button
            onClick={() => {
              navigate('/dashboard');
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3">
            
            <div className="w-10 h-10 rounded-lg bg-heritage-gold/20 flex items-center justify-center">
              <TreesIcon className="w-5 h-5 text-heritage-gold" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-cream tracking-wide">
                Gia Phả
              </h1>
              <p className="text-xs text-warm-300 -mt-0.5">
                Hệ thống quản lý gia phả
              </p>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive ? 'bg-heritage-gold/15 text-heritage-gold-light' : 'text-warm-300 hover:bg-warm-700/50 hover:text-warm-100'}
                `}>
                
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive &&
                <ChevronRightIcon className="w-4 h-4 ml-auto opacity-60" />
                }
              </button>);

          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-warm-700/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-heritage-gold/20 flex items-center justify-center flex-shrink-0">
              {user?.avatarUrl ?
              <img
                src={user.avatarUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover" /> :


              <UserIcon className="w-4 h-4 text-heritage-gold" />
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-cream truncate">
                {user?.fullName || user?.userName || 'Người dùng'}
              </p>
              <p className="text-xs text-warm-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-warm-400 hover:bg-red-900/20 hover:text-red-300 transition-colors">
            
            <LogOutIcon className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-cream/80 backdrop-blur-md border-b border-warm-200/60">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-warm-600 hover:bg-warm-100 transition-colors"
              aria-label="Mở menu">
              
              <MenuIcon className="w-5 h-5" />
            </button>

            <div className="hidden lg:block" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-warm-700">
                  {user?.fullName || 'Xin chào'}
                </p>
                <p className="text-xs text-warm-400">
                  {new Date().toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-warm-200 flex items-center justify-center">
                {user?.avatarUrl ?
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover" /> :


                <UserIcon className="w-4 h-4 text-warm-500" />
                }
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>);

}
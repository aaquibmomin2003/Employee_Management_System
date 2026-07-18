'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
  departmentBreakdown: { department: string; count: number }[];
}

function DashboardContent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isDark = useThemeStore((state) => state.isDark);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/employees" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Employees
          </Link>
          <Link href="/organization" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Org Chart
          </Link>
          <button
            onClick={toggleTheme}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading stats...</p>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Employees" value={stats.totalEmployees} color="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" />
            <StatCard label="Active" value={stats.activeEmployees} color="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" />
            <StatCard label="Inactive" value={stats.inactiveEmployees} color="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" />
            <StatCard label="Departments" value={stats.departmentCount} color="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Department Breakdown</h2>
            <div className="space-y-2">
              {stats.departmentBreakdown.map((d) => (
                <div key={d.department} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-300">{d.department}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-red-500">Failed to load dashboard stats.</p>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-6 rounded-lg ${color}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
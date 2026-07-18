'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/employees" className="text-gray-600 hover:text-gray-900">
            Employees
          </Link>
          <Link href="/organization" className="text-gray-600 hover:text-gray-900">
            Org Chart
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading stats...</p>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Employees" value={stats.totalEmployees} color="bg-blue-100 text-blue-700" />
            <StatCard label="Active" value={stats.activeEmployees} color="bg-green-100 text-green-700" />
            <StatCard label="Inactive" value={stats.inactiveEmployees} color="bg-red-100 text-red-700" />
            <StatCard label="Departments" value={stats.departmentCount} color="bg-purple-100 text-purple-700" />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Department Breakdown</h2>
            <div className="space-y-2">
              {stats.departmentBreakdown.map((d) => (
                <div key={d.department} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{d.department}</span>
                  <span className="font-medium text-gray-800">{d.count}</span>
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
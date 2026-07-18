'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: 'ACTIVE' | 'INACTIVE';
  role: string;
  joiningDate: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function EmployeeListContent() {
  const user = useAuthStore((state) => state.user);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter/search/sort/pagination controls
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '10',
        sortBy,
        order,
      };
      if (search) params.search = search;
      if (department) params.department = department;
      if (status) params.status = status;

      const response = await api.get('/employees', { params });
      setEmployees(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, department, status, sortBy, order]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
        <div className="flex gap-3">
          <Link href="/dashboard" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition">
            Dashboard
          </Link>
          {canCreate && (
            <Link href="/employees/new" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              + Add Employee
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md flex-1 min-w-[200px]"
        />
        <select
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Administration">Administration</option>
          <option value="HR">HR</option>
          <option value="Sales">Sales</option>
          <option value="Marketing">Marketing</option>
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select
          value={`${sortBy}:${order}`}
          onChange={(e) => {
            const [sb, ord] = e.target.value.split(':');
            setSortBy(sb);
            setOrder(ord);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="createdAt:desc">Newest First</option>
          <option value="joiningDate:desc">Joining Date (Newest)</option>
          <option value="joiningDate:asc">Joining Date (Oldest)</option>
          <option value="name:asc">Name (A-Z)</option>
          <option value="name:desc">Name (Z-A)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Loading employees...</p>
        ) : employees.length === 0 ? (
          <p className="p-6 text-gray-500">No employees found.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Code</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Department</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Designation</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{emp.employeeCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{emp.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{emp.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{emp.department}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{emp.designation}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/employees/${emp.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeeListPage() {
  return (
    <ProtectedRoute>
      <EmployeeListContent />
    </ProtectedRoute>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  role: string;
  managerId: string | null;
  profileImageUrl: string | null;
}

function EmployeeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const currentUser = useAuthStore((state) => state.user);
  const isElevated = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HR_MANAGER';
  const isSelf = currentUser?.id === employeeId;
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editable fields
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Guard: an Employee-role user trying to view someone else's profile
    // shouldn't even fire the request — matches backend's 403 rule.
    if (currentUser?.role === 'EMPLOYEE' && currentUser.id !== employeeId) {
      setError("You can only view your own profile.");
      setLoading(false);
      return;
    }

    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/employees/${employeeId}`);
        const emp: Employee = response.data;
        setEmployee(emp);
        setPhone(emp.phone);
        setDepartment(emp.department);
        setDesignation(emp.designation);
        setSalary(String(emp.salary));
        setStatus(emp.status);
        setRole(emp.role);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load employee');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId, currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');

    try {
      // Employees can only update phone (matches backend's employeeSelfUpdateSchema)
      const payload = isElevated
        ? { phone, department, designation, salary: Number(salary), status, role }
        : { phone };

      const response = await api.put(`/employees/${employeeId}`, payload);
      setEmployee(response.data);
      setSaveMessage('Saved successfully.');
    } catch (err: any) {
      setSaveMessage(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${employee?.name}? This can be undone by an admin (soft delete).`)) return;

    try {
      await api.delete(`/employees/${employeeId}`);
      router.push('/employees');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-red-500">{error || 'Employee not found'}</p>
        <Link href="/employees" className="text-blue-600 hover:underline">← Back to list</Link>
      </div>
    );
  }

  const canEditFull = isElevated;
  const canEditSelf = isSelf && !isElevated;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
          <Link href="/employees" className="text-gray-500 hover:underline">← Back to list</Link>
        </div>

        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          {/* Read-only fields, always shown */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Employee Code:</span> <span className="font-medium">{employee.employeeCode}</span></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{employee.email}</span></div>
            <div><span className="text-gray-500">Joining Date:</span> <span className="font-medium">{new Date(employee.joiningDate).toLocaleDateString()}</span></div>
            <div><span className="text-gray-500">Role:</span> <span className="font-medium">{employee.role}</span></div>
          </div>

          <hr />

          {/* Phone — editable by self or elevated roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!canEditFull && !canEditSelf}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            />
          </div>

          {/* Elevated-only fields */}
          {canEditFull && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input value={designation} onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                  <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                </select>
              </div>
            </>
          )}

          {saveMessage && (
            <p className={`text-sm px-3 py-2 rounded-md ${
              saveMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {saveMessage}
            </p>
          )}

          <div className="flex gap-3">
            {(canEditFull || canEditSelf) && (
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}

            {isSuperAdmin && !isSelf && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  return (
    <ProtectedRoute>
      <EmployeeDetailContent />
    </ProtectedRoute>
  );
}
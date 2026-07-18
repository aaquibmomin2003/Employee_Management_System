'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

interface FormData {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  department: string;
  designation: string;
  salary: string;
  joiningDate: string;
  role: string;
}

const initialForm: FormData = {
  employeeCode: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  department: '',
  designation: '',
  salary: '',
  joiningDate: '',
  role: 'EMPLOYEE',
};

function NewEmployeeContent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const isHR = user?.role === 'HR_MANAGER';

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.employeeCode.trim()) newErrors.employeeCode = 'Employee code is required';
    if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Invalid email address';
    if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'Phone must be exactly 10 digits';
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!form.department.trim()) newErrors.department = 'Department is required';
    if (!form.designation.trim()) newErrors.designation = 'Designation is required';
    if (!form.salary || Number(form.salary) <= 0) newErrors.salary = 'Salary must be a positive number';
    if (!form.joiningDate) newErrors.joiningDate = 'Joining date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await api.post('/employees', {
        ...form,
        salary: Number(form.salary),
      });
      router.push('/employees');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create employee';
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add Employee</h1>
          <Link href="/employees" className="text-gray-500 hover:underline">
            ← Back to list
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Employee Code" value={form.employeeCode} error={errors.employeeCode}
              onChange={(v) => handleChange('employeeCode', v)} placeholder="EMP003" />
            <FormField label="Full Name" value={form.name} error={errors.name}
              onChange={(v) => handleChange('name', v)} placeholder="Jane Smith" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" type="email" value={form.email} error={errors.email}
              onChange={(v) => handleChange('email', v)} placeholder="jane@ems.com" />
            <FormField label="Phone" value={form.phone} error={errors.phone}
              onChange={(v) => handleChange('phone', v)} placeholder="9876543210" />
          </div>

          <FormField label="Password" type="password" value={form.password} error={errors.password}
            onChange={(v) => handleChange('password', v)} placeholder="Minimum 6 characters" />

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Department" value={form.department} error={errors.department}
              onChange={(v) => handleChange('department', v)} placeholder="Engineering" />
            <FormField label="Designation" value={form.designation} error={errors.designation}
              onChange={(v) => handleChange('designation', v)} placeholder="Software Engineer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Salary" type="number" value={form.salary} error={errors.salary}
              onChange={(v) => handleChange('salary', v)} placeholder="50000" />
            <FormField label="Joining Date" type="date" value={form.joiningDate} error={errors.joiningDate}
              onChange={(v) => handleChange('joiningDate', v)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR_MANAGER">HR Manager</option>
              {!isHR && <option value="SUPER_ADMIN">Super Admin</option>}
            </select>
            {isHR && (
              <p className="text-xs text-gray-400 mt-1">
                HR Managers cannot assign the Super Admin role.
              </p>
            )}
          </div>

          {submitError && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Creating...' : 'Create Employee'}
          </button>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label, value, onChange, error, type = 'text', placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function NewEmployeePage() {
  return (
    <ProtectedRoute>
      <NewEmployeeContent />
    </ProtectedRoute>
  );
}
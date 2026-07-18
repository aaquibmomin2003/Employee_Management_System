'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/axios';

interface TreeNode {
  id: string;
  name: string;
  designation: string;
  department: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  directReports: TreeNode[];
}

function OrganizationContent() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const response = await api.get('/organization/tree');
        setTree(response.data.tree);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load organization tree');
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Organization Hierarchy</h1>
          <Link href="/dashboard" className="text-gray-500 hover:underline">← Dashboard</Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          {loading ? (
            <p className="text-gray-500">Loading organization tree...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : tree.length === 0 ? (
            <p className="text-gray-500">No employees found.</p>
          ) : (
            <div className="space-y-2">
              {tree.map((node) => (
                <TreeNodeItem key={node.id} node={node} depth={0} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasReports = node.directReports.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-50"
        style={{ marginLeft: `${depth * 24}px` }}
      >
        {hasReports ? (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-5 h-5" />
        )}

        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
          {node.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1">
          <Link href={`/employees/${node.id}`} className="font-medium text-gray-800 hover:text-blue-600">
            {node.name}
          </Link>
          <span className="text-sm text-gray-500 ml-2">
            {node.designation} · {node.department}
          </span>
        </div>

        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          node.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {node.status}
        </span>

        {hasReports && (
          <span className="text-xs text-gray-400 ml-2">
            {node.directReports.length} report{node.directReports.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {expanded && hasReports && (
        <div>
          {node.directReports.map((child) => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganizationPage() {
  return (
    <ProtectedRoute>
      <OrganizationContent />
    </ProtectedRoute>
  );
}
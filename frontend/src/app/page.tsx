import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-950">
      <nav className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            EMS
          </div>
          <span className="font-semibold text-gray-800 dark:text-gray-100">Employee Management</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
        >
          Login
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium mb-6">
          Full-Stack HR Platform
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
          Manage your workforce, not your spreadsheets
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          A complete employee management system with role-based access,
          organizational hierarchy tracking, and real-time dashboards,
          built for teams that need clarity over chaos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
          >
            See Features
          </Link>
        </div>
      </div>

      <div id="features" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon="Lock"
            title="Role-Based Access"
            description="Super Admin, HR Manager, and Employee roles with granular permissions enforced end-to-end."
          />
          <FeatureCard
            icon="Tree"
            title="Org Hierarchy"
            description="Visualize reporting structures, assign managers, and track direct reports with automatic loop prevention."
          />
          <FeatureCard
            icon="Chart"
            title="Live Dashboard"
            description="Real-time headcounts, active and inactive status, and department breakdowns at a glance."
          />
          <FeatureCard
            icon="Search"
            title="Search and Filter"
            description="Find anyone instantly with server-side search, department filters, and flexible sorting."
          />
          <FeatureCard
            icon="Upload"
            title="Bulk CSV Import"
            description="Onboard entire teams at once with row-level validation and error reporting."
          />
          <FeatureCard
            icon="Moon"
            title="Dark Mode"
            description="A comfortable interface day or night, with your preference remembered across sessions."
          />
        </div>
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          Built as a Full Stack Developer hiring assignment.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
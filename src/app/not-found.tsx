import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50/30 p-6">
      <div className="text-center max-w-md">
        <div className="relative mx-auto mb-8 w-32 h-32">
          <div className="absolute inset-0 bg-cyan-100 rounded-full animate-pulse" />
          <div className="relative flex items-center justify-center h-full">
            <span className="text-6xl font-bold bg-gradient-to-br from-cyan-500 to-indigo-500 bg-clip-text text-transparent">
              404
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all hover:-translate-y-0.5"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

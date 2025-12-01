"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { checkApiHealth, getApiVersion } from "@/lib/api/health.api";
import { dashboardApiService, DashboardStatistics } from "@/lib/api/dashboard.api";
import { logger } from "@workspace/utils";

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
}

// Client-only component to prevent hydration mismatch
// This component only renders after client-side hydration completes
function ClientTimeAgo({ date }: { date: Date | string }) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted (client-side only)
    setMounted(true);
    // Calculate time after component mounts
    setTimeAgo(formatTimeAgo(date));
  }, [date]);

  // During SSR, return empty string to prevent hydration mismatch
  // After hydration, render the actual time
  if (!mounted) {
    return <span suppressHydrationWarning></span>;
  }

  return <span suppressHydrationWarning>{timeAgo}</span>;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-yellow-500';
    case 'in-progress':
      return 'bg-blue-500';
    case 'resolved':
      return 'bg-green-500';
    case 'closed':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}

function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

function getActionColor(action: string): string {
  switch (action) {
    case 'CREATE':
      return 'bg-green-500';
    case 'UPDATE':
      return 'bg-blue-500';
    case 'DELETE':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiVersion, setApiVersion] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check API health on mount
    const checkHealth = async () => {
      const health = await checkApiHealth();
      if (health) {
        setApiStatus('online');
        const version = await getApiVersion();
        if (version) {
          setApiVersion(version.version);
        }
      } else {
        setApiStatus('offline');
      }
    };

    checkHealth();
  }, []);

  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dashboardApiService.getStatistics();
        setStatistics(data);
      } catch (err) {
        logger.error('Failed to load dashboard statistics', err);
        setError((err as Error).message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  const handleRefresh = () => {
    setStatistics(null);
    setError(null);
    setLoading(true);
    dashboardApiService.getStatistics()
      .then((data) => {
        setStatistics(data);
        setLoading(false);
      })
      .catch((err) => {
        logger.error('Failed to refresh dashboard statistics', err);
        setError((err as Error).message || 'Failed to refresh dashboard statistics');
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.dashboard.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.dashboard.welcome')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          {/* API Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'online' ? 'bg-green-500' : 
              apiStatus === 'offline' ? 'bg-red-500' : 
              'bg-yellow-500 animate-pulse'
            }`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400" suppressHydrationWarning>
              API {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}
              {apiVersion && ` (v${apiVersion})`}
            </span>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('admin.dashboard.metrics.projects', 'Total Projects')}
              </p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics ? formatNumber(statistics.projects.total) : '0'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Total Issues */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('admin.dashboard.metrics.issues', 'Total Issues')}
              </p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics ? formatNumber(statistics.issues.total) : '0'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Open Issues */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('admin.dashboard.metrics.openIssues', 'Open Issues')}
              </p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics ? formatNumber(statistics.issues.byStatus.open) : '0'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('admin.dashboard.metrics.users', 'Total Users')}
              </p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics ? formatNumber(statistics.users.total) : '0'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Issues Breakdown */}
      {statistics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('admin.dashboard.sections.issuesByStatus', 'Issues by Status')}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Open</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatNumber(statistics.issues.byStatus.open)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatNumber(statistics.issues.byStatus.inProgress)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Resolved</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatNumber(statistics.issues.byStatus.resolved)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Closed</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatNumber(statistics.issues.byStatus.closed)}
                  </span>
                </div>
              </div>
            </div>

            {/* Severity Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('admin.dashboard.sections.issuesBySeverity', 'Issues by Severity')}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Critical</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatNumber(statistics.issues.bySeverity.critical)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">High</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatNumber(statistics.issues.bySeverity.high)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Medium</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatNumber(statistics.issues.bySeverity.medium)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Low</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatNumber(statistics.issues.bySeverity.low)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Issues */}
          {statistics.recentIssues.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('admin.dashboard.sections.recentIssues', 'Recent Issues')}
                </h2>
                <Link
                  href="/admin/issues"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {statistics.recentIssues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => router.push(`/admin/issues/${issue.id}`)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {issue.title}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {issue.project?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              issue.severity === 'critical'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : issue.severity === 'high'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                                : issue.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}
                          >
                            {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              issue.status === 'open'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : issue.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                : issue.status === 'resolved'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}
                          >
                            {issue.status === 'in-progress' ? 'In Progress' : issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <ClientTimeAgo date={issue.createdAt} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {statistics.recentActivity.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('admin.dashboard.sections.recentActivity', 'Recent Activity')}
                </h2>
                <Link
                  href="/admin/activity-log"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {statistics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className={`w-2 h-2 ${getActionColor(activity.action)} rounded-full mt-2`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.action}</span> {activity.model} #{activity.modelId}
                        {activity.user && (
                          <span className="text-gray-500 dark:text-gray-400"> by {activity.user.name || activity.user.username || activity.user.email}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <ClientTimeAgo date={activity.createdAt} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && statistics && statistics.recentIssues.length === 0 && statistics.recentActivity.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No recent activity</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a project or reporting an issue.
          </p>
        </div>
      )}
    </div>
  );
}

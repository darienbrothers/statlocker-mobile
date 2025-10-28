/**
 * Authentication Monitoring Dashboard
 * 
 * Provides a comprehensive dashboard for viewing authentication
 * metrics, performance data, security alerts, and system health.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Zap,
  RefreshCw
} from 'lucide-react-native';
import { useAuthMonitoring } from '@/hooks/useAuthMonitoring';
import { AuthPerformanceReport, AuthSecurityReport, AuthHealthStatus } from '@/services/AuthMonitoringService';

export interface SLAuthMonitoringDashboardProps {
  timeRange?: 'hour' | 'day' | 'week' | 'month';
  autoRefresh?: boolean;
  refreshInterval?: number;
  onTimeRangeChange?: (timeRange: 'hour' | 'day' | 'week' | 'month') => void;
  testID?: string;
}

export function SLAuthMonitoringDashboard({
  timeRange = 'day',
  autoRefresh = true,
  refreshInterval = 30000,
  onTimeRangeChange,
  testID,
}: SLAuthMonitoringDashboardProps) {
  const { state, actions } = useAuthMonitoring();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return;

    const refreshData = async () => {
      await Promise.all([
        actions.refreshHealthStatus(),
        actions.refreshPerformanceReport(timeRange),
        actions.refreshSecurityReport(timeRange),
      ]);
    };

    // Initial load
    refreshData();

    // Set up interval
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, timeRange, actions]);

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        actions.refreshHealthStatus(),
        actions.refreshPerformanceReport(timeRange),
        actions.refreshSecurityReport(timeRange),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (newTimeRange: 'hour' | 'day' | 'week' | 'month') => {
    onTimeRangeChange?.(newTimeRange);
    actions.refreshPerformanceReport(newTimeRange);
    actions.refreshSecurityReport(newTimeRange);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
      testID={testID}
    >
      {/* Header */}
      <View style={{ padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
            Authentication Monitoring
          </Text>
          <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
            <RefreshCw 
              size={20} 
              color={isRefreshing ? '#9CA3AF' : '#6B7280'} 
            />
          </TouchableOpacity>
        </View>

        {/* Time Range Selector */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['hour', 'day', 'week', 'month'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              onPress={() => handleTimeRangeChange(range)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: timeRange === range ? '#3B82F6' : '#F3F4F6',
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '500',
                color: timeRange === range ? 'white' : '#6B7280',
                textTransform: 'capitalize',
              }}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Health Status */}
      {state.healthStatus && (
        <HealthStatusCard healthStatus={state.healthStatus} />
      )}

      {/* Performance Metrics */}
      {state.performanceReport && (
        <PerformanceMetricsCard 
          performanceReport={state.performanceReport} 
          timeRange={timeRange}
        />
      )}

      {/* Security Overview */}
      {state.securityReport && (
        <SecurityOverviewCard 
          securityReport={state.securityReport} 
          timeRange={timeRange}
        />
      )}

      {/* Error State */}
      {state.error && (
        <View style={{ margin: 20, padding: 16, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <AlertTriangle size={20} color="#DC2626" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#DC2626', marginLeft: 8 }}>
              Error Loading Data
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: '#991B1B' }}>
            {state.error}
          </Text>
        </View>
      )}

      {/* Loading State */}
      {state.isLoading && !state.healthStatus && !state.performanceReport && (
        <View style={{ margin: 20, padding: 32, alignItems: 'center' }}>
          <Activity size={32} color="#6B7280" />
          <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 8 }}>
            Loading monitoring data...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// Health Status Card Component
function HealthStatusCard({ healthStatus }: { healthStatus: AuthHealthStatus }) {
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'degraded': return '#F59E0B';
      case 'unhealthy': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={20} color={getHealthColor(status)} />;
      case 'degraded': return <AlertTriangle size={20} color={getHealthColor(status)} />;
      case 'unhealthy': return <AlertTriangle size={20} color={getHealthColor(status)} />;
      default: return <Activity size={20} color={getHealthColor(status)} />;
    }
  };

  return (
    <View style={{ margin: 20, backgroundColor: 'white', borderRadius: 12, padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Shield size={24} color="#6B7280" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 8 }}>
          System Health
        </Text>
      </View>

      {/* Overall Health */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        {getHealthIcon(healthStatus.overall)}
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '500', 
          color: getHealthColor(healthStatus.overall),
          marginLeft: 8,
          textTransform: 'capitalize'
        }}>
          {healthStatus.overall}
        </Text>
      </View>

      {/* Metrics Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <MetricCard
          icon={<TrendingUp size={16} color="#10B981" />}
          label="Success Rate"
          value={`${healthStatus.successRate.toFixed(1)}%`}
          color={healthStatus.successRate >= 95 ? '#10B981' : healthStatus.successRate >= 90 ? '#F59E0B' : '#EF4444'}
        />
        <MetricCard
          icon={<TrendingDown size={16} color="#EF4444" />}
          label="Error Rate"
          value={`${healthStatus.errorRate.toFixed(1)}%`}
          color={healthStatus.errorRate <= 5 ? '#10B981' : healthStatus.errorRate <= 10 ? '#F59E0B' : '#EF4444'}
        />
        <MetricCard
          icon={<Clock size={16} color="#6B7280" />}
          label="Avg Response"
          value={`${healthStatus.averageResponseTime.toFixed(0)}ms`}
          color={healthStatus.averageResponseTime <= 1000 ? '#10B981' : healthStatus.averageResponseTime <= 3000 ? '#F59E0B' : '#EF4444'}
        />
        <MetricCard
          icon={<Users size={16} color="#3B82F6" />}
          label="Active Users"
          value={healthStatus.activeUsers.toString()}
          color="#3B82F6"
        />
      </View>

      {/* Performance Issues */}
      {healthStatus.performanceIssues.length > 0 && (
        <View style={{ marginTop: 16, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#92400E', marginBottom: 8 }}>
            Performance Issues
          </Text>
          {healthStatus.performanceIssues.map((issue, index) => (
            <Text key={index} style={{ fontSize: 12, color: '#92400E' }}>
              • {issue.issue}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// Performance Metrics Card Component
function PerformanceMetricsCard({ 
  performanceReport, 
  timeRange 
}: { 
  performanceReport: AuthPerformanceReport;
  timeRange: string;
}) {
  return (
    <View style={{ margin: 20, backgroundColor: 'white', borderRadius: 12, padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Zap size={24} color="#6B7280" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 8 }}>
          Performance ({timeRange})
        </Text>
      </View>

      {/* Summary Stats */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <MetricCard
          label="Total Flows"
          value={performanceReport.totalFlows.toString()}
          color="#6B7280"
        />
        <MetricCard
          label="Success Rate"
          value={`${performanceReport.successRate.toFixed(1)}%`}
          color={performanceReport.successRate >= 95 ? '#10B981' : '#F59E0B'}
        />
        <MetricCard
          label="Avg Duration"
          value={`${performanceReport.averageDuration.toFixed(0)}ms`}
          color="#3B82F6"
        />
        <MetricCard
          label="P95 Duration"
          value={`${performanceReport.p95Duration.toFixed(0)}ms`}
          color="#8B5CF6"
        />
      </View>

      {/* Method Breakdown */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12 }}>
          By Authentication Method
        </Text>
        {Object.entries(performanceReport.methodBreakdown).map(([method, data]) => (
          data.count > 0 && (
            <View key={method} style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6'
            }}>
              <Text style={{ fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>
                {method}
              </Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {data.count} flows
                </Text>
                <Text style={{ fontSize: 12, color: data.successRate >= 95 ? '#10B981' : '#F59E0B' }}>
                  {data.successRate.toFixed(1)}%
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {data.avgDuration.toFixed(0)}ms
                </Text>
              </View>
            </View>
          )
        ))}
      </View>

      {/* Top Errors */}
      {performanceReport.topErrors.length > 0 && (
        <View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12 }}>
            Top Errors
          </Text>
          {performanceReport.topErrors.slice(0, 3).map((error, index) => (
            <View key={index} style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingVertical: 6
            }}>
              <Text style={{ fontSize: 12, color: '#EF4444', flex: 1 }}>
                {error.error}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {error.count} ({error.percentage?.toFixed(1)}%)
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// Security Overview Card Component
function SecurityOverviewCard({ 
  securityReport, 
  timeRange 
}: { 
  securityReport: AuthSecurityReport;
  timeRange: string;
}) {
  return (
    <View style={{ margin: 20, backgroundColor: 'white', borderRadius: 12, padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Shield size={24} color="#6B7280" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 8 }}>
          Security Overview ({timeRange})
        </Text>
      </View>

      {/* Alert Summary */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <MetricCard
          label="Critical"
          value={securityReport.criticalAlerts.toString()}
          color="#DC2626"
        />
        <MetricCard
          label="High"
          value={securityReport.highAlerts.toString()}
          color="#EA580C"
        />
        <MetricCard
          label="Medium"
          value={securityReport.mediumAlerts.toString()}
          color="#D97706"
        />
        <MetricCard
          label="Low"
          value={securityReport.lowAlerts.toString()}
          color="#65A30D"
        />
      </View>

      {/* Security Metrics */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <MetricCard
          label="Rate Limits"
          value={securityReport.rateLimitHits.toString()}
          color="#7C3AED"
        />
        <MetricCard
          label="Multiple Failures"
          value={securityReport.multipleFailureUsers.toString()}
          color="#DC2626"
        />
        <MetricCard
          label="Suspicious Users"
          value={securityReport.suspiciousUsers.length.toString()}
          color="#F59E0B"
        />
      </View>

      {/* Top Security Events */}
      {securityReport.topSecurityEvents.length > 0 && (
        <View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12 }}>
            Top Security Events
          </Text>
          {securityReport.topSecurityEvents.slice(0, 3).map((event, index) => (
            <View key={index} style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingVertical: 6
            }}>
              <Text style={{ fontSize: 12, color: '#374151', flex: 1 }}>
                {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {event.count}
                </Text>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: event.severity === 'critical' ? '#FEE2E2' : 
                                   event.severity === 'high' ? '#FED7AA' : 
                                   event.severity === 'medium' ? '#FEF3C7' : '#F0FDF4'
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '500',
                    color: event.severity === 'critical' ? '#DC2626' : 
                           event.severity === 'high' ? '#EA580C' : 
                           event.severity === 'medium' ? '#D97706' : '#16A34A'
                  }}>
                    {event.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// Metric Card Component
function MetricCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon?: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={{ 
      flex: 1, 
      minWidth: 100,
      padding: 12, 
      backgroundColor: '#F9FAFB', 
      borderRadius: 8,
      alignItems: 'center'
    }}>
      {icon && (
        <View style={{ marginBottom: 4 }}>
          {icon}
        </View>
      )}
      <Text style={{ fontSize: 16, fontWeight: '600', color, marginBottom: 2 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

export default SLAuthMonitoringDashboard;
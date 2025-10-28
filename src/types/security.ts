/**
 * Security Types and Interfaces
 * 
 * Type definitions for security events, audit logging, monitoring, and rate limiting
 */

import { AuthErrorCode, SecurityEventType, DeviceInfo } from './auth';

/**
 * Rate Limiting Configuration
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  lockoutMinutes: number;
  enableDeviceTracking: boolean;
  enableIpTracking: boolean;
  logSecurityEvents: boolean;
}

/**
 * Rate Limiting State
 */
export interface RateLimitState {
  failedAttempts: number;
  windowExpiresAt: number | null;
  lastAttemptAt: number | null;
  isLockedOut: boolean;
  lockoutExpiresAt: number | null;
}

/**
 * Rate Limiting Result
 */
export interface RateLimitResult {
  allowed: boolean;
  isLockedOut: boolean;
  remainingLockoutMs: number;
  remainingLockoutMinutes: number;
  attemptsRemaining: number;
  windowExpiresAt: number | null;
  message: string | null;
}

/**
 * Security Event for Logging
 */
export interface SecurityEvent {
  id: string;
  type: string; // Use SecurityEventType from auth.ts
  userId?: string;
  sessionId?: string;
  timestamp: number;
  
  // Request information
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: any;
  
  // Event details
  success?: boolean;
  errorCode?: string;
  provider?: string;
  
  // Additional metadata
  metadata: Record<string, any>;
  
  // Risk assessment
  riskScore?: number;
  riskFactors?: string[];
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'partial';
  
  // Request context
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // Change details
  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  
  // Additional context
  metadata: Record<string, any>;
}

/**
 * Security Risk Levels
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security Alert Types
 */
export enum SecurityAlertType {
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  ACCOUNT_TAKEOVER = 'account_takeover',
  SUSPICIOUS_LOGIN = 'suspicious_login',
  MULTIPLE_DEVICE_ACCESS = 'multiple_device_access',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
}

/**
 * Security Alert Interface
 */
export interface SecurityAlert {
  id: string;
  type: SecurityAlertType;
  riskLevel: RiskLevel;
  timestamp: Date;
  
  // Affected entities
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  
  // Alert details
  title: string;
  description: string;
  evidence: SecurityEvidence[];
  
  // Response tracking
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolvedAt?: Date;
  resolution?: string;
  
  // Metadata
  metadata: Record<string, any>;
}

/**
 * Security Evidence
 */
export interface SecurityEvidence {
  type: 'event' | 'metric' | 'pattern' | 'anomaly';
  source: string;
  timestamp: Date;
  data: any;
  confidence: number; // 0-1
}

/**
 * Threat Intelligence Data
 */
export interface ThreatIntelligence {
  ipAddress: string;
  reputation: 'clean' | 'suspicious' | 'malicious';
  categories: string[];
  lastSeen: Date;
  confidence: number;
  sources: string[];
}

/**
 * Geolocation Information
 */
export interface GeolocationInfo {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  isp?: string;
  organization?: string;
  isVpn?: boolean;
  isTor?: boolean;
}

/**
 * Device Fingerprint
 */
export interface DeviceFingerprint {
  fingerprintId: string;
  deviceInfo: DeviceInfo;
  browserInfo?: {
    userAgent: string;
    language: string;
    timezone: string;
    screenResolution: string;
    colorDepth: number;
    plugins: string[];
  };
  networkInfo?: {
    ipAddress: string;
    geolocation: GeolocationInfo;
    connectionType?: string;
  };
  confidence: number;
  createdAt: Date;
  lastSeen: Date;
}

/**
 * Behavioral Pattern
 */
export interface BehavioralPattern {
  userId: string;
  patternType: 'login_times' | 'device_usage' | 'location_pattern' | 'activity_pattern';
  pattern: any;
  confidence: number;
  establishedAt: Date;
  lastUpdated: Date;
}

/**
 * Anomaly Detection Result
 */
export interface AnomalyDetection {
  id: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  
  // Anomaly details
  type: 'location' | 'time' | 'device' | 'behavior' | 'velocity';
  severity: RiskLevel;
  score: number; // 0-1, higher = more anomalous
  
  // Context
  expected: any;
  actual: any;
  deviation: number;
  
  // Response
  action: 'allow' | 'challenge' | 'block' | 'monitor';
  reason: string;
}

/**
 * Security Metrics
 */
export interface SecurityMetrics {
  timestamp: Date;
  period: 'hour' | 'day' | 'week' | 'month';
  
  // Authentication metrics
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  blockedAttempts: number;
  
  // Account metrics
  newAccounts: number;
  deletedAccounts: number;
  suspendedAccounts: number;
  
  // Security events
  securityAlerts: number;
  highRiskEvents: number;
  anomaliesDetected: number;
  
  // Provider metrics
  providerBreakdown: Record<string, number>;
  
  // Geographic metrics
  topCountries: Array<{ country: string; count: number }>;
  
  // Risk metrics
  averageRiskScore: number;
  riskDistribution: Record<RiskLevel, number>;
}

/**
 * Incident Response Plan
 */
export interface IncidentResponsePlan {
  id: string;
  alertType: SecurityAlertType;
  severity: RiskLevel;
  
  // Response steps
  steps: IncidentResponseStep[];
  
  // Escalation rules
  escalationRules: EscalationRule[];
  
  // Communication plan
  notifications: NotificationRule[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

/**
 * Incident Response Step
 */
export interface IncidentResponseStep {
  id: string;
  order: number;
  title: string;
  description: string;
  automated: boolean;
  timeoutMinutes?: number;
  requiredRole?: string;
  dependencies?: string[];
}

/**
 * Escalation Rule
 */
export interface EscalationRule {
  condition: string; // e.g., "unresolved after 30 minutes"
  action: 'notify' | 'assign' | 'escalate';
  target: string; // role, user, or team
  delay: number; // minutes
}

/**
 * Notification Rule
 */
export interface NotificationRule {
  trigger: 'immediate' | 'escalation' | 'resolution';
  channels: ('email' | 'sms' | 'slack' | 'webhook')[];
  recipients: string[];
  template: string;
}

/**
 * Security Configuration
 */
export interface SecurityConfig {
  // Monitoring settings
  monitoring: {
    enabled: boolean;
    realTimeAlerts: boolean;
    anomalyDetection: boolean;
    threatIntelligence: boolean;
  };
  
  // Rate limiting
  rateLimiting: {
    enabled: boolean;
    strictMode: boolean;
    adaptiveThresholds: boolean;
  };
  
  // Device fingerprinting
  deviceFingerprinting: {
    enabled: boolean;
    strictMode: boolean;
    blockSuspiciousDevices: boolean;
  };
  
  // Geolocation
  geolocation: {
    enabled: boolean;
    blockVpn: boolean;
    blockTor: boolean;
    allowedCountries?: string[];
    blockedCountries?: string[];
  };
  
  // Behavioral analysis
  behavioralAnalysis: {
    enabled: boolean;
    learningPeriodDays: number;
    sensitivityLevel: 'low' | 'medium' | 'high';
  };
  
  // Incident response
  incidentResponse: {
    enabled: boolean;
    autoResponse: boolean;
    escalationEnabled: boolean;
  };
}

/**
 * Security Dashboard Data
 */
export interface SecurityDashboard {
  // Overview metrics
  overview: {
    totalUsers: number;
    activeUsers: number;
    suspiciousActivity: number;
    blockedAttempts: number;
  };
  
  // Recent alerts
  recentAlerts: SecurityAlert[];
  
  // Metrics over time
  metrics: SecurityMetrics[];
  
  // Top threats
  topThreats: Array<{
    type: SecurityAlertType;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  
  // Geographic distribution
  geographicData: Array<{
    country: string;
    count: number;
    riskLevel: RiskLevel;
  }>;
  
  // System health
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
}

/**
 * Compliance Report
 */
export interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'coppa' | 'ccpa' | 'sox' | 'custom';
  period: {
    start: Date;
    end: Date;
  };
  
  // Report data
  summary: {
    totalUsers: number;
    dataRequests: number;
    deletionRequests: number;
    breachIncidents: number;
  };
  
  // Detailed sections
  sections: ComplianceSection[];
  
  // Metadata
  generatedAt: Date;
  generatedBy: string;
  status: 'draft' | 'final' | 'submitted';
}

/**
 * Compliance Section
 */
export interface ComplianceSection {
  title: string;
  description: string;
  data: any;
  evidence: string[];
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  notes?: string;
}
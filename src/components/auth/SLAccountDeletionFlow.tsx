/**
 * Account Deletion Flow Component
 * 
 * Provides a comprehensive UI for account deletion with data export,
 * re-authentication, and progress tracking.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Trash2, Download, Shield, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';
import { SLButton, SLToast, useToast } from '@/components/auth';
import { accountDeletionService, DeletionRequest, DeletionProgress, DataExport } from '@/services/AccountDeletionService';
import { useAuthStore } from '@/store/authStore';

export interface SLAccountDeletionFlowProps {
  onDeletionComplete?: () => void;
  onCancel?: () => void;
  testID?: string;
}

type FlowStep = 'warning' | 'data_export' | 'confirmation' | 'processing' | 'completed' | 'cancelled';

export function SLAccountDeletionFlow({
  onDeletionComplete,
  onCancel,
  testID,
}: SLAccountDeletionFlowProps) {
  const { user } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // State
  const [currentStep, setCurrentStep] = useState<FlowStep>('warning');
  const [isLoading, setIsLoading] = useState(false);
  const [dataExport, setDataExport] = useState<DataExport | null>(null);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null);
  const [deletionProgress, setDeletionProgress] = useState<DeletionProgress | null>(null);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);

  // Check for existing deletion requests on mount
  useEffect(() => {
    if (user) {
      checkExistingDeletionRequests();
    }
  }, [user]);

  // Poll for deletion progress when processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentStep === 'processing' && deletionRequest) {
      interval = setInterval(() => {
        checkDeletionProgress();
      }, 5000); // Check every 5 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentStep, deletionRequest]);

  const checkExistingDeletionRequests = async () => {
    if (!user) return;
    
    try {
      const requests = await accountDeletionService.getUserDeletionRequests(user.uid);
      const activeRequest = requests.find(r => r.status === 'pending' || r.status === 'processing');
      
      if (activeRequest) {
        setDeletionRequest(activeRequest);
        
        if (activeRequest.status === 'processing') {
          setCurrentStep('processing');
          const progress = accountDeletionService.getDeletionProgress(activeRequest.id);
          if (progress) {
            setDeletionProgress(progress);
          }
        } else if (activeRequest.status === 'pending') {
          setCurrentStep('confirmation');
        }
      }
    } catch (error) {
      // No existing requests, continue with normal flow
    }
  };

  const checkDeletionProgress = async () => {
    if (!deletionRequest) return;
    
    try {
      const progress = accountDeletionService.getDeletionProgress(deletionRequest.id);
      if (progress) {
        setDeletionProgress(progress);
        
        if (progress.status === 'completed') {
          setCurrentStep('completed');
          showSuccess('Account deletion completed successfully.');
          onDeletionComplete?.();
        } else if (progress.status === 'failed') {
          showError('Account deletion failed. Please contact support.');
        }
      }
    } catch (error) {
      // Continue polling
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const exportData = await accountDeletionService.exportUserData(user.uid);
      setDataExport(exportData);
      setCurrentStep('confirmation');
      showSuccess('Data exported successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!user) return;
    
    Alert.alert(
      'Confirm Account Deletion',
      `Are you sure you want to delete your account? This action cannot be undone. Your account will be deleted in ${gracePeriodDays} days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const request = await accountDeletionService.requestAccountDeletion(
                user.uid,
                'User requested deletion',
                gracePeriodDays
              );
              
              setDeletionRequest(request);
              setCurrentStep('processing');
              showSuccess(`Account deletion scheduled for ${request.scheduledFor.toLocaleDateString()}`);
            } catch (error: any) {
              if (error.message.includes('Re-authentication required')) {
                showError('Please re-authenticate to confirm account deletion.');
                // TODO: Trigger re-authentication modal
              } else {
                showError(error.message || 'Failed to request account deletion. Please try again.');
              }
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelDeletion = async () => {
    if (!deletionRequest || !user) return;
    
    Alert.alert(
      'Cancel Account Deletion',
      'Are you sure you want to cancel the account deletion request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel Deletion',
          onPress: async () => {
            setIsLoading(true);
            try {
              await accountDeletionService.cancelAccountDeletion(deletionRequest.id, user.uid);
              setCurrentStep('cancelled');
              showSuccess('Account deletion cancelled successfully.');
            } catch (error: any) {
              showError(error.message || 'Failed to cancel deletion. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'warning':
        return <AlertTriangle size={32} color="#DC2626" />;
      case 'data_export':
        return <Download size={32} color="#2563EB" />;
      case 'confirmation':
        return <Shield size={32} color="#D97706" />;
      case 'processing':
        return <Clock size={32} color="#6B7280" />;
      case 'completed':
        return <CheckCircle size={32} color="#059669" />;
      case 'cancelled':
        return <XCircle size={32} color="#6B7280" />;
      default:
        return <Trash2 size={32} color="#DC2626" />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'warning':
        return 'Delete Account';
      case 'data_export':
        return 'Export Your Data';
      case 'confirmation':
        return 'Confirm Deletion';
      case 'processing':
        return 'Processing Deletion';
      case 'completed':
        return 'Account Deleted';
      case 'cancelled':
        return 'Deletion Cancelled';
      default:
        return 'Delete Account';
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'warning':
        return (
          <View>
            <Text style={{ fontSize: 16, color: '#374151', marginBottom: 16, lineHeight: 24 }}>
              Deleting your account will permanently remove all your data, including:
            </Text>
            
            <View style={{ marginBottom: 24 }}>
              {[
                'Profile information and preferences',
                'Game statistics and performance data',
                'Goals and achievements',
                'Account settings and customizations',
                'All associated data and files',
              ].map((item, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ 
                    width: 6, 
                    height: 6, 
                    backgroundColor: '#DC2626', 
                    borderRadius: 3, 
                    marginRight: 12 
                  }} />
                  <Text style={{ color: '#374151', flex: 1 }}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={{ 
              backgroundColor: '#FEF2F2', 
              borderWidth: 1, 
              borderColor: '#FECACA', 
              borderRadius: 8, 
              padding: 16, 
              marginBottom: 24 
            }}>
              <Text style={{ fontWeight: '500', color: '#991B1B', marginBottom: 8 }}>
                ⚠️ This action cannot be undone
              </Text>
              <Text style={{ fontSize: 14, color: '#B91C1C', lineHeight: 20 }}>
                Once you confirm deletion, your account will be scheduled for permanent removal. 
                You'll have {gracePeriodDays} days to change your mind before the deletion is final.
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              <SLButton
                variant="primary"
                onPress={() => setCurrentStep('data_export')}
                fullWidth
                testID="continue-deletion-button"
              >
                Continue with Deletion
              </SLButton>
              
              <SLButton
                variant="secondary"
                onPress={onCancel}
                fullWidth
                testID="cancel-deletion-button"
              >
                Keep My Account
              </SLButton>
            </View>
          </View>
        );

      case 'data_export':
        return (
          <View>
            <Text style={{ fontSize: 16, color: '#374151', marginBottom: 16, lineHeight: 24 }}>
              Before deleting your account, we recommend exporting your data. This will create a 
              downloadable file containing all your information.
            </Text>

            {dataExport && (
              <View style={{ 
                backgroundColor: '#F0FDF4', 
                borderWidth: 1, 
                borderColor: '#BBF7D0', 
                borderRadius: 8, 
                padding: 16, 
                marginBottom: 16 
              }}>
                <Text style={{ fontWeight: '500', color: '#166534', marginBottom: 8 }}>
                  ✅ Data Export Ready
                </Text>
                <Text style={{ fontSize: 14, color: '#15803D' }}>
                  Exported on {dataExport.exportedAt.toLocaleDateString()} • 
                  Size: {(JSON.stringify(dataExport).length / 1024).toFixed(1)} KB
                </Text>
              </View>
            )}

            <View style={{ gap: 12 }}>
              <SLButton
                variant="primary"
                onPress={handleExportData}
                loading={isLoading}
                loadingText="Exporting data..."
                fullWidth
                testID="export-data-button"
              >
                {dataExport ? 'Re-export Data' : 'Export My Data'}
              </SLButton>
              
              <SLButton
                variant="secondary"
                onPress={() => setCurrentStep('confirmation')}
                disabled={!dataExport}
                fullWidth
                testID="skip-export-button"
              >
                Continue to Deletion
              </SLButton>
              
              <SLButton
                variant="secondary"
                onPress={() => setCurrentStep('warning')}
                fullWidth
                testID="back-to-warning-button"
              >
                Back
              </SLButton>
            </View>
          </View>
        );

      case 'confirmation':
        return (
          <View>
            {deletionRequest ? (
              <View>
                <Text style={{ fontSize: 16, color: '#374151', marginBottom: 16, lineHeight: 24 }}>
                  Your account deletion has been scheduled. You can cancel this request at any time 
                  before the deletion date.
                </Text>
                
                <View style={{ 
                  backgroundColor: '#FEF3C7', 
                  borderWidth: 1, 
                  borderColor: '#FDE68A', 
                  borderRadius: 8, 
                  padding: 16, 
                  marginBottom: 24 
                }}>
                  <Text style={{ fontWeight: '500', color: '#92400E', marginBottom: 12 }}>
                    Deletion Details
                  </Text>
                  
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#B45309' }}>Scheduled for:</Text>
                      <Text style={{ fontWeight: '500', color: '#92400E' }}>
                        {deletionRequest.scheduledFor.toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#B45309' }}>Status:</Text>
                      <Text style={{ 
                        fontWeight: '500', 
                        color: '#92400E',
                        textTransform: 'capitalize'
                      }}>
                        {deletionRequest.status}
                      </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#B45309' }}>Data exported:</Text>
                      <Text style={{ fontWeight: '500', color: '#92400E' }}>
                        {deletionRequest.dataExported ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ gap: 12 }}>
                  <SLButton
                    variant="destructive"
                    onPress={handleCancelDeletion}
                    loading={isLoading}
                    loadingText="Cancelling..."
                    fullWidth
                    testID="cancel-deletion-request-button"
                  >
                    Cancel Deletion Request
                  </SLButton>
                </View>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 16, color: '#374151', marginBottom: 16, lineHeight: 24 }}>
                  Final confirmation: Are you absolutely sure you want to delete your account?
                </Text>

                <View style={{ 
                  backgroundColor: '#FEF2F2', 
                  borderWidth: 1, 
                  borderColor: '#FECACA', 
                  borderRadius: 8, 
                  padding: 16, 
                  marginBottom: 24 
                }}>
                  <Text style={{ fontWeight: '500', color: '#991B1B', marginBottom: 8 }}>
                    This will permanently:
                  </Text>
                  <Text style={{ fontSize: 14, color: '#B91C1C', lineHeight: 20 }}>
                    • Delete all your data and statistics{'\n'}
                    • Remove your account from our systems{'\n'}
                    • Cancel any active subscriptions{'\n'}
                    • Make your username available to others
                  </Text>
                </View>

                <View style={{ gap: 12 }}>
                  <SLButton
                    variant="destructive"
                    onPress={handleConfirmDeletion}
                    loading={isLoading}
                    loadingText="Scheduling deletion..."
                    fullWidth
                    testID="confirm-deletion-button"
                  >
                    Yes, Delete My Account
                  </SLButton>
                  
                  <SLButton
                    variant="secondary"
                    onPress={() => setCurrentStep('data_export')}
                    fullWidth
                    testID="back-to-export-button"
                  >
                    Back to Data Export
                  </SLButton>
                </View>
              </View>
            )}
          </View>
        );

      case 'processing':
        return (
          <View>
            <Text style={{ fontSize: 16, color: '#374151', marginBottom: 24, lineHeight: 24 }}>
              Your account deletion is being processed. This may take a few minutes.
            </Text>

            {deletionProgress && (
              <View style={{ marginBottom: 24 }}>
                {/* Progress Bar */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                      Progress
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                      {deletionProgress.progress}%
                    </Text>
                  </View>
                  
                  <View style={{ 
                    height: 8, 
                    backgroundColor: '#F3F4F6', 
                    borderRadius: 4 
                  }}>
                    <View style={{ 
                      height: '100%', 
                      backgroundColor: '#2563EB', 
                      width: `${deletionProgress.progress}%`, 
                      borderRadius: 4 
                    }} />
                  </View>
                </View>

                {/* Current Step */}
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
                  {deletionProgress.currentStep}
                </Text>

                {/* Steps List */}
                <View style={{ gap: 8 }}>
                  {deletionProgress.steps.map((step, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: 8, 
                        backgroundColor: 
                          step.status === 'completed' ? '#059669' :
                          step.status === 'processing' ? '#2563EB' :
                          step.status === 'failed' ? '#DC2626' : '#D1D5DB',
                        marginRight: 12 
                      }} />
                      <Text style={{ 
                        color: step.status === 'completed' ? '#059669' : '#374151',
                        flex: 1 
                      }}>
                        {step.name}
                      </Text>
                      {step.completedAt && (
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>
                          {step.completedAt.toLocaleTimeString()}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {deletionProgress?.canCancel && (
              <SLButton
                variant="secondary"
                onPress={handleCancelDeletion}
                loading={isLoading}
                fullWidth
                testID="cancel-processing-button"
              >
                Cancel Deletion
              </SLButton>
            )}
          </View>
        );

      case 'completed':
        return (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 24 }}>
              Your account has been successfully deleted. All your data has been permanently removed 
              from our systems.
            </Text>
            
            <SLButton
              variant="primary"
              onPress={onDeletionComplete}
              fullWidth
              testID="deletion-complete-button"
            >
              Close
            </SLButton>
          </View>
        );

      case 'cancelled':
        return (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 24 }}>
              Account deletion has been cancelled. Your account and data remain intact.
            </Text>
            
            <SLButton
              variant="primary"
              onPress={onCancel}
              fullWidth
              testID="cancellation-complete-button"
            >
              Close
            </SLButton>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }} testID={testID}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ 
              width: 64, 
              height: 64, 
              backgroundColor: 
                currentStep === 'completed' ? '#D1FAE5' :
                currentStep === 'cancelled' ? '#F3F4F6' :
                currentStep === 'processing' ? '#FEF3C7' :
                currentStep === 'data_export' ? '#DBEAFE' : '#FEE2E2',
              borderRadius: 32, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 16 
            }}>
              {getStepIcon()}
            </View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
              {getStepTitle()}
            </Text>
          </View>

          {renderCurrentStep()}
        </View>
      </ScrollView>

      {/* Toast */}
      <SLToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
        testID="account-deletion-toast"
      />
    </View>
  );
}

export default SLAccountDeletionFlow;
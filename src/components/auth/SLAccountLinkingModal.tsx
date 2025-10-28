/**
 * Account Linking Modal Component
 * 
 * Provides UI for linking and unlinking authentication providers.
 * Handles duplicate account detection and account merging flows.
 */

import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, Alert } from 'react-native';
import { X, Link, Unlink, Apple, Mail, Shield, AlertTriangle } from 'lucide-react-native';
import { SLButton, SLTextField, SLToast, useToast } from '@/components/auth';
import { accountLinkingService } from '@/services/AccountLinkingService';
import { useAuthStore } from '@/store/authStore';
import { AuthProvider } from '@/types/auth';

export interface SLAccountLinkingModalProps {
  visible: boolean;
  onClose: () => void;
  initialAction?: 'link' | 'unlink';
  testID?: string;
}

type LinkingAction = 'link_apple' | 'link_email' | 'unlink_apple' | 'unlink_email' | 'merge_accounts';

export function SLAccountLinkingModal({
  visible,
  onClose,
  initialAction = 'link',
  testID,
}: SLAccountLinkingModalProps) {
  const { user } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // State
  const [currentAction, setCurrentAction] = useState<LinkingAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [linkedProviders, setLinkedProviders] = useState<AuthProvider[]>([]);
  const [duplicateAccountInfo, setDuplicateAccountInfo] = useState<any>(null);

  // Get current linked providers
  React.useEffect(() => {
    if (user && visible) {
      // In a real implementation, you'd get this from the user object
      const providers: AuthProvider[] = [];
      
      // Mock providers based on user data
      if (user.email) {
        providers.push({
          providerId: 'password',
          uid: user.uid,
          email: user.email,
        });
      }
      
      setLinkedProviders(providers);
    }
  }, [user, visible]);

  // Handle Apple account linking
  const handleLinkApple = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await accountLinkingService.linkAppleAccount(user as any, {
        preserveUserData: true,
        requireReauth: true,
        handleApplePrivateRelay: true,
      });

      if (result.success) {
        showSuccess('Apple account linked successfully!');
        if (result.linkedProvider) {
          setLinkedProviders(prev => [...prev, result.linkedProvider!]);
        }
        setCurrentAction(null);
      } else if (result.duplicateAccountFound) {
        setDuplicateAccountInfo(result);
        setCurrentAction('merge_accounts');
      } else if (result.error) {
        showError(result.error.userMessage);
      }
    } catch (error) {
      showError('Failed to link Apple account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email/password linking
  const handleLinkEmail = async () => {
    if (!user || !email || !password) return;
    
    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await accountLinkingService.linkEmailPassword(user as any, email, password, {
        preserveUserData: true,
        requireReauth: true,
        handleApplePrivateRelay: false,
      });

      if (result.success) {
        showSuccess('Email and password linked successfully!');
        if (result.linkedProvider) {
          setLinkedProviders(prev => [...prev, result.linkedProvider!]);
        }
        setCurrentAction(null);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else if (result.duplicateAccountFound) {
        setDuplicateAccountInfo(result);
        setCurrentAction('merge_accounts');
      } else if (result.error) {
        showError(result.error.userMessage);
      }
    } catch (error) {
      showError('Failed to link email and password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle provider unlinking
  const handleUnlinkProvider = async (providerId: string) => {
    if (!user) return;
    
    // Check if this is the last provider
    if (linkedProviders.length <= 1) {
      showError('You must have at least one authentication method.');
      return;
    }
    
    Alert.alert(
      'Remove Authentication Method',
      'Are you sure you want to remove this authentication method? You can add it back later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await accountLinkingService.unlinkProvider(user as any, providerId);
              
              if (result.success) {
                showSuccess('Authentication method removed successfully.');
                setLinkedProviders(prev => prev.filter(p => p.providerId !== providerId));
              } else if (result.error) {
                showError(result.error.userMessage);
              }
            } catch (error) {
              showError('Failed to remove authentication method. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle account merging
  const handleMergeAccounts = async () => {
    if (!user || !duplicateAccountInfo) return;
    
    Alert.alert(
      'Merge Accounts',
      'This will merge your accounts and preserve all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await accountLinkingService.mergeAccounts(user as any, duplicateAccountInfo, {
                preserveUserData: true,
                requireReauth: true,
                handleApplePrivateRelay: true,
              });
              
              if (result.success) {
                showSuccess('Accounts merged successfully!');
                setDuplicateAccountInfo(null);
                setCurrentAction(null);
              } else if (result.error) {
                showError(result.error.userMessage);
              }
            } catch (error) {
              showError('Failed to merge accounts. Please contact support.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Get provider display info
  const getProviderInfo = (providerId: string) => {
    switch (providerId) {
      case 'apple.com':
        return { name: 'Apple', icon: Apple, color: '#000000' };
      case 'password':
        return { name: 'Email & Password', icon: Mail, color: '#6B7280' };
      case 'google.com':
        return { name: 'Google', icon: Mail, color: '#EA4335' };
      default:
        return { name: 'Unknown', icon: Shield, color: '#6B7280' };
    }
  };

  // Check if provider is already linked
  const isProviderLinked = (providerId: string) => {
    return linkedProviders.some(p => p.providerId === providerId);
  };

  // Render main content based on current action
  const renderContent = () => {
    if (currentAction === 'merge_accounts' && duplicateAccountInfo) {
      return (
        <View className="p-6">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
              <AlertTriangle size={32} color="#EA580C" />
            </View>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              Account Already Exists
            </Text>
            <Text className="text-gray-600 text-center">
              We found an existing account with this email. Would you like to merge your accounts?
            </Text>
          </View>

          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="font-medium text-gray-900 mb-2">Existing Account</Text>
            <Text className="text-gray-600">
              Email: {duplicateAccountInfo.error?.metadata?.email || 'Unknown'}
            </Text>
            <Text className="text-gray-600">
              Providers: {duplicateAccountInfo.existingProviders?.join(', ') || 'Unknown'}
            </Text>
          </View>

          <View className="space-y-3">
            <SLButton
              variant="primary"
              onPress={handleMergeAccounts}
              loading={isLoading}
              fullWidth
              testID="merge-accounts-button"
            >
              Merge Accounts
            </SLButton>
            
            <SLButton
              variant="secondary"
              onPress={() => {
                setCurrentAction(null);
                setDuplicateAccountInfo(null);
              }}
              fullWidth
              testID="cancel-merge-button"
            >
              Cancel
            </SLButton>
          </View>
        </View>
      );
    }

    if (currentAction === 'link_email') {
      return (
        <View className="p-6">
          <Text className="text-xl font-semibold text-gray-900 mb-6">
            Add Email & Password
          </Text>

          <View className="space-y-4 mb-6">
            <SLTextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              testID="link-email-input"
            />

            <SLTextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secure
              testID="link-password-input"
            />

            <SLTextField
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secure
              testID="link-confirm-password-input"
            />
          </View>

          <View className="space-y-3">
            <SLButton
              variant="primary"
              onPress={handleLinkEmail}
              loading={isLoading}
              disabled={!email || !password || !confirmPassword}
              fullWidth
              testID="link-email-button"
            >
              Add Email & Password
            </SLButton>
            
            <SLButton
              variant="secondary"
              onPress={() => setCurrentAction(null)}
              fullWidth
              testID="cancel-link-email-button"
            >
              Cancel
            </SLButton>
          </View>
        </View>
      );
    }

    // Main account linking view
    return (
      <View className="p-6">
        <Text className="text-xl font-semibold text-gray-900 mb-6">
          Authentication Methods
        </Text>

        {/* Current linked providers */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-3">
            Connected Methods
          </Text>
          
          {linkedProviders.length > 0 ? (
            <View className="space-y-2">
              {linkedProviders.map((provider, index) => {
                const info = getProviderInfo(provider.providerId);
                const IconComponent = info.icon;
                
                return (
                  <View key={index} className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 items-center justify-center mr-3">
                        <IconComponent size={20} color={info.color} />
                      </View>
                      <View>
                        <Text className="font-medium text-gray-900">{info.name}</Text>
                        {provider.email && (
                          <Text className="text-sm text-gray-600">{provider.email}</Text>
                        )}
                      </View>
                    </View>
                    
                    {linkedProviders.length > 1 && (
                      <SLButton
                        variant="ghost"
                        size="small"
                        onPress={() => handleUnlinkProvider(provider.providerId)}
                        leftIcon={<Unlink size={16} color="#6B7280" />}
                        testID={`unlink-${provider.providerId}-button`}
                      >
                        Remove
                      </SLButton>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text className="text-gray-500 text-center py-4">
              No authentication methods connected
            </Text>
          )}
        </View>

        {/* Available providers to link */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-3">
            Add Authentication Method
          </Text>
          
          <View className="space-y-2">
            {/* Apple Sign-In */}
            {!isProviderLinked('apple.com') && (
              <SLButton
                variant="secondary"
                onPress={handleLinkApple}
                loading={isLoading && currentAction === 'link_apple'}
                leftIcon={<Apple size={20} color="#000000" />}
                fullWidth
                testID="link-apple-button"
              >
                Connect Apple
              </SLButton>
            )}

            {/* Email & Password */}
            {!isProviderLinked('password') && (
              <SLButton
                variant="secondary"
                onPress={() => setCurrentAction('link_email')}
                leftIcon={<Mail size={20} color="#6B7280" />}
                fullWidth
                testID="link-email-setup-button"
              >
                Add Email & Password
              </SLButton>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white" testID={testID}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            Account Security
          </Text>
          <SLButton
            variant="ghost"
            size="small"
            onPress={onClose}
            leftIcon={<X size={20} color="#6B7280" />}
            testID="close-modal-button"
          />
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>

        {/* Toast */}
        <SLToast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onDismiss={hideToast}
          testID="account-linking-toast"
        />
      </View>
    </Modal>
  );
}

export default SLAccountLinkingModal;
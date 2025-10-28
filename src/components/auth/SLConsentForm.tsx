/**
 * Consent Form Component
 * 
 * Provides UI for collecting user consent for Terms of Service,
 * Privacy Policy, and other legal documents with accessibility support.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { CheckSquare, Square, FileText, Shield, Info } from 'lucide-react-native';
import { SLButton, SLToast, useToast } from '@/components/auth';
import { consentManagementService, LegalDocument, ConsentRequest } from '@/services/ConsentManagementService';
import { useAuthStore } from '@/store/authStore';
import { and } from 'firebase/firestore';
import { and } from 'firebase/firestore';
import { and } from 'firebase/firestore';
import { and } from 'firebase/firestore';
import { and } from 'firebase/firestore';

export interface SLConsentFormProps {
  region?: string;
  age?: number;
  onConsentComplete?: (consents: ConsentRequest[]) => void;
  onCancel?: () => void;
  showOptionalConsents?: boolean;
  testID?: string;
}

interface ConsentState {
  [key: string]: {
    document: LegalDocument;
    consented: boolean;
    required: boolean;
  };
}

export function SLConsentForm({
  region = 'US',
  age,
  onConsentComplete,
  onCancel,
  showOptionalConsents = true,
  testID,
}: SLConsentFormProps) {
  const { user } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [consents, setConsents] = useState<ConsentState>({});
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [canProceed, setCanProceed] = useState(false);

  // Load documents and initialize consent state
  useEffect(() => {
    loadDocuments();
  }, [region, age]);

  // Check if user can proceed
  useEffect(() => {
    const requiredConsents = Object.values(consents).filter(c => c.required);
    const allRequiredGiven = requiredConsents.every(c => c.consented);
    setCanProceed(allRequiredGiven);
  }, [consents]);

  const loadDocuments = () => {
    try {
      const allDocs = consentManagementService.getActiveDocuments(region);
      const requiredDocs = consentManagementService.getRequiredDocuments(region, age);
      
      // Filter documents based on showOptionalConsents
      const docsToShow = showOptionalConsents 
        ? allDocs 
        : requiredDocs;

      setDocuments(docsToShow);

      // Initialize consent state
      const initialConsents: ConsentState = {};
      docsToShow.forEach(doc => {
        const isRequired = requiredDocs.some(reqDoc => reqDoc.type === doc.type);
        initialConsents[doc.type] = {
          document: doc,
          consented: false,
          required: isRequired,
        };
      });

      setConsents(initialConsents);
    } catch (error) {
      showError('Failed to load legal documents.');
    }
  };

  const handleConsentChange = (documentType: string, consented: boolean) => {
    setConsents(prev => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        consented,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!user || !canProceed) return;
    
    setIsLoading(true);
    try {
      const consentRequests: ConsentRequest[] = [];
      
      // Create consent requests for all documents
      for (const [documentType, consentData] of Object.entries(consents)) {
        const request: ConsentRequest = {
          documentType: documentType as any,
          consentGiven: consentData.consented,
          method: 'explicit',
          locale: 'en',
        };
        
        consentRequests.push(request);
        
        // Record the consent
        await consentManagementService.recordConsent(user.uid, request);
      }
      
      showSuccess('Consent preferences saved successfully!');
      onConsentComplete?.(consentRequests);
    } catch (error: any) {
      showError(error.userMessage || 'Failed to save consent preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (documents.length === 0) {
    return (
      <View className=\"flex-1 items-center justify-center p-6\" testID={testID}>
        <Text className=\"text-gray-500\">Loading legal documents...</Text>
      </View>
    );
  }

  return (
    <View className=\"flex-1 bg-white\" testID={testID}>
      <ScrollView className=\"flex-1\" showsVerticalScrollIndicator={false}>
        <View className=\"p-6\">
          {/* Header */}
          <View className=\"items-center mb-6\">
            <View className=\"w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4\">
              <Shield size={32} color=\"#2563EB\" />
            </View>
            <Text className=\"text-xl font-semibold text-gray-900 mb-2\">
              Legal Agreements
            </Text>
            <Text className=\"text-gray-600 text-center\">
              Please review and accept the following legal documents to continue
            </Text>
          </View>

          {/* Consent Items */}
          <View className=\"space-y-4 mb-6\">
            {documents.map((document) => {
              const consentData = consents[document.type];
              if (!consentData) return null;

              return (
                <View
                  key={document.type}
                  className={`border rounded-lg p-4 ${
                    consentData.required ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Document Header */}
                  <View className=\"flex-row items-center mb-3\">
                    <FileText size={20} color=\"#6B7280\" />
                    <View className=\"flex-1 ml-3\">
                      <Text className=\"font-medium text-gray-900\">
                        {document.title}
                        {consentData.required && (
                          <Text className=\"text-red-500\"> *</Text>
                        )}
                      </Text>
                    </View>
                  </View>

                  {/* Consent Checkbox */}
                  <TouchableOpacity
                    onPress={() => handleConsentChange(document.type, !consentData.consented)}
                    className=\"flex-row items-center\"
                    accessibilityRole=\"checkbox\"
                    accessibilityState={{ checked: consentData.consented }}
                    testID={`consent-${document.type}-checkbox`}
                  >
                    {consentData.consented ? (
                      <CheckSquare size={24} color=\"#2563EB\" />
                    ) : (
                      <Square size={24} color=\"#6B7280\" />
                    )}
                    <Text className=\"ml-3 flex-1 text-gray-900\">
                      I have read and agree to the {document.title}
                      {consentData.required && (
                        <Text className=\"text-red-500\"> (Required)</Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View className=\"space-y-3\">
            <SLButton
              variant=\"primary\"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!canProceed || isLoading}
              loadingText=\"Saving preferences...\"
              fullWidth
              testID=\"submit-consent-button\"
            >
              Continue
            </SLButton>
            
            {onCancel && (
              <SLButton
                variant=\"secondary\"
                onPress={onCancel}
                disabled={isLoading}
                fullWidth
                testID=\"cancel-consent-button\"
              >
                Cancel
              </SLButton>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Toast */}
      <SLToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
        testID=\"consent-form-toast\"
      />
    </View>
  );
}

export default SLConsentForm;
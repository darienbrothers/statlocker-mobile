/**
 * Consent Form Component
 * 
 * Provides UI for collecting user consent for Terms of Service,
 * Privacy Policy, and other legal documents with accessibility support.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { CheckSquare, Square, FileText, Shield } from 'lucide-react-native';
import { SLButton, SLToast, useToast } from '@/components/auth';
import { consentManagementService, LegalDocument, ConsentRequest } from '@/services/ConsentManagementService';
import { useAuthStore } from '@/store/authStore';

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }} testID={testID}>
        <Text style={{ color: '#6B7280' }}>Loading legal documents...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }} testID={testID}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ 
              width: 64, 
              height: 64, 
              backgroundColor: '#DBEAFE', 
              borderRadius: 32, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 16 
            }}>
              <Shield size={32} color="#2563EB" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
              Legal Agreements
            </Text>
            <Text style={{ color: '#6B7280', textAlign: 'center' }}>
              Please review and accept the following legal documents to continue
            </Text>
          </View>

          {/* Consent Items */}
          <View style={{ marginBottom: 24 }}>
            {documents.map((document) => {
              const consentData = consents[document.type];
              if (!consentData) return null;

              return (
                <View
                  key={document.type}
                  style={{
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 16,
                    borderColor: consentData.required ? '#BFDBFE' : '#D1D5DB',
                    backgroundColor: consentData.required ? '#EFF6FF' : '#F9FAFB',
                  }}
                >
                  {/* Document Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <FileText size={20} color="#6B7280" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontWeight: '500', color: '#111827' }}>
                        {document.title}
                        {consentData.required && (
                          <Text style={{ color: '#EF4444' }}> *</Text>
                        )}
                      </Text>
                    </View>
                  </View>

                  {/* Consent Checkbox */}
                  <TouchableOpacity
                    onPress={() => handleConsentChange(document.type, !consentData.consented)}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: consentData.consented }}
                    testID={`consent-${document.type}-checkbox`}
                  >
                    {consentData.consented ? (
                      <CheckSquare size={24} color="#2563EB" />
                    ) : (
                      <Square size={24} color="#6B7280" />
                    )}
                    <Text style={{ marginLeft: 12, flex: 1, color: '#111827' }}>
                      I have read and agree to the {document.title}
                      {consentData.required && (
                        <Text style={{ color: '#EF4444' }}> (Required)</Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <SLButton
              variant="primary"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!canProceed || isLoading}
              loadingText="Saving preferences..."
              fullWidth
              testID="submit-consent-button"
            >
              Continue
            </SLButton>
            
            {onCancel && (
              <SLButton
                variant="secondary"
                onPress={onCancel}
                disabled={isLoading}
                fullWidth
                testID="cancel-consent-button"
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
        testID="consent-form-toast"
      />
    </View>
  );
}

export default SLConsentForm;
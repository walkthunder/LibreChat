import { useMemo } from 'react';

/**
 * Supported URL parameter keys
 */
export type UrlParamKey =
  | 'sidebar'
  | 'navbar'
  | 'conversationId'
  | 'agentId'
  | 'message'
  | 'autoSend';

/**
 * Parsed URL parameters with type-safe values
 */
export interface UrlParams {
  sidebar?: 'hidden' | 'visible';
  navbar?: 'hidden' | 'visible';
  conversationId?: string;
  agentId?: string;
  message?: string;
  autoSend?: boolean;
}

/**
 * Error types for URL parameter validation
 */
export enum UrlParamError {
  INVALID_SIDEBAR_VALUE = 'Invalid sidebar parameter value',
  INVALID_NAVBAR_VALUE = 'Invalid navbar parameter value',
  INVALID_MESSAGE_ENCODING = 'Message parameter contains invalid encoding',
  AUTO_SEND_WITHOUT_MESSAGE = 'autoSend requires message parameter',
}

/**
 * Return type for useUrlParams hook
 */
export interface UseUrlParamsReturn {
  params: UrlParams;
  isValid: boolean;
  errors: string[];
}

/**
 * Validates sidebar parameter value
 */
function validateSidebar(value: string | null): 'hidden' | 'visible' | null {
  if (value === 'hidden' || value === 'visible') {
    return value;
  }
  return null;
}

/**
 * Validates navbar parameter value
 */
function validateNavbar(value: string | null): 'hidden' | 'visible' | null {
  if (value === 'hidden' || value === 'visible') {
    return value;
  }
  return null;
}

/**
 * Validates and decodes message parameter
 */
function validateMessage(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    // URL decode the message
    return decodeURIComponent(value);
  } catch (error) {
    console.warn('Failed to decode message parameter:', error);
    return null;
  }
}

/**
 * Validates autoSend parameter
 */
function validateAutoSend(value: string | null): boolean {
  return value === 'true';
}

/**
 * Validates conversationId parameter
 */
function validateConversationId(value: string | null): string | null {
  if (!value || value.trim() === '') {
    return null;
  }
  return value.trim();
}

/**
 * Validates agentId parameter
 */
function validateAgentId(value: string | null): string | null {
  if (!value || value.trim() === '') {
    return null;
  }
  return value.trim();
}

/**
 * Custom hook to parse and validate URL parameters
 * 
 * @returns {UseUrlParamsReturn} Parsed parameters, validation status, and errors
 * 
 * @example
 * ```tsx
 * const { params, isValid, errors } = useUrlParams();
 * 
 * if (params.sidebar === 'hidden') {
 *   // Hide sidebar
 * }
 * 
 * if (params.message && params.autoSend) {
 *   // Auto-send message
 * }
 * ```
 */
export function useUrlParams(): UseUrlParamsReturn {
  return useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errors: string[] = [];
    const params: UrlParams = {};

    // Parse and validate sidebar parameter
    const sidebarValue = searchParams.get('sidebar');
    if (sidebarValue !== null) {
      const validatedSidebar = validateSidebar(sidebarValue);
      if (validatedSidebar) {
        params.sidebar = validatedSidebar;
      } else {
        errors.push(UrlParamError.INVALID_SIDEBAR_VALUE);
      }
    }

    // Parse and validate navbar parameter
    const navbarValue = searchParams.get('navbar');
    if (navbarValue !== null) {
      const validatedNavbar = validateNavbar(navbarValue);
      if (validatedNavbar) {
        params.navbar = validatedNavbar;
      } else {
        errors.push(UrlParamError.INVALID_NAVBAR_VALUE);
      }
    }

    // Parse and validate conversationId parameter
    const conversationIdValue = searchParams.get('conversationId');
    if (conversationIdValue !== null) {
      const validatedConversationId = validateConversationId(conversationIdValue);
      if (validatedConversationId) {
        params.conversationId = validatedConversationId;
      }
    }

    // Parse and validate agentId parameter
    const agentIdValue = searchParams.get('agentId');
    if (agentIdValue !== null) {
      const validatedAgentId = validateAgentId(agentIdValue);
      if (validatedAgentId) {
        params.agentId = validatedAgentId;
      }
    }

    // Parse and validate message parameter
    const messageValue = searchParams.get('message');
    if (messageValue !== null) {
      const validatedMessage = validateMessage(messageValue);
      if (validatedMessage !== null) {
        params.message = validatedMessage;
      } else {
        errors.push(UrlParamError.INVALID_MESSAGE_ENCODING);
      }
    }

    // Parse and validate autoSend parameter
    const autoSendValue = searchParams.get('autoSend');
    if (autoSendValue !== null) {
      const validatedAutoSend = validateAutoSend(autoSendValue);
      if (validatedAutoSend) {
        // autoSend requires message parameter
        if (!params.message) {
          errors.push(UrlParamError.AUTO_SEND_WITHOUT_MESSAGE);
        } else {
          params.autoSend = true;
        }
      }
    }

    return {
      params,
      isValid: errors.length === 0,
      errors,
    };
  }, []);
}

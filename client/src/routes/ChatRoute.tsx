import { useEffect, useState } from 'react';
import { Spinner, useToast } from '@librechat/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Constants, EModelEndpoint } from 'librechat-data-provider';
import { useGetModelsQuery } from 'librechat-data-provider/react-query';
import { NotificationSeverity } from '~/common';
import type { TPreset } from 'librechat-data-provider';
import { useGetConvoIdQuery, useGetStartupConfig, useGetEndpointsQuery } from '~/data-provider';
import { useNewConvo, useAppStartup, useAssistantListMap, useIdChangeEffect } from '~/hooks';
import { getDefaultModelSpec, getModelSpecPreset, logger } from '~/utils';
import { ToolCallsMapProvider, useUrlParamsContext } from '~/Providers';
import ChatView from '~/components/Chat/ChatView';
import useAuthRedirect from './useAuthRedirect';
import temporaryStore from '~/store/temporary';
import { useRecoilCallback } from 'recoil';
import store from '~/store';

export default function ChatRoute() {
  const { data: startupConfig } = useGetStartupConfig();
  const { isAuthenticated, user } = useAuthRedirect();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Get URL parameters from context
  const { urlParams } = useUrlParamsContext();
  
  // State for auto-send functionality
  const [autoSendState, setAutoSendState] = useState<{
    message: string;
    shouldSend: boolean;
    hasSent: boolean;
  }>({
    message: urlParams.message || '',
    shouldSend: !!urlParams.autoSend,
    hasSent: false,
  });

  const setIsTemporary = useRecoilCallback(
    ({ set }) =>
      (value: boolean) => {
        set(temporaryStore.isTemporary, value);
      },
    [],
  );
  useAppStartup({ startupConfig, user });

  const index = 0;
  const { conversationId: routeConversationId = '' } = useParams();
  
  // Determine effective conversationId: URL param > route param
  const effectiveConversationId = urlParams.conversationId || routeConversationId;
  
  useIdChangeEffect(effectiveConversationId);
  const { hasSetConversation, conversation } = store.useCreateConversationAtom(index);
  const { newConversation } = useNewConvo();

  const modelsQuery = useGetModelsQuery({
    enabled: isAuthenticated,
    refetchOnMount: 'always',
  });
  const initialConvoQuery = useGetConvoIdQuery(effectiveConversationId, {
    enabled:
      isAuthenticated &&
      effectiveConversationId !== Constants.NEW_CONVO &&
      !hasSetConversation.current,
  });
  const endpointsQuery = useGetEndpointsQuery({ enabled: isAuthenticated });
  const assistantListMap = useAssistantListMap();
  
  // Handle conversation loading errors
  useEffect(() => {
    if (
      urlParams.conversationId &&
      initialConvoQuery.isError &&
      !initialConvoQuery.isLoading
    ) {
      showToast({
        message: 'Conversation not found or access denied. Loading default view.',
        severity: NotificationSeverity.ERROR,
        duration: 4000,
      });
      // Navigate to new conversation
      navigate('/c/new', { replace: true });
    }
  }, [
    urlParams.conversationId,
    initialConvoQuery.isError,
    initialConvoQuery.isLoading,
    showToast,
    navigate,
  ]);

  const isTemporaryChat = conversation && conversation.expiredAt ? true : false;

  useEffect(() => {
    if (effectiveConversationId !== Constants.NEW_CONVO && !isTemporaryChat) {
      setIsTemporary(false);
    } else if (isTemporaryChat) {
      setIsTemporary(isTemporaryChat);
    }
  }, [effectiveConversationId, isTemporaryChat, setIsTemporary]);

  /** This effect is mainly for the first conversation state change on first load of the page.
   *  Adjusting this may have unintended consequences on the conversation state.
   */
  useEffect(() => {
    const shouldSetConvo =
      (startupConfig && !hasSetConversation.current && !modelsQuery.data?.initial) ?? false;
    /* Early exit if startupConfig is not loaded and conversation is already set and only initial models have loaded */
    if (!shouldSetConvo) {
      return;
    }

    // Priority: URL conversationId > route conversationId > URL agentId
    if (effectiveConversationId === Constants.NEW_CONVO && endpointsQuery.data && modelsQuery.data) {
      const result = getDefaultModelSpec(startupConfig);
      const spec = result?.default ?? result?.last;
      
      // Check if agentId is provided in URL params (only when no conversationId)
      const template = conversation ? conversation : undefined;
      const agentPreset = urlParams.agentId && !urlParams.conversationId
        ? { agent_id: urlParams.agentId }
        : undefined;
      
      logger.log('conversation', 'ChatRoute, new convo effect', conversation, 'agentId:', urlParams.agentId);
      newConversation({
        modelsData: modelsQuery.data,
        template: agentPreset ? { ...template, ...agentPreset } : template,
        ...(spec ? { preset: getModelSpecPreset(spec) } : {}),
      });

      hasSetConversation.current = true;
    } else if (initialConvoQuery.data && endpointsQuery.data && modelsQuery.data) {
      logger.log('conversation', 'ChatRoute initialConvoQuery', initialConvoQuery.data);
      newConversation({
        template: initialConvoQuery.data,
        /* this is necessary to load all existing settings */
        preset: initialConvoQuery.data as TPreset,
        modelsData: modelsQuery.data,
        keepLatestMessage: true,
      });
      hasSetConversation.current = true;
    } else if (
      effectiveConversationId === Constants.NEW_CONVO &&
      assistantListMap[EModelEndpoint.assistants] &&
      assistantListMap[EModelEndpoint.azureAssistants]
    ) {
      const result = getDefaultModelSpec(startupConfig);
      const spec = result?.default ?? result?.last;
      
      // Check if agentId is provided in URL params
      const template = conversation ? conversation : undefined;
      const agentPreset = urlParams.agentId && !urlParams.conversationId
        ? { agent_id: urlParams.agentId }
        : undefined;
      
      logger.log('conversation', 'ChatRoute new convo, assistants effect', conversation);
      newConversation({
        modelsData: modelsQuery.data,
        template: agentPreset ? { ...template, ...agentPreset } : template,
        ...(spec ? { preset: getModelSpecPreset(spec) } : {}),
      });
      hasSetConversation.current = true;
    } else if (
      assistantListMap[EModelEndpoint.assistants] &&
      assistantListMap[EModelEndpoint.azureAssistants]
    ) {
      logger.log('conversation', 'ChatRoute convo, assistants effect', initialConvoQuery.data);
      newConversation({
        template: initialConvoQuery.data,
        preset: initialConvoQuery.data as TPreset,
        modelsData: modelsQuery.data,
        keepLatestMessage: true,
      });
      hasSetConversation.current = true;
    }
    /* Creates infinite render if all dependencies included due to newConversation invocations exceeding call stack before hasSetConversation.current becomes truthy */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    startupConfig,
    initialConvoQuery.data,
    endpointsQuery.data,
    modelsQuery.data,
    assistantListMap,
    urlParams.agentId,
    urlParams.conversationId,
  ]);

  if (endpointsQuery.isLoading || modelsQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" aria-live="polite" role="status">
        <Spinner className="text-text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // if not a conversation
  if (conversation?.conversationId === Constants.SEARCH) {
    return null;
  }
  // if conversationId not match
  if (conversation?.conversationId !== effectiveConversationId && !conversation) {
    return null;
  }
  // if conversationId is null
  if (!effectiveConversationId) {
    return null;
  }

  return (
    <ToolCallsMapProvider conversationId={conversation.conversationId ?? ''}>
      <ChatView index={index} />
    </ToolCallsMapProvider>
  );
}

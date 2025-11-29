import { memo, useCallback, useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useForm } from 'react-hook-form';
import { Spinner, useToast } from '@librechat/client';
import { useParams } from 'react-router-dom';
import { Constants, buildTree } from 'librechat-data-provider';
import { NotificationSeverity } from '~/common';
import type { TMessage } from 'librechat-data-provider';
import type { ChatFormValues } from '~/common';
import { ChatContext, AddedChatContext, useFileMapContext, ChatFormProvider, useUrlParamsContext } from '~/Providers';
import { useChatHelpers, useAddedResponse, useSSE } from '~/hooks';
import ConversationStarters from './Input/ConversationStarters';
import { useGetMessagesByConvoId } from '~/data-provider';
import MessagesView from './Messages/MessagesView';
import Presentation from './Presentation';
import ChatForm from './Input/ChatForm';
import Landing from './Landing';
import Header from './Header';
import Footer from './Footer';
import { cn } from '~/utils';
import store from '~/store';

function LoadingSpinner() {
  return (
    <div className="relative flex-1 overflow-hidden overflow-y-auto">
      <div className="relative flex h-full items-center justify-center">
        <Spinner className="text-text-primary" />
      </div>
    </div>
  );
}

function ChatView({ index = 0 }: { index?: number }) {
  const { conversationId } = useParams();
  const rootSubmission = useRecoilValue(store.submissionByIndex(index));
  const addedSubmission = useRecoilValue(store.submissionByIndex(index + 1));
  const centerFormOnLanding = useRecoilValue(store.centerFormOnLanding);
  const { showToast } = useToast();
  
  // Get URL parameters
  const { urlParams } = useUrlParamsContext();
  
  // Track if auto-send has been executed
  const autoSendExecutedRef = useRef(false);

  const fileMap = useFileMapContext();

  const { data: messagesTree = null, isLoading } = useGetMessagesByConvoId(conversationId ?? '', {
    select: useCallback(
      (data: TMessage[]) => {
        const dataTree = buildTree({ messages: data, fileMap });
        return dataTree?.length === 0 ? null : (dataTree ?? null);
      },
      [fileMap],
    ),
    enabled: !!fileMap,
  });

  const chatHelpers = useChatHelpers(index, conversationId);
  const addedChatHelpers = useAddedResponse({ rootIndex: index });

  useSSE(rootSubmission, chatHelpers, false);
  useSSE(addedSubmission, addedChatHelpers, true);

  const methods = useForm<ChatFormValues>({
    defaultValues: { text: urlParams.message || '' },
  });
  
  // Pre-fill message from URL parameter
  useEffect(() => {
    if (urlParams.message && methods.getValues('text') !== urlParams.message) {
      methods.setValue('text', urlParams.message);
    }
  }, [urlParams.message, methods]);
  
  // Auto-send message if autoSend parameter is true
  useEffect(() => {
    // Only execute auto-send once and when conditions are met
    if (
      urlParams.autoSend &&
      urlParams.message &&
      !autoSendExecutedRef.current &&
      !isLoading &&
      conversationId &&
      conversationId !== Constants.NEW_CONVO
    ) {
      // Wait for conversation to be fully initialized
      const timer = setTimeout(() => {
        try {
          // Trigger form submission
          const formElement = document.querySelector('form[data-testid="text-input-form"]');
          if (formElement) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            const submitted = formElement.dispatchEvent(submitEvent);
            
            if (submitted) {
              autoSendExecutedRef.current = true;
              console.log('Auto-send: Message submitted successfully');
            } else {
              // Submission was prevented, keep message in input
              console.warn('Auto-send: Submission was prevented');
              showToast({
                message: 'Message could not be sent automatically. Please review and send manually.',
                severity: NotificationSeverity.WARNING,
                duration: 4000,
              });
            }
          } else {
            console.error('Auto-send: Form element not found');
            showToast({
              message: 'Failed to auto-send message. Please try sending manually.',
              severity: NotificationSeverity.ERROR,
              duration: 4000,
            });
          }
        } catch (error) {
          console.error('Auto-send failed:', error);
          // Ensure message remains in input field by not clearing it
          showToast({
            message: 'Failed to auto-send message. The message has been retained in the input field.',
            severity: NotificationSeverity.ERROR,
            duration: 5000,
          });
        }
      }, 500); // Small delay to ensure everything is initialized
      
      return () => clearTimeout(timer);
    }
  }, [
    urlParams.autoSend,
    urlParams.message,
    isLoading,
    conversationId,
    showToast,
  ]);

  let content: JSX.Element | null | undefined;
  const isLandingPage =
    (!messagesTree || messagesTree.length === 0) &&
    (conversationId === Constants.NEW_CONVO || !conversationId);
  const isNavigating = (!messagesTree || messagesTree.length === 0) && conversationId != null;

  if (isLoading && conversationId !== Constants.NEW_CONVO) {
    content = <LoadingSpinner />;
  } else if ((isLoading || isNavigating) && !isLandingPage) {
    content = <LoadingSpinner />;
  } else if (!isLandingPage) {
    content = <MessagesView messagesTree={messagesTree} />;
  } else {
    content = <Landing centerFormOnLanding={centerFormOnLanding} />;
  }

  return (
    <ChatFormProvider {...methods}>
      <ChatContext.Provider value={chatHelpers}>
        <AddedChatContext.Provider value={addedChatHelpers}>
          <Presentation>
            <div className="flex h-full w-full flex-col">
              {!isLoading && <Header />}
              <>
                <div
                  className={cn(
                    'flex flex-col',
                    isLandingPage
                      ? 'flex-1 items-center justify-end sm:justify-center'
                      : 'h-full overflow-y-auto',
                  )}
                >
                  {content}
                  <div
                    className={cn(
                      'w-full',
                      isLandingPage && 'max-w-3xl transition-all duration-200 xl:max-w-4xl',
                    )}
                  >
                    <ChatForm index={index} />
                    {isLandingPage ? <ConversationStarters /> : <Footer />}
                  </div>
                </div>
                {isLandingPage && <Footer />}
              </>
            </div>
          </Presentation>
        </AddedChatContext.Provider>
      </ChatContext.Provider>
    </ChatFormProvider>
  );
}

export default memo(ChatView);

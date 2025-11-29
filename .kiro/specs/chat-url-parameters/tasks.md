# Implementation Plan

- [x] 1. Create URL parameter parsing hook
  - Create `client/src/hooks/useUrlParams.ts` with TypeScript interfaces
  - Implement URL parameter parsing using URLSearchParams API
  - Add parameter validation logic for sidebar, navbar, conversationId, agentId, message, and autoSend
  - Implement URL decoding for message parameter
  - Add error collection and reporting
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.4, 3.1, 3.2, 4.1, 4.5_

- [ ]* 1.1 Write property test for URL parameter parsing
  - **Property 8: Message URL encoding round-trip**
  - **Validates: Requirements 4.1, 4.5**

- [ ]* 1.2 Write property test for invalid parameter handling
  - **Property 3: Invalid parameter fallback**
  - **Validates: Requirements 1.4, 2.4, 5.4**

- [x] 2. Integrate URL parameters into Root component
  - Import and use `useUrlParams` hook in `client/src/routes/Root.tsx`
  - Modify `navVisible` state initialization to respect sidebar URL parameter
  - Add conditional rendering for GovHeader based on navbar parameter
  - Create UrlParamsContext for passing parameters to child components
  - Ensure localStorage behavior is preserved when no URL parameter is present
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ]* 2.1 Write property test for sidebar visibility control
  - **Property 1: Sidebar visibility parameter application**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ]* 2.2 Write property test for navbar visibility control
  - **Property 2: Navbar visibility parameter application**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Enhance ChatRoute for conversation and agent loading
  - Modify `client/src/routes/ChatRoute.tsx` to extract conversationId and agentId from URL params
  - Implement precedence logic: URL conversationId > route conversationId > URL agentId
  - Add error handling for non-existent conversation/agent IDs
  - Display toast notifications for errors
  - Ensure fallback to default view on errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 3.1 Write property test for conversation ID precedence
  - **Property 6: ConversationId precedence over agentId**
  - **Validates: Requirements 3.3**

- [ ]* 3.2 Write property test for conversation loading
  - **Property 4: Conversation loading by ID**
  - **Validates: Requirements 3.1**

- [ ]* 3.3 Write property test for agent initialization
  - **Property 5: Agent initialization by ID**
  - **Validates: Requirements 3.2**

- [ ]* 3.4 Write property test for invalid ID handling
  - **Property 7: Invalid ID error handling**
  - **Validates: Requirements 3.4, 3.5**

- [x] 4. Implement message pre-fill and auto-send functionality
  - Add state management for auto-send in ChatRoute
  - Pass message and autoSend parameters to ChatView component
  - Modify ChatView to accept external message setting
  - Implement message input field population from URL parameter
  - Add initialization check before auto-sending
  - Ensure auto-send only triggers when both message and autoSend=true are present
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 4.1 Write property test for auto-send dependency
  - **Property 9: Auto-send dependency on message**
  - **Validates: Requirements 4.3**

- [ ]* 4.2 Write property test for auto-send timing
  - **Property 10: Auto-send initialization timing**
  - **Validates: Requirements 4.4**

- [x] 5. Add auto-send error handling
  - Implement try-catch around auto-send logic
  - Display error toast on send failure
  - Retain message text in input field on error
  - Add logging for debugging
  - _Requirements: 4.6_

- [ ]* 5.1 Write property test for auto-send error recovery
  - **Property 11: Auto-send error recovery**
  - **Validates: Requirements 4.6**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Test multiple parameter combinations
  - Manually test various URL parameter combinations
  - Verify all parameters work independently
  - Test edge cases: all parameters together, conflicting values, etc.
  - Verify UI responsiveness with different parameter sets
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 7.1 Write property test for parameter independence
  - **Property 12: Multiple parameter independence**
  - **Validates: Requirements 5.1**

- [ ]* 7.2 Write property test for dynamic URL updates
  - **Property 13: Dynamic URL parameter updates**
  - **Validates: Requirements 5.3**

- [x] 8. Verify core functionality preservation
  - Test that message sending works with all URL parameter combinations
  - Verify conversation history access with sidebar hidden
  - Verify settings access with navbar hidden
  - Test conversation navigation after URL-based loading
  - Ensure all keyboard shortcuts still work
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 8.1 Write property test for core functionality preservation
  - **Property 14: Core functionality preservation**
  - **Validates: Requirements 6.1**

- [ ]* 8.2 Write property test for navigation preservation
  - **Property 15: Navigation preservation after URL load**
  - **Validates: Requirements 6.4**

- [x] 9. Add documentation and examples
  - Create documentation file explaining all supported URL parameters
  - Add usage examples for common scenarios (embedding, deep linking, automation)
  - Document parameter precedence rules
  - Add troubleshooting section
  - _Requirements: All_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

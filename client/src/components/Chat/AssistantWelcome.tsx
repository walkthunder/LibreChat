import React from 'react';

interface AssistantWelcomeProps {
  title?: string;
  welcomeMessage?: string;
}

/**
 * AssistantWelcome Component
 * Displays the welcome message and title for the intelligent assistant
 */
const AssistantWelcome: React.FC<AssistantWelcomeProps> = ({
  title = '智能政务助手',
  welcomeMessage = '您好，我是无线电政务智能助手，请问有什么可以帮助？',
}) => {
  return (
    <div className="assistant-header">
      <h1 className="assistant-title">{title}</h1>
      <p className="assistant-welcome">{welcomeMessage}</p>
    </div>
  );
};

export default AssistantWelcome;

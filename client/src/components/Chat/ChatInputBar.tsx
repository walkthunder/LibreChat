import React, { useState } from 'react';
import { Mic, Paperclip, Send } from 'lucide-react';

interface ChatInputBarProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  onVoiceInput?: () => void;
  onAttachment?: () => void;
}

/**
 * ChatInputBar Component
 * Displays the chat input bar with voice, attachment, and send buttons
 */
const ChatInputBar: React.FC<ChatInputBarProps> = ({
  placeholder = '请输入您的问题...',
  onSend,
  onVoiceInput,
  onAttachment,
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSend) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <textarea
          className="chat-input"
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <div className="input-actions">
          {/* Voice Input Button */}
          <button
            type="button"
            className="input-action-button"
            onClick={onVoiceInput}
            aria-label="语音输入"
            title="语音输入"
          >
            <Mic size={20} />
          </button>

          {/* Attachment Button */}
          <button
            type="button"
            className="input-action-button"
            onClick={onAttachment}
            aria-label="添加附件"
            title="添加附件"
          >
            <Paperclip size={20} />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            className="send-button"
            disabled={!message.trim()}
            aria-label="发送"
          >
            <Send size={18} className="mr-1" />
            发送
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInputBar;

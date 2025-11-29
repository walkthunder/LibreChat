import React from 'react';
import { Search, FileText, CheckSquare, Info } from 'lucide-react';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  onActionClick?: (actionId: string) => void;
}

/**
 * QuickActions Component
 * Displays quick action buttons for common tasks
 */
const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  onActionClick,
}) => {
  const defaultActions: QuickAction[] = [
    {
      id: 'query-monitoring',
      icon: <Search className="quick-action-icon" />,
      title: '查询监测',
      subtitle: '管理流程',
    },
    {
      id: 'generate-report',
      icon: <FileText className="quick-action-icon" />,
      title: '生成报告',
      subtitle: '告警信息',
    },
    {
      id: 'handle-approval',
      icon: <CheckSquare className="quick-action-icon" />,
      title: '办理审批',
      subtitle: '入网申请',
    },
    {
      id: 'view-info',
      icon: <Info className="quick-action-icon" />,
      title: '查看信息',
      subtitle: '日报信息',
    },
  ];

  const actionList = actions || defaultActions;

  const handleActionClick = (actionId: string, customOnClick?: () => void) => {
    if (customOnClick) {
      customOnClick();
    } else if (onActionClick) {
      onActionClick(actionId);
    }
  };

  return (
    <div className="quick-actions">
      {actionList.map((action) => (
        <button
          key={action.id}
          className="quick-action-card"
          onClick={() => handleActionClick(action.id, action.onClick)}
        >
          {action.icon}
          <div className="quick-action-title">{action.title}</div>
          <div className="quick-action-subtitle">{action.subtitle}</div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;

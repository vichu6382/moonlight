import { FileText } from 'lucide-react';

export function EmptyState({ icon: Icon = FileText, title, message, action, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={48} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {action && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

import type { Issue } from '@planning-poker/shared';
import { useState } from 'react';
import { Button, Card, Input } from '../common';

interface IssueBacklogProps {
  issues: Issue[];
  currentIssue: Issue | null;
  isAdmin: boolean;
  onSelectIssue: (issue: Issue) => void;
  onAddIssue: (title: string, description?: string) => void;
  onRemoveIssue: (issueId: string) => void;
}

export function IssueBacklog({
  issues,
  currentIssue,
  isAdmin,
  onSelectIssue,
  onAddIssue,
  onRemoveIssue,
}: IssueBacklogProps) {
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDesc, setNewIssueDesc] = useState('');

  const handleAddIssue = () => {
    if (newIssueTitle.trim()) {
      onAddIssue(newIssueTitle.trim(), newIssueDesc.trim() || undefined);
      setNewIssueTitle('');
      setNewIssueDesc('');
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Issue Backlog</h3>

      {isAdmin && (
        <div className="mb-4 space-y-2">
          <Input
            placeholder="Issue title"
            value={newIssueTitle}
            onChange={(e) => setNewIssueTitle(e.target.value)}
          />
          <Input
            placeholder="Description (optional)"
            value={newIssueDesc}
            onChange={(e) => setNewIssueDesc(e.target.value)}
          />
          <Button onClick={handleAddIssue} disabled={!newIssueTitle.trim()} size="sm">
            Add Issue
          </Button>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {issues.length === 0 ? (
          <p className="text-gray-400 text-sm">No issues added yet</p>
        ) : (
          issues.map((issue) => (
            <button
              type="button"
              key={issue.id}
              className={`w-full text-left p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                currentIssue?.id === issue.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
              onClick={() => isAdmin && onSelectIssue(issue)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{issue.title}</p>
                  {issue.description && (
                    <p className="text-sm text-gray-500">{issue.description}</p>
                  )}
                  {issue.finalEstimate !== undefined && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Estimated: {issue.finalEstimate}
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveIssue(issue.id);
                    }}
                    className="text-xs"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}

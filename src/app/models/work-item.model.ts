export enum WorkItemType {
  Epic = 'Epic',
  UserStory = 'User Story',
  Task = 'Task',
  Bug = 'Bug'
}

export enum WorkItemPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export enum WorkItemStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Closed = 'Closed'
}

export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  type: WorkItemType;
  priority: WorkItemPriority;
  assignee?: string;
  status: WorkItemStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface CreateWorkItemRequest {
  title: string;
  description?: string;
  type: WorkItemType;
  priority: WorkItemPriority;
  assignee?: string;
  status?: WorkItemStatus;
}

export interface UpdateWorkItemRequest {
  title?: string;
  description?: string;
  type?: WorkItemType;
  priority?: WorkItemPriority;
  assignee?: string;
  status?: WorkItemStatus;
}

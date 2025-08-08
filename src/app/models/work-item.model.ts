export enum WorkItemType {
  Epic = 'EPIC',
  UserStory = 'STORY',
  Task = 'TASK',
  Bug = 'BUG'
}

export enum WorkItemPriority {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH'
}

export enum WorkItemStatus {
  NotStarted = 'NOT_STARTED',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Closed = 'CLOSED'
}

export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  type: WorkItemType;
  priority: WorkItemPriority;
  assignee?: string;
  status: WorkItemStatus;
  createdDate: string; // ISO date string - matches backend field name
  updatedDate: string; // ISO date string - matches backend field name
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

// Display labels for UI
export const WorkItemTypeLabels = {
  [WorkItemType.Epic]: 'Epic',
  [WorkItemType.UserStory]: 'User Story',
  [WorkItemType.Task]: 'Task',
  [WorkItemType.Bug]: 'Bug'
} as const;

export const WorkItemPriorityLabels = {
  [WorkItemPriority.Low]: 'Low',
  [WorkItemPriority.Medium]: 'Medium',
  [WorkItemPriority.High]: 'High'
} as const;

export const WorkItemStatusLabels = {
  [WorkItemStatus.NotStarted]: 'Not Started',
  [WorkItemStatus.InProgress]: 'In Progress',
  [WorkItemStatus.Completed]: 'Completed',
  [WorkItemStatus.Closed]: 'Closed'
} as const;

// API Error Response
export interface ApiErrorResponse {
  timestamp: string;
  message: string;
  details: string;
  status: number;
}

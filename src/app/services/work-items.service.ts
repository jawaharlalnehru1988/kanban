import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  WorkItem, 
  WorkItemType, 
  WorkItemPriority, 
  WorkItemStatus, 
  CreateWorkItemRequest, 
  UpdateWorkItemRequest 
} from '../models/work-item.model';

const STORAGE_KEY = 'kanban_work_items';

@Injectable({
  providedIn: 'root'
})
export class WorkItemsService {
  private workItemsSubject = new BehaviorSubject<WorkItem[]>(this.loadFromStorage());
  public workItems$: Observable<WorkItem[]> = this.workItemsSubject.asObservable();

  constructor() {
    // Initialize with mock data if no data exists
    if (this.workItemsSubject.value.length === 0) {
      this.initializeMockData();
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadFromStorage(): WorkItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading from storage:', error);
      return [];
    }
  }

  private saveToStorage(items: WorkItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  private updateWorkItems(items: WorkItem[]): void {
    this.workItemsSubject.next(items);
    this.saveToStorage(items);
  }

  private initializeMockData(): void {
    const now = new Date().toISOString();
    const mockItems: WorkItem[] = [
      {
        id: this.generateId(),
        title: 'Setup Project Infrastructure',
        description: 'Initialize the project with proper folder structure and dependencies',
        type: WorkItemType.Epic,
        priority: WorkItemPriority.High,
        assignee: 'John Doe',
        status: WorkItemStatus.NotStarted,
        createdAt: now,
        updatedAt: now
      },
      {
        id: this.generateId(),
        title: 'User Authentication System',
        description: 'As a user, I want to securely log in to access the application',
        type: WorkItemType.UserStory,
        priority: WorkItemPriority.High,
        assignee: 'Jane Smith',
        status: WorkItemStatus.InProgress,
        createdAt: now,
        updatedAt: now
      },
      {
        id: this.generateId(),
        title: 'Design login form UI',
        description: 'Create responsive login form with validation',
        type: WorkItemType.Task,
        priority: WorkItemPriority.Medium,
        assignee: 'Alice Johnson',
        status: WorkItemStatus.Completed,
        createdAt: now,
        updatedAt: now
      },
      {
        id: this.generateId(),
        title: 'Fix navigation menu overlay issue',
        description: 'Navigation menu overlaps content on mobile devices',
        type: WorkItemType.Bug,
        priority: WorkItemPriority.Low,
        assignee: 'Bob Wilson',
        status: WorkItemStatus.NotStarted,
        createdAt: now,
        updatedAt: now
      }
    ];

    this.updateWorkItems(mockItems);
  }

  // API-like methods
  getWorkItems(): Observable<WorkItem[]> {
    return this.workItems$;
  }

  createWorkItem(request: CreateWorkItemRequest): WorkItem {
    const now = new Date().toISOString();
    const newItem: WorkItem = {
      id: this.generateId(),
      title: request.title,
      description: request.description,
      type: request.type,
      priority: request.priority,
      assignee: request.assignee,
      status: request.status || WorkItemStatus.NotStarted,
      createdAt: now,
      updatedAt: now
    };

    const currentItems = this.workItemsSubject.value;
    this.updateWorkItems([...currentItems, newItem]);
    return newItem;
  }

  updateWorkItem(id: string, request: UpdateWorkItemRequest): WorkItem | null {
    const currentItems = this.workItemsSubject.value;
    const itemIndex = currentItems.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return null;
    }

    const updatedItem: WorkItem = {
      ...currentItems[itemIndex],
      ...request,
      updatedAt: new Date().toISOString()
    };

    const updatedItems = [...currentItems];
    updatedItems[itemIndex] = updatedItem;
    
    this.updateWorkItems(updatedItems);
    return updatedItem;
  }

  deleteWorkItem(id: string): boolean {
    const currentItems = this.workItemsSubject.value;
    const filteredItems = currentItems.filter(item => item.id !== id);
    
    if (filteredItems.length === currentItems.length) {
      return false; // Item not found
    }

    this.updateWorkItems(filteredItems);
    return true;
  }

  // Convenience method for drag and drop
  moveWorkItem(id: string, newStatus: WorkItemStatus): WorkItem | null {
    return this.updateWorkItem(id, { status: newStatus });
  }
}

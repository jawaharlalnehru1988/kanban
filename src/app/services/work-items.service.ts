import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { 
  WorkItem, 
  WorkItemType, 
  WorkItemPriority, 
  WorkItemStatus, 
  CreateWorkItemRequest, 
  UpdateWorkItemRequest,
  ApiErrorResponse
} from '../models/work-item.model';

const STORAGE_KEY = 'kanban_work_items';

@Injectable({
  providedIn: 'root'
})
export class WorkItemsService {
  private readonly baseUrl = 'http://localhost:8080/api/workitems';
//   private readonly baseUrl = 'https://askharekrishna-backend.onrender.com/api/workitems';
  private workItemsSubject = new BehaviorSubject<WorkItem[]>([]);
  public workItems$: Observable<WorkItem[]> = this.workItemsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadAllWorkItems();
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      const apiError = error.error as ApiErrorResponse;
      errorMessage = apiError?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('WorkItems API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  // Core CRUD Operations

  /**
   * Load all work items from backend
   */
  loadAllWorkItems(): void {
    this.setLoading(true);
    this.http.get<WorkItem[]>(`${this.baseUrl}`).pipe(
      catchError(this.handleError),
      tap(() => this.setLoading(false))
    ).subscribe({
      next: (items) => this.workItemsSubject.next(items),
      error: (error) => {
        this.setLoading(false);
        console.error('Failed to load work items:', error);
        // Keep existing items on error
      }
    });
  }

  /**
   * Get all work items (returns observable)
   */
  getWorkItems(): Observable<WorkItem[]> {
    return this.workItems$;
  }

  /**
   * Create new work item
   */
  createWorkItem(request: CreateWorkItemRequest): Observable<WorkItem> {
    this.setLoading(true);
    return this.http.post<WorkItem>(`${this.baseUrl}`, request).pipe(
      catchError(this.handleError),
      tap(newItem => {
        this.setLoading(false);
        const currentItems = this.workItemsSubject.value;
        this.workItemsSubject.next([...currentItems, newItem]);
      })
    );
  }

  /**
   * Update existing work item
   */
  updateWorkItem(id: string, request: UpdateWorkItemRequest): Observable<WorkItem> {
    this.setLoading(true);
    return this.http.put<WorkItem>(`${this.baseUrl}/${id}`, request).pipe(
      catchError(this.handleError),
      tap(updatedItem => {
        this.setLoading(false);
        const currentItems = this.workItemsSubject.value;
        const index = currentItems.findIndex(item => item.id === id);
        if (index !== -1) {
          const updatedItems = [...currentItems];
          updatedItems[index] = updatedItem;
          this.workItemsSubject.next(updatedItems);
        }
      })
    );
  }

  /**
   * Delete work item
   */
  deleteWorkItem(id: string): Observable<void> {
    this.setLoading(true);
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError),
      tap(() => {
        this.setLoading(false);
        const currentItems = this.workItemsSubject.value;
        const filteredItems = currentItems.filter(item => item.id !== id);
        this.workItemsSubject.next(filteredItems);
      })
    );
  }

  /**
   * Move work item to different status (drag & drop helper)
   */
  moveWorkItem(id: string, newStatus: WorkItemStatus): Observable<WorkItem> {
    console.log('Service: moveWorkItem called with id:', id, 'newStatus:', newStatus);
    this.setLoading(true);
    
    // Get current item data
    const currentItems = this.workItemsSubject.value;
    const currentItem = currentItems.find(item => item.id === id);
    
    if (!currentItem) {
      this.setLoading(false);
      return throwError(() => new Error('Item not found for update'));
    }
    
    // Create full update request with current data + new status
    const updateRequest: UpdateWorkItemRequest = {
      title: currentItem.title,
      description: currentItem.description,
      type: currentItem.type,
      priority: currentItem.priority,
      assignee: currentItem.assignee,
      status: newStatus
    };
   
    return this.http.put<WorkItem>(`${this.baseUrl}/${id}`, updateRequest).pipe(
      catchError(this.handleError),
      tap(updatedItem => {
        console.log('Service: Move successful, updated item:', updatedItem);
        this.setLoading(false);
        const currentItems = this.workItemsSubject.value;
        const index = currentItems.findIndex(item => item.id === id);
        if (index !== -1) {
          const updatedItems = [...currentItems];
          updatedItems[index] = updatedItem;
          this.workItemsSubject.next(updatedItems);
          console.log('Service: Local state updated');
        } else {
          console.warn('Service: Item not found in local state for update:', id);
        }
      })
    );
  }

  /**
   * Refresh all work items from server
   */
  refresh(): void {
    this.loadAllWorkItems();
  }

  /**
   * Get current snapshot of work items (synchronous)
   */
  getSnapshot(): WorkItem[] {
    return this.workItemsSubject.value;
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonButtons,
  IonSpinner,
  IonModal,
  IonItem,
  IonLabel,
  IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, funnel, create, trash, close, refresh } from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { WorkItemsService } from '../services/work-items.service';
import { 
  WorkItem, 
  WorkItemType, 
  WorkItemPriority, 
  WorkItemStatus,
  WorkItemTypeLabels,
  WorkItemPriorityLabels,
  WorkItemStatusLabels
} from '../models/work-item.model';

@Component({
  selector: 'app-board',
  templateUrl: './board.page.html',
  styleUrls: ['./board.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonBadge,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonButtons,
    IonSpinner,
    IonModal,
    IonItem,
    IonLabel,
    IonTextarea
  ]
})
export class BoardPage implements OnInit, OnDestroy {
  workItems: WorkItem[] = [];
  filteredItems: WorkItem[] = [];
  loading = false;
  
  // Modal and form state
  isModalOpen = false;
  isEditMode = false;
  editingItemId: string | null = null;
  workItemForm: FormGroup;
  
  // Filter properties
  filterType: string = 'all';
  filterPriority: string = 'all';
  filterAssignee: string = '';

  // Column definitions
  columns = [
    { status: WorkItemStatus.NotStarted, title: WorkItemStatusLabels[WorkItemStatus.NotStarted], color: 'medium' },
    { status: WorkItemStatus.InProgress, title: WorkItemStatusLabels[WorkItemStatus.InProgress], color: 'primary' },
    { status: WorkItemStatus.Completed, title: WorkItemStatusLabels[WorkItemStatus.Completed], color: 'success' },
    { status: WorkItemStatus.Closed, title: WorkItemStatusLabels[WorkItemStatus.Closed], color: 'dark' }
  ];

  // Enum references for template
  WorkItemType = WorkItemType;
  WorkItemPriority = WorkItemPriority;
  WorkItemStatus = WorkItemStatus;
  WorkItemTypeLabels = WorkItemTypeLabels;
  WorkItemPriorityLabels = WorkItemPriorityLabels;
  WorkItemStatusLabels = WorkItemStatusLabels;

  private subscription!: Subscription;

  constructor(private workItemsService: WorkItemsService, private formBuilder: FormBuilder) {
    addIcons({ add, funnel, create, trash, close, refresh });
    
    // Initialize the reactive form
    this.workItemForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      type: [WorkItemType.Task, Validators.required],
      priority: [WorkItemPriority.Medium, Validators.required],
      assignee: ['', [Validators.maxLength(50)]],
      status: [WorkItemStatus.NotStarted, Validators.required]
    });
  }

  ngOnInit() {
    // Subscribe to work items
    this.subscription = this.workItemsService.getWorkItems().subscribe(items => {
      this.workItems = items;
      this.applyFilters();
    });

    // Subscribe to loading state
    this.workItemsService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  applyFilters() {
    this.filteredItems = this.workItems.filter(item => {
      const typeMatch = this.filterType === 'all' || item.type === this.filterType;
      const priorityMatch = this.filterPriority === 'all' || item.priority === this.filterPriority;
      const assigneeMatch = !this.filterAssignee || 
        (item.assignee && item.assignee.toLowerCase().includes(this.filterAssignee.toLowerCase()));
      
      return typeMatch && priorityMatch && assigneeMatch;
    });
  }

  getItemsForColumn(status: WorkItemStatus): WorkItem[] {
    return this.filteredItems.filter(item => item.status === status);
  }

  getPriorityColor(priority: WorkItemPriority): string {
    switch (priority) {
      case WorkItemPriority.High: return 'danger';
      case WorkItemPriority.Medium: return 'warning';
      case WorkItemPriority.Low: return 'success';
      default: return 'medium';
    }
  }

  getTypeColor(type: WorkItemType): string {
    switch (type) {
      case WorkItemType.Epic: return 'secondary';
      case WorkItemType.UserStory: return 'primary';
      case WorkItemType.Task: return 'tertiary';
      case WorkItemType.Bug: return 'danger';
      default: return 'medium';
    }
  }

  // Drag and Drop handlers
  onDragStart(event: DragEvent, item: WorkItem) {
    if (event.dataTransfer) {
      console.log('Starting drag for item:', item.id, item.title);
      event.dataTransfer.setData('text/plain', item.id);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent, targetStatus: WorkItemStatus) {
    event.preventDefault();
    const itemId = event.dataTransfer?.getData('text/plain');
    
    if (itemId) {
      console.log(`Moving work item ${itemId} to status ${targetStatus}`);
      
      // Find the item to verify it exists before attempting the move
      const currentItems = this.workItemsService.getSnapshot();
      const itemToMove = currentItems.find(item => item.id === itemId);
      
      if (!itemToMove) {
        console.error('Item not found in current items:', itemId);
        alert('Work item not found. Please refresh the page and try again.');
        return;
      }
      
      // Check if the item is already in the target status
      if (itemToMove.status === targetStatus) {
        console.log('Item is already in the target status, no action needed');
        return;
      }
      
      console.log('Moving item:', itemToMove.title, 'from', itemToMove.status, 'to', targetStatus);
      
      this.workItemsService.moveWorkItem(itemId, targetStatus).subscribe({
        next: (updatedItem) => {
          console.log('Work item moved successfully:', updatedItem);
        },
        error: (error) => {
          console.error('Failed to move work item:', error);
          
          // Provide more specific error messages
          if (error.message.includes('404')) {
            alert('Work item not found on server. It may have been deleted. Please refresh the page.');
          } else if (error.message.includes('403')) {
            alert('You do not have permission to move this work item.');
          } else if (error.message.includes('500')) {
            alert('Server error occurred while moving the work item. Please try again.');
          } else {
            alert(`Failed to move work item: ${error.message || error}`);
          }
        }
      });
    } else {
      console.error('No item ID found in drag data');
      alert('Failed to identify the work item to move. Please try again.');
    }
  }

  onDeleteItem(item: WorkItem, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
      this.workItemsService.deleteWorkItem(item.id).subscribe({
        next: () => {
          console.log('Work item deleted successfully');
        },
        error: (error) => {
          console.error('Failed to delete work item:', error);
          alert('Failed to delete work item. Please try again.');
        }
      });
    }
  }

  onFilterTypeChange(event: any) {
    this.filterType = event.detail.value;
    this.applyFilters();
  }

  onFilterPriorityChange(event: any) {
    this.filterPriority = event.detail.value;
    this.applyFilters();
  }

  onFilterAssigneeChange(event: any) {
    this.filterAssignee = event.target.value;
    this.applyFilters();
  }

  createNewItem() {
    this.openModal();
  }

  refreshWorkItems() {
    console.log('Refreshing work items from server...');
    this.workItemsService.refresh();
  }

  openModal(item?: WorkItem) {
    this.isEditMode = !!item;
    this.editingItemId = item?.id || null;
    
    if (item) {
      // Edit mode - populate form with existing data
      this.workItemForm.patchValue({
        title: item.title,
        description: item.description || '',
        type: item.type,
        priority: item.priority,
        assignee: item.assignee || '',
        status: item.status
      });
    } else {
      // Create mode - reset form with defaults
      this.workItemForm.reset({
        title: '',
        description: '',
        type: WorkItemType.Task,
        priority: WorkItemPriority.Medium,
        assignee: '',
        status: WorkItemStatus.NotStarted
      });
    }
    
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.editingItemId = null;
    this.workItemForm.reset();
  }

  onSubmitForm() {
    if (this.workItemForm.valid) {
      const formValue = this.workItemForm.value;
      
      if (this.isEditMode && this.editingItemId) {
        // Update existing work item
        this.workItemsService.updateWorkItem(this.editingItemId, formValue).subscribe({
          next: (updatedItem) => {
            console.log('Work item updated successfully:', updatedItem);
            this.closeModal();
          },
          error: (error) => {
            console.error('Failed to update work item:', error);
            alert('Failed to update work item. Please try again.');
          }
        });
      } else {
        // Create new work item
        this.workItemsService.createWorkItem(formValue).subscribe({
          next: (createdItem) => {
            console.log('Work item created successfully:', createdItem);
            this.closeModal();
          },
          error: (error) => {
            console.error('Failed to create work item:', error);
            alert('Failed to create work item. Please try again.');
          }
        });
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.workItemForm.markAllAsTouched();
    }
  }

  onEditItem(item: WorkItem) {
    this.openModal(item);
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.workItemForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.workItemForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${fieldName} must be no more than ${field.errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  trackByItemId(index: number, item: WorkItem): string {
    return item.id;
  }
}

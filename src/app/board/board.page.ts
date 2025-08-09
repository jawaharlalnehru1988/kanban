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
  IonTextarea,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, funnel, create, trash, close, refresh, swapHorizontal, arrowForward } from 'ionicons/icons';
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

  // Mobile drag and drop state
  draggedItem: WorkItem | null = null;
  isDragging = false;
  isMobileDevice = false;

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

  constructor(
    private workItemsService: WorkItemsService, 
    private formBuilder: FormBuilder,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({ add, funnel, create, trash, close, refresh, swapHorizontal, arrowForward });
    
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
    // Detect mobile device
    this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || window.innerWidth <= 768;

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

  // Drag and Drop handlers (Desktop)
  onDragStart(event: DragEvent, item: WorkItem) {
    if (event.dataTransfer) {
      console.log('Starting drag for item:', item.id, item.title);
      event.dataTransfer.setData('text/plain', item.id);
      event.dataTransfer.effectAllowed = 'move';
      this.draggedItem = item;
      this.isDragging = true;
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
      this.moveItemToStatus(itemId, targetStatus);
    } else {
      console.error('No item ID found in drag data');
      alert('Failed to identify the work item to move. Please try again.');
    }
    
    this.draggedItem = null;
    this.isDragging = false;
  }

  // Touch handlers for mobile
  onTouchStart(event: TouchEvent, item: WorkItem) {
    if (this.isMobileDevice) {
      event.preventDefault();
      this.draggedItem = item;
      this.isDragging = true;
      console.log('Touch start for item:', item.id, item.title);
    }
  }

  onTouchEnd(event: TouchEvent, targetStatus?: WorkItemStatus) {
    if (this.isMobileDevice && this.isDragging && this.draggedItem) {
      event.preventDefault();
      
      if (targetStatus && targetStatus !== this.draggedItem.status) {
        this.moveItemToStatus(this.draggedItem.id, targetStatus);
      }
    }
    
    this.draggedItem = null;
    this.isDragging = false;
  }

  // Mobile-specific: Show status change options
  onMobileItemLongPress(item: WorkItem) {
    if (this.isMobileDevice) {
      this.showStatusChangeOptions(item);
    }
  }

  // Show action sheet for status change on mobile
  async showStatusChangeOptions(item: WorkItem) {
    const availableStatuses = this.columns
      .filter(col => col.status !== item.status)
      .map(col => ({
        text: `Move to ${col.title}`,
        icon: 'arrow-forward',
        handler: () => {
          this.moveItemToStatus(item.id, col.status);
        }
      }));

    const actionSheet = await this.actionSheetController.create({
      header: `Move "${item.title}"`,
      subHeader: 'Select new status',
      buttons: [
        ...availableStatuses,
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  // Simple status selector fallback (if ActionSheet doesn't work)
  showStatusSelector(item: WorkItem) {
    const newStatusMap: { [key: string]: WorkItemStatus } = {
      '1': WorkItemStatus.NotStarted,
      '2': WorkItemStatus.InProgress,
      '3': WorkItemStatus.Completed,
      '4': WorkItemStatus.Closed
    };

    const choice = prompt(
      `Move "${item.title}" to:\n1. Not Started\n2. In Progress\n3. Completed\n4. Closed\n\nEnter number (1-4):`
    );

    if (choice && newStatusMap[choice] && newStatusMap[choice] !== item.status) {
      this.moveItemToStatus(item.id, newStatusMap[choice]);
    }
  }

  // Common method to move items
  private moveItemToStatus(itemId: string, targetStatus: WorkItemStatus) {
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

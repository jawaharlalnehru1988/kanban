import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, funnel, create, trash } from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { WorkItemsService } from '../services/work-items.service';
import { 
  WorkItem, 
  WorkItemType, 
  WorkItemPriority, 
  WorkItemStatus 
} from '../models/work-item.model';

@Component({
  selector: 'app-board',
  templateUrl: './board.page.html',
  styleUrls: ['./board.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonButtons
  ]
})
export class BoardPage implements OnInit, OnDestroy {
  workItems: WorkItem[] = [];
  filteredItems: WorkItem[] = [];
  
  // Filter properties
  filterType: string = 'all';
  filterPriority: string = 'all';
  filterAssignee: string = '';

  // Column definitions
  columns = [
    { status: WorkItemStatus.NotStarted, title: 'Not Started', color: 'medium' },
    { status: WorkItemStatus.InProgress, title: 'In Progress', color: 'primary' },
    { status: WorkItemStatus.Completed, title: 'Completed', color: 'success' },
    { status: WorkItemStatus.Closed, title: 'Closed', color: 'dark' }
  ];

  // Enum references for template
  WorkItemType = WorkItemType;
  WorkItemPriority = WorkItemPriority;
  WorkItemStatus = WorkItemStatus;

  private subscription!: Subscription;

  constructor(private workItemsService: WorkItemsService) {
    addIcons({ add, funnel, create, trash });
  }

  ngOnInit() {
    this.subscription = this.workItemsService.getWorkItems().subscribe(items => {
      this.workItems = items;
      this.applyFilters();
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
      this.workItemsService.moveWorkItem(itemId, targetStatus);
    }
  }

  onDeleteItem(item: WorkItem, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
      this.workItemsService.deleteWorkItem(item.id);
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
    // For now, create a simple item - we'll add modal later
    const newItem = {
      title: 'New Task',
      description: 'Click to edit this task',
      type: WorkItemType.Task,
      priority: WorkItemPriority.Medium,
      assignee: 'Unassigned'
    };
    
    this.workItemsService.createWorkItem(newItem);
  }

  trackByItemId(index: number, item: WorkItem): string {
    return item.id;
  }
}

import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesGuard implements CanDeactivate<CanComponentDeactivate> {
  constructor(private toast: NgToastService) { }

  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | Promise<boolean> | boolean {
    if (component && !component.canDeactivate()) {
      console.log('UnsavedChangesGuard: Unsaved changes detected');
      this.toast.warning({
        detail: 'Warning',
        summary: 'You are leaving this page without submitting.',
        duration: 5000
      });
      const confirmation = confirm('You have unsaved changes. Do you really want to leave?');
      console.log('User confirmed:', confirmation); // Log user's choice
      return confirmation; // Return `true` to allow navigation, `false` to block
    }
    console.log('UnsavedChangesGuard: No unsaved changes detected or canDeactivate is true');
    return true; // Allow navigation
  }
}
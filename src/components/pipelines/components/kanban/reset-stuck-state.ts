/**
 * Utility to reset stuck drag state attributes in the DOM.
 * This is needed because sometimes dnd-kit leaves elements in an inconsistent state
 * after drag operations, especially when updates happen during the drag.
 */
export function resetStuckDragAttributes() {
  // Find any elements with aria-pressed="true" and reset them
  const stuckPressed = document.querySelectorAll('[aria-pressed="true"]');
  stuckPressed.forEach(el => {
    if (el instanceof HTMLElement) {
      console.log('Resetting stuck aria-pressed element', el);
      el.setAttribute('aria-pressed', 'false');
    }
  });
  
  // Find any elements with data-dragging="true" and reset them
  const draggingElements = document.querySelectorAll('[data-dragging="true"]');
  draggingElements.forEach(el => {
    if (el instanceof HTMLElement) {
      console.log('Resetting stuck data-dragging element', el);
      el.removeAttribute('data-dragging');
    }
  });
  
  // Reset transform styles on cards that might be stuck
  const transformedElements = document.querySelectorAll('[style*="transform"]');
  transformedElements.forEach(el => {
    if (el instanceof HTMLElement && el.hasAttribute('data-task-id')) {
      console.log('Clearing stuck transform on task', el);
      el.style.transform = '';
      el.style.transition = 'none';
      
      // Force a reflow to ensure styles are applied
      void el.offsetHeight;
      
      // Restore transition after a brief delay
      setTimeout(() => {
        el.style.transition = '';
      }, 10);
    }
  });
  
  // Clear any "dragging" class that might be stuck
  const draggingClassElements = document.querySelectorAll('.task-card-dragging');
  draggingClassElements.forEach(el => {
    if (el instanceof HTMLElement) {
      console.log('Removing stuck dragging class', el);
      el.classList.remove('task-card-dragging');
    }
  });
}

/**
 * Create a reset button for emergencies - DOM-only implementation that doesn't use hooks
 * This will add a button to the UI that can be clicked to reset any stuck drag state
 * 
 * @param isDevelopment - Optional flag to only create in development mode
 */
export function createResetButton(isDevelopment?: boolean) {
  // Skip in production unless explicitly overridden
  if (isDevelopment === false || (isDevelopment === undefined && process.env.NODE_ENV !== 'development')) {
    return;
  }
  
  // Execute on next tick to avoid React hook issues
  setTimeout(() => {
    try {
      const existingButton = document.getElementById('reset-stuck-drag-state');
      if (existingButton) {
        return; // Already exists
      }
      
      const button = document.createElement('button');
      button.id = 'reset-stuck-drag-state';
      button.textContent = 'Reset Stuck Drag State';
      button.style.position = 'fixed';
      button.style.bottom = '10px';
      button.style.right = '10px';
      button.style.zIndex = '9999';
      button.style.backgroundColor = 'red';
      button.style.color = 'white';
      button.style.padding = '8px 12px';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.opacity = '0.8';
      
      button.addEventListener('click', () => {
        resetStuckDragAttributes();
        alert('Drag state has been reset. Try dragging again.');
      });
      
      // Only append if body exists (avoid SSR issues)
      if (document.body) {
        document.body.appendChild(button);
      }
    } catch (e) {
      // Silently fail if there's any issue creating the button
      console.log('Could not create reset button:', e);
    }
  }, 0);
}

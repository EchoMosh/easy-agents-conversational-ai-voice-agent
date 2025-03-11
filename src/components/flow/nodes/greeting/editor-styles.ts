
export const editorStyles = `
.ProseMirror {
  outline: none;
  min-height: 80px;
  cursor: text;
  text-align: left;
  width: 100%;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: "Enter the message your bot will say. Use # or @ to insert variables.";
  color: #9ca3af;
  pointer-events: none;
  position: absolute;
  font-style: italic;
  float: none;
  height: auto;
}

/* Variable styling */
.editor-variable {
  display: inline;
  background-color: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border-radius: 0.25rem;
  padding: 0 0.25rem;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  white-space: nowrap; /* Prevent line breaks within variables */
  user-select: all; /* Make variables easier to select all at once */
  position: relative;
  z-index: 1;
  pointer-events: auto;
  transition: all 0.2s ease;
}

/* Fix for dark mode */
.dark .editor-variable {
  background-color: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

/* Ensure paragraphs break variables that cross them */
.ProseMirror p {
  position: relative;
  word-break: break-word;
}

/* Styling for variables that are being edited */
.ProseMirror .editor-variable[data-variable="editing"] {
  background-color: rgba(99, 102, 241, 0.05);
  color: inherit;
  box-shadow: none;
  border: 1px dashed rgba(99, 102, 241, 0.3);
  border-radius: 0.25rem;
  padding: 0 0.25rem;
  font-weight: normal;
}

/* Handle return key (enter) inside variables */
.ProseMirror br + .editor-variable,
.ProseMirror .editor-variable + br {
  display: inline;
  background-color: transparent !important;
  color: inherit !important;
  font-weight: normal !important;
  box-shadow: none !important;
  white-space: normal !important;
  border-radius: 0 !important;
  padding: 0 !important;
}

/* Animation for the dialog */
@keyframes fadeUpIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeUpIn 0.3s ease-out forwards;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
`;

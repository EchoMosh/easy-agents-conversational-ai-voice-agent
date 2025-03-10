
export const editorStyles = `
.ProseMirror {
  outline: none;
  min-height: 80px;
  cursor: text;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
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
.ProseMirror .editor-variable:has(br),
.ProseMirror .editor-variable:not(:matches([data-variable="{*}"])) {
  background-color: transparent !important;
  color: inherit !important;
  font-weight: normal !important;
  box-shadow: none !important;
  white-space: normal !important;
  border-radius: 0 !important;
  padding: 0 !important;
  transition: all 0.2s ease;
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
`;

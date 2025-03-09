
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
  display: inline-block;
  background-color: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border-radius: 0.25rem;
  padding: 0 0.25rem;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  white-space: nowrap; /* Prevent line breaks within variables */
}

.dark .editor-variable {
  background-color: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

/* Ensure variables don't wrap */
.editor-paragraph {
  word-break: break-word;
}
`;

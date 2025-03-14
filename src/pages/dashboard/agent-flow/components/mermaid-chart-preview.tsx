
interface MermaidChartPreviewProps {
  mermaidChart: string;
  onClose: () => void;
}

export function MermaidChartPreview({ mermaidChart, onClose }: MermaidChartPreviewProps) {
  return (
    <div 
      className="absolute bottom-4 right-4 p-4 bg-white dark:bg-gray-800 border rounded-md shadow-md max-w-md max-h-96 overflow-auto z-50 text-xs"
      style={{ opacity: 0.9 }}
    >
      <div className="flex justify-between mb-2">
        <span className="font-bold">Mermaid Chart Preview (CTRL+M)</span>
        <button 
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <pre className="whitespace-pre-wrap break-all">{mermaidChart}</pre>
    </div>
  );
}

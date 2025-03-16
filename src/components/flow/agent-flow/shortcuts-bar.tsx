
import { Panel } from '@xyflow/react';
import { widgets } from './widgets/widget-definitions';

export function ShortcutsBar() {
  return (
    <Panel position="bottom-center" className="p-0">
      <div 
        className={`shortcuts-bar py-1.5 px-3 rounded-t-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm`}
      >
        <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {widgets.map(widget => (
            <div key={widget.type} className="flex items-center gap-1.5">
              <span className="shortcut-key">{widget.shortcut}</span>
              <span>{widget.label}</span>
            </div>
          ))}
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center gap-1.5">
            <span className="shortcut-key">Del</span>
            <span>Delete</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

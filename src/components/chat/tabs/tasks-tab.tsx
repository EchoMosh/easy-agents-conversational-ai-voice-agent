
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

interface TasksTabProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export function TasksTab({ tasks, onTasksChange }: TasksTabProps) {
  const [newTask, setNewTask] = useState("");

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        onTasksChange([
          { id: crypto.randomUUID(), title: newTask, completed: false, created_at: new Date().toISOString() },
          ...tasks
        ]);
        setNewTask("");
      }}>
        <div className="flex gap-2">
          <Input
            placeholder="Add a task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <Button type="submit">Add</Button>
        </div>
      </form>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => {
                onTasksChange(tasks.map(t =>
                  t.id === task.id ? { ...t, completed: !t.completed } : t
                ));
              }}
              className="rounded border-gray-300"
            />
            <span className={`text-sm flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onTasksChange(tasks.filter(t => t.id !== task.id))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

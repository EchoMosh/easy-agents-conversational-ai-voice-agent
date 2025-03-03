import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { useStoreApi } from 'reactflow';

interface GreetingNodeProps {
  id: string;
  data: {
    greeting: string;
    outcomes: string[];
    onChange: (evt: React.ChangeEvent<HTMLInputElement>) => void;
    onAddOutcome: () => void;
    onRemoveOutcome: (index: number) => void;
  };
  selected: boolean;
}

// Find the parent NodeWrapper component and add a hover state
const NodeWrapper = ({ children, selected }: { children: React.ReactNode, selected: boolean }) => {
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <div 
      className={`relative bg-background rounded-lg border shadow-sm ${
        selected ? 'border-primary' : 'border-border'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
      
      {/* Controls container - only visible on hover or when selected */}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 z-10 flex gap-2 transition-opacity duration-200 ${
          isHovering || selected ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Control buttons */}
      </div>
    </div>
  );
};

const GreetingNode: React.FC<GreetingNodeProps> = ({ id, data, selected }) => {
  const storeApi = useStoreApi();
  const { deleteNode } = storeApi.getState();

  const handleRemoveNode = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  return (
    <NodeWrapper selected={selected}>
      <div className="p-4 rounded-lg">
        <Label htmlFor="greeting">Greeting</Label>
        <Input
          id="greeting"
          name="greeting"
          className="w-full mt-1"
          value={data.greeting}
          onChange={data.onChange}
        />
        
        <div className="mt-4">
          <Label>Outcomes</Label>
          {data.outcomes && data.outcomes.map((outcome, index) => (
            <div key={index} className="flex items-center mt-1">
              <Input
                type="text"
                className="flex-1"
                value={outcome}
                onChange={(e) => {
                  const newOutcomes = [...data.outcomes];
                  newOutcomes[index] = e.target.value;
                  data.onChange(e); // Notify parent about the change
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="ml-2"
                onClick={() => data.onRemoveOutcome(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button className="w-full mt-2" type="button" onClick={data.onAddOutcome}>
            Add Outcome
          </Button>
        </div>
        <Button variant="destructive" size="sm" className="mt-4 w-full" onClick={handleRemoveNode}>
          Delete Node
        </Button>
      </div>
      <Handle type="source" position={Position.Right} id="a" />
      {data.outcomes && data.outcomes.map((_, index) => (
        <Handle
          key={`outcome-${index}`}
          type="source"
          position={Position.Right}
          id={`outcome-${index}`}
          className="-right-[1px] top-[unset] translate-y-0.5"
          style={{ top: `${(index + 1) * 25}%` }}
        />
      ))}
      <Handle type="target" position={Position.Left} />
    </NodeWrapper>
  );
};

export default GreetingNode;


import React, { useEffect, useState, useContext } from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';
import { SmileIcon } from 'lucide-react';
import { NodeUpdateContext } from '@/components/flow/agent-flow/flow';
import { OutcomeInput } from '@/components/flow/nodes/greeting/outcome-input';
import { OutcomeListItem } from '@/components/flow/nodes/greeting/outcome-list-item';
import { TipTapGreetingEditor } from '@/components/flow/nodes/greeting/tiptap-greeting-editor';
import { NodeStatusIndicator } from '@/components/flow/node-status-indicator';

export function GreetingNode({ id, data }: { id: string; data: any }) {
  const [greeting, setGreeting] = useState(data?.greeting || 'Hello, this is your agent. How can I help you?');
  const [outcomes, setOutcomes] = useState(data?.outcomes || []);
  const [showOutcomeInput, setShowOutcomeInput] = useState(false);
  const [editingOutcomeIndex, setEditingOutcomeIndex] = useState<number | null>(null);
  const [currentOutcome, setCurrentOutcome] = useState('');
  const { updateNodeData } = useContext(NodeUpdateContext);
  const edges = useEdges();
  
  // Check if this node has any connections
  const hasConnection = edges.some(edge => edge.source === id);

  // Sync with incoming data changes
  useEffect(() => {
    if (data?.greeting !== undefined && data.greeting !== greeting) {
      setGreeting(data.greeting);
    }
    
    if (data?.outcomes !== undefined) {
      setOutcomes(data.outcomes);
    }
  }, [data, greeting]);

  const handleGreetingChange = (newGreeting: string) => {
    setGreeting(newGreeting);
    updateNodeData(id, { ...data, greeting: newGreeting, outcomes });
  };

  const handleAddOutcome = (outcome: string) => {
    if (!outcome.trim()) return;
    
    if (editingOutcomeIndex !== null) {
      // Edit existing outcome
      const updatedOutcomes = [...outcomes];
      updatedOutcomes[editingOutcomeIndex] = outcome;
      setOutcomes(updatedOutcomes);
      updateNodeData(id, { ...data, greeting, outcomes: updatedOutcomes });
      setEditingOutcomeIndex(null);
    } else {
      // Add new outcome
      const updatedOutcomes = [...outcomes, outcome];
      setOutcomes(updatedOutcomes);
      updateNodeData(id, { ...data, greeting, outcomes: updatedOutcomes });
    }
    
    setCurrentOutcome('');
    setShowOutcomeInput(false);
  };

  const handleRemoveOutcome = (index: number) => {
    const updatedOutcomes = outcomes.filter((_, i) => i !== index);
    setOutcomes(updatedOutcomes);
    updateNodeData(id, { ...data, greeting, outcomes: updatedOutcomes });
  };

  const handleEditOutcome = (index: number) => {
    setCurrentOutcome(outcomes[index]);
    setEditingOutcomeIndex(index);
    setShowOutcomeInput(true);
  };

  const handleOutcomeInputCancel = () => {
    setShowOutcomeInput(false);
    setEditingOutcomeIndex(null);
    setCurrentOutcome('');
  };

  return (
    <NodeStatusIndicator hasConnection={hasConnection}>
      <div className="group relative">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 shadow-[0_8px_16px_-6px_rgba(96,165,250,0.5)] dark:shadow-[0_8px_16px_-6px_rgba(29,78,216,0.15)] p-5 min-w-[320px] transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_20px_40px_-12px_rgba(96,165,250,0.5)] dark:hover:shadow-[0_20px_40px_-12px_rgba(29,78,216,0.15)]">
          <div className="flex items-center gap-3 mb-3">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-blue-400 opacity-20" />
              <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
                <SmileIcon className="h-4 w-4" />
              </span>
            </span>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
              Agent Speaks
            </span>
          </div>
        
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <TipTapGreetingEditor 
              value={greeting} 
              onChange={handleGreetingChange} 
              placeholder="What does the agent say in this step?" 
            />
          </div>
          
          {outcomes.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Outcomes
              </h3>
              <div className="space-y-2">
                {outcomes.map((outcome, index) => (
                  <OutcomeListItem 
                    key={`${id}-outcome-${index}`}
                    outcome={outcome}
                    index={index}
                    onEdit={handleEditOutcome}
                    onRemove={handleRemoveOutcome}
                    sourceHandleId={`outcome-${index}`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {!showOutcomeInput ? (
            <button
              onClick={() => setShowOutcomeInput(true)}
              className="mt-4 flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              <span className="h-3.5 w-3.5 flex items-center justify-center">+</span>
              <span>Add Possible Outcome</span>
            </button>
          ) : (
            <div className="mt-4">
              <OutcomeInput 
                value={currentOutcome}
                onChange={setCurrentOutcome}
                onSave={() => handleAddOutcome(currentOutcome)}
                onCancel={handleOutcomeInputCancel} 
                isEditing={editingOutcomeIndex !== null}
              />
            </div>
          )}
        </div>
        
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-3 !h-3 !bg-blue-400 !rounded-full border-none"
        />
      </div>
    </NodeStatusIndicator>
  );
}

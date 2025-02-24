
import { createContext, useContext, useState, ReactNode } from 'react';

type DragContextType = ['greetingNode' | 'speakNode' | null, (type: 'greetingNode' | 'speakNode' | null) => void];

const DragContext = createContext<DragContextType>([null, () => {}]);

export function DragProvider({ children }: { children: ReactNode }) {
  const [nodeType, setNodeType] = useState<'greetingNode' | 'speakNode' | null>(null);

  return (
    <DragContext.Provider value={[nodeType, setNodeType]}>
      {children}
    </DragContext.Provider>
  );
}

export const useDrag = () => useContext(DragContext);

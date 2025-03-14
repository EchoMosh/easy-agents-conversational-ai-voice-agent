
import React from 'react';

export const NodeUpdateContext = React.createContext<{
  updateNodeData: (nodeId: string, data: any) => void;
}>({
  updateNodeData: () => {},
});

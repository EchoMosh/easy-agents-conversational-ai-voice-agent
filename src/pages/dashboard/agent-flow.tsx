
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Flow } from "@/components/flow/agent-flow/flow";
import { Header } from "@/components/flow/agent-flow/header";

const AgentFlowPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    // Simulate loading an agent
    const timer = setTimeout(() => {
      setAgent({
        id,
        name: "Sample Agent",
        description: "This is a sample agent",
        flow: {
          nodes: [],
          edges: []
        }
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      <Header agent={agent} />
      <Flow agent={agent} />
    </div>
  );
};

export default AgentFlowPage;

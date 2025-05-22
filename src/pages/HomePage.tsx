import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ReactFlowProvider, Node, Edge } from "@xyflow/react"; // Added Node and Edge
import { DragProvider } from "@/components/flow/drag-context";
import { Flow } from "@/components/flow/agent-flow/flow";
import { DemoFlowHeader } from "@/components/ui/demo-flow-header";
import { getDefaultFlow } from "@/components/agents/utils/default-flow";
import { EnhancedPlaceholdersAndVanishInput } from "@/components/ui/enhanced-input";
import { Cover } from "@/components/ui/cover";
import { Spotlight } from "@/components/ui/spotlight-new";
// SparklesCore and MultiStepLoader are removed as per the new requirement
import { FlowGenerationProgress } from '@/components/ui/FlowGenerationProgress'; // New import

// Placeholder icons (assuming they are still needed for other parts or future use)
const XIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
const LinkedInIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>;
const DiscordIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.369C18.271 3.5 16.097 3 13.805 3c-2.292 0-4.466.5-6.511 1.369C4.914 5.322 3.627 7.461 3.027 9.82c-.599 2.358-.599 4.803 0 7.161.6 2.359 1.887 4.498 4.261 5.451C9.339 23.5 11.512 24 13.805 24c2.292 0 4.466-.5 6.511-1.369 2.373-.953 3.66-3.092 4.26-5.451.6-2.358.6-4.803 0-7.161-.6-2.359-1.887-4.498-4.26-5.451zm-6.511 14.631c-1.104 0-2-.896-2-2s.896-2 2-2 2 .896 2 2-.896 2-2 2zm4-6c-1.104 0-2-.896-2-2s.896-2 2-2 2 .896 2 2-.896 2-2 2z"/></svg>;

const HomePage = () => {
  const [promptText, setPromptText] = useState('');
  const [showFlowEditor, setShowFlowEditor] = useState(false);
  const [mockAgent, setMockAgent] = useState<any>(null);

  // Memoize Spotlight unconditionally at the top level
  const memoizedSpotlight = useMemo(() => (
    <Spotlight
      className="-top-40 left-0 md:left-60 md:-top-20"
    />
  ), []);

  // States for progressive loading
  const [displayedNodes, setDisplayedNodes] = useState<Node[]>([]);
  const [displayedEdges, setDisplayedEdges] = useState<Edge[]>([]);
  const [isLoadingFlow, setIsLoadingFlow] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [totalLoadingSteps, setTotalLoadingSteps] = useState(0);
  const [lastAddedNodeId, setLastAddedNodeId] = useState<string | null>(null);
  
  const placeholders = [
    "Create an outbound AI agent for a solar panel company to call homeowners, introduce our new financing options, and schedule a free consultation if they're interested.",
    "Design an inbound AI receptionist for a dental clinic that answers calls, provides clinic hours, and helps patients book, reschedule, or cancel appointments.",
    "I need an AI agent for an e-commerce store to proactively call customers who abandoned their carts, offer a small discount, and help them complete their purchase.",
    "Develop an outbound AI survey agent to call recent customers of 'TechGadget Pro' to gather feedback on their product experience and overall satisfaction.",
    "Build an inbound AI support agent for a software company that can answer common FAQs, guide users through basic troubleshooting steps, and escalate complex issues to a human agent."
  ];

  const nodeTypeToMessage: Record<string, string> = {
    startNode: "Initializing Start Point...",
    greetingNode: "Crafting Initial Greeting...",
    endNode: "Defining Conversation End...",
    default: "Processing Flow Step..."
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    setPromptText(inputValue);
  };

  // Helper function to process the flow data
  const processFlow = (aiContent: any) => {
    const { agentInfo, flow } = aiContent;
    
    console.log("Processing flow:", { agentInfo, flow });
    
    setMockAgent({
      id: `ai-agent-${Date.now()}`,
      name: agentInfo.name || "AI Generated Agent",
      flow: flow, // The flow object (nodes and edges) from the webhook
      is_active: true,
      user_id: "ai-user",
      role: "sales_agent" as const, // Or derive from agentInfo if available
    });
    
    setTotalLoadingSteps(flow.nodes.length);
    // setLoadingMessage will be updated by the progressive loading useEffect
  };

  // Updated to receive value, callType, callObjective, language, file, and fileContent
  const handleSubmit = async (
    value: string, 
    callType: string, 
    callObjective?: string, 
    language?: string, 
    file?: File, 
    fileContent?: string
  ) => {
    console.log("Submit triggered with:", { value, callType, callObjective, language, fileName: file?.name, fileContentProvided: !!fileContent });

    const promptForWebhook = fileContent || value; // Prioritize file content, then typed value

    if (promptForWebhook.trim() || file) { // Proceed if there's a text prompt or a file to process
      setPromptText(promptForWebhook); // Show the text being used or a generic message for file
      if (file && !fileContent) {
        setPromptText(`Using uploaded file: ${file.name}`); // Indicate file usage if no text content
      }
      setShowFlowEditor(true);
      setIsLoadingFlow(true);
      setLoadingStep(0);
      setDisplayedNodes([]);
      setDisplayedEdges([]);
      setLoadingMessage("Generating AI call script..."); 

      // Prepare payload for webhook
      const payload: any = {
        prompt: promptForWebhook, // This will be text from textarea or text file
        callType: callType,
        callObjective: callObjective || 'custom',
        language: language || 'english-us',
      };

      // If it's an audio file (file present, but no fileContent), 
      // the current webhook might not support it directly via JSON.
      // For now, we'll log and send the filename as part of the prompt for context.
      // A more robust solution would use FormData for file uploads if the backend supports it.
      if (file && !fileContent) {
        payload.prompt = `Audio file uploaded: ${file.name}. Prompt from text area (if any): ${value}`;
        // Ideally, here you would use FormData if the endpoint supports multipart/form-data
        // For example:
        // const formData = new FormData();
        // formData.append('audioFile', file);
        // formData.append('callType', callType);
        // ... other fields ...
        // And then fetch with formData as body and appropriate headers.
        // This example assumes the webhook primarily expects a text prompt.
        console.warn("Audio file upload detected. Sending filename as part of prompt. Backend may need update for direct audio processing.");
      }


      try {
        const response = await fetch('https://moshi.app.n8n.cloud/webhook/new-flow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Webhook failed with status: ${response.status}`);
        }

        let responseData = await response.json();
        console.log("Webhook response:", responseData);

        // Check if we have a direct object or an array of objects
        if (Array.isArray(responseData)) {
          responseData = responseData[0];
        }

        // Handle the response structure correctly
        let aiContent;
        if (responseData.message?.content) {
          aiContent = responseData.message.content;
        } else if (responseData.content) {
          aiContent = responseData.content;
        } else {
          // Direct structure
          aiContent = responseData;
        }

        console.log("Extracted AI content:", aiContent);

        // Verify we have the required data
        if (!aiContent || !aiContent.agentInfo || !aiContent.flow) {
          console.error("Invalid data structure from webhook:", responseData);
          setLoadingMessage("Error: Received invalid data from AI. Wait for webhook to finish processing...");
          
          // Let's introduce a delay to wait for complete webhook processing
          setTimeout(async () => {
            try {
              // Try fetching the data again after a delay
              const retryResponse = await fetch('https://moshi.app.n8n.cloud/webhook/new-flow', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (!retryResponse.ok) {
                throw new Error(`Retry failed with status: ${retryResponse.status}`);
              }
              
              const retryData = await retryResponse.json();
              console.log("Retry webhook response:", retryData);
              
              // Try to extract the content again
              let retryContent;
              if (Array.isArray(retryData)) {
                retryContent = retryData[0]?.message?.content || retryData[0];
              } else {
                retryContent = retryData.message?.content || retryData;
              }
              
              if (!retryContent || !retryContent.agentInfo || !retryContent.flow) {
                throw new Error("Invalid retry data structure");
              }
              
              processFlow(retryContent);
            } catch (retryError) {
              console.error("Retry error:", retryError);
              setLoadingMessage("Error: Could not generate AI script after retry.");
              setIsLoadingFlow(false);
            }
          }, 5000); // Wait 5 seconds before retrying
          
          return;
        }
        
        // Process the flow data
        processFlow(aiContent);

      } catch (error) {
        console.error("Error calling webhook:", error);
        setLoadingMessage("Error: Could not generate AI script.");
        setIsLoadingFlow(false);
      }
    }
  };

  useEffect(() => {
    console.log(`useEffect triggered: isLoadingFlow=${isLoadingFlow}, loadingStep=${loadingStep}, mockAgent=${!!mockAgent}, totalLoadingSteps=${totalLoadingSteps}`);
    if (isLoadingFlow && mockAgent && loadingStep < totalLoadingSteps) {
      const timer = setTimeout(() => {
        const nextNodeToAdd = mockAgent.flow.nodes[loadingStep];
        console.log(`Step ${loadingStep}: Adding node`, nextNodeToAdd);
        if (nextNodeToAdd) {
          // Store the ID of this node as the last added one
          setLastAddedNodeId(nextNodeToAdd.id);
          
          setDisplayedNodes((prevNodes) => {
            const newNodesList = [...prevNodes, nextNodeToAdd];
            console.log(`Step ${loadingStep}: newNodesList`, newNodesList);
            
            const newNodesIds = new Set(newNodesList.map(n => n.id));
            const edgesToConsider = mockAgent.flow.edges.filter((edge: Edge) => 
              newNodesIds.has(edge.source) && newNodesIds.has(edge.target)
            );

            setDisplayedEdges((prevEdges) => {
              const currentEdgeIds = new Set(prevEdges.map(e => e.id));
              const uniqueNewEdges = edgesToConsider.filter(e => !currentEdgeIds.has(e.id));
              const newEdgesList = [...prevEdges, ...uniqueNewEdges];
              console.log(`Step ${loadingStep}: newEdgesList`, newEdgesList);
              return newEdgesList;
            });
            return newNodesList;
          });

          setLoadingMessage(nodeTypeToMessage[nextNodeToAdd.type] || nodeTypeToMessage.default);
          setLoadingStep((prevStep) => prevStep + 1);
        } else {
          console.error(`Step ${loadingStep}: nextNodeToAdd is undefined.`);
          setIsLoadingFlow(false);
          setLoadingMessage("Error: Flow definition issue.");
        }
      }, 750);

      return () => {
        console.log(`Step ${loadingStep}: Clearing timer`);
        clearTimeout(timer);
      };
    } else if (loadingStep >= totalLoadingSteps && totalLoadingSteps > 0 && isLoadingFlow) {
      console.log("All steps done. Flow generated.");
      setIsLoadingFlow(false);
      setLastAddedNodeId(null); // Reset when done
      setLoadingMessage("Flow generated!");
      setTimeout(() => setLoadingMessage(''), 2000);
    }
  }, [isLoadingFlow, loadingStep, mockAgent, totalLoadingSteps]);


  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white flex flex-col items-center selection:bg-blue-500 selection:text-white relative">
      {!showFlowEditor ? (
        // Homepage UI
        <>
          {memoizedSpotlight} {/* Render the memoized component */}
          <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between relative z-10">
            <div className="text-xl font-bold tracking-tight">EasyAgents</div>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-400 hover:text-white"><XIcon /></a>
              <a href="#" className="text-gray-400 hover:text-white"><LinkedInIcon /></a>
              <a href="#" className="text-gray-400 hover:text-white"><DiscordIcon /></a>
              <Link to="/auth" className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-md">Sign In</Link>
              <Link to="/auth?mode=signup" className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md">Get Started</Link>
            </div>
          </header>
          <main className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 md:py-24 relative z-10">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold max-w-5xl mx-auto text-center mt-6 relative z-20 py-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500 dark:from-white dark:via-neutral-100 dark:to-neutral-400">
                Create Ultra-Realistic AI Phone Agents 
              </span><Cover>in seconds</Cover>
            </h1>
            <div className="w-full max-w-5xl mx-auto flex justify-center mb-8 relative z-10">
              <EnhancedPlaceholdersAndVanishInput
                placeholders={placeholders}
                onChange={handleChange}
                onSubmit={handleSubmit}
              />
            </div>
          </main>
          <footer className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center md:text-left relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
              <div className="flex space-x-4 mb-2 md:mb-0">
                <a href="#" className="hover:text-gray-300">We're hiring ✨</a>
                <a href="#" className="hover:text-gray-300">Help Center</a>
                <a href="#" className="hover:text-gray-300">Pricing</a>
                <a href="#" className="hover:text-gray-300">Terms</a>
                <a href="#" className="hover:text-gray-300">Privacy</a>
              </div>
              <div className="flex items-center">
                <span className="mr-1">⚡️</span> StackBlitz
              </div>
            </div>
          </footer>
        </>
      ) : (
        // Agent Flow Editor UI
        <DragProvider>
          <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 overflow-hidden"
               style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
            {mockAgent && (
              <DemoFlowHeader
                agent={mockAgent}
                onBack={() => {
                  setShowFlowEditor(false);
                  setIsLoadingFlow(false); 
                  setDisplayedNodes([]);
                  setDisplayedEdges([]);
                  setMockAgent(null);
                  setLoadingStep(0);
                  setLoadingMessage('');
                  setTotalLoadingSteps(0);
                }}
              />
            )}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
              <ReactFlowProvider>
                {mockAgent && (
                  <Flow
                    nodes={displayedNodes}
                    edges={displayedEdges}
                    onNodesChange={() => {}}
                    onEdgesChange={() => {}}
                    creationMode="stable"
                    focusNodeId={lastAddedNodeId}
                  />
                )}
              </ReactFlowProvider>
              
              {isLoadingFlow && ( 
                <FlowGenerationProgress
                  currentStep={loadingStep}
                  totalSteps={totalLoadingSteps} // Pass actual totalLoadingSteps, FlowGenerationProgress should handle 0
                  message={loadingMessage}
                />
              )}
              
              {/* Removed the sign-up CTA banner */}
            </div>
          </div>
        </DragProvider>
      )}
    </div>
  );
};

export default HomePage;

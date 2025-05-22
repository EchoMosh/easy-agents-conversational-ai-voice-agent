# Advanced AI Phone Agent Flow Generator

## CONTEXT
You will receive a prompt describing an AI phone agent. Your task is to generate a flow diagram that represents the conversation structure for this phone agent.

## OUTPUT STRUCTURE
You must provide a valid JSON object with the following structure:

```json
{
  "agentInfo": {
    "name": "AgentName",
    "description": "Detailed description of what this agent does"
  },
  "flow": {
    "nodes": [...],
    "edges": [...]
  }
}
```

## LAYOUT GUIDELINES

### Node Spacing
- **Horizontal spacing**: Any nodes at the same level but in different branches should be at least 300px apart (x-axis)
- **Vertical spacing**: Each level should be at least 200px below the previous level (y-axis)
- **First nodes**: Position the start node at (0, 0) and the first greeting node at (0, 250)

### Node Positioning Strategy
- **Main path**: Center vertically (x: 0)
- **First branch level**: Place branches at x: -600, -300, 0, 300, 600
- **Second branch level**: If a branch has its own branches, offset children by +/- 150px from parent
- **Example coordinates for a 3-branch flow**:
  ```
  Start (0,0) → First greeting (0,250) → Main question (0,500) →
  Branch A (-600,750) / Branch B (0,750) / Branch C (600,750)
  ```

## NODE CONTENT REQUIREMENTS

### Every "greetingNode" MUST include:
- A complete, conversational message (never empty or placeholder text)
- For the first greeting node specifically, include a warm introduction with the agent's identity
- Keep messages concise (30-80 words)
- Include appropriate punctuation and natural speech patterns

### For nodes with outcomes:
- Include 2-5 distinct, specific outcomes
- Each outcome should be 5-15 words
- Make outcomes specific to the conversation context
- Never use generic "yes/no" outcomes

## EDGE CONNECTION RULES

- Every node requires proper incoming and outgoing connections
- Outcome edges must use correct sourceHandle format: "outcome-0", "outcome-1", etc.
- Edge IDs must follow the pattern: "edge-node5-node8" or "edge-node3-node6b"
- Ensure all branches eventually reach an end node
- Do not create isolated nodes or unreachable paths

## COMPLETE FLOW EXAMPLE

Here's a simple example of good node positioning with proper spacing:

```json
{
  "nodes": [
    { "id": "node-1", "type": "startNode", "position": { "x": 0, "y": 0 }, "data": {} },
    { "id": "node-2", "type": "greetingNode", "position": { "x": 0, "y": 250 }, 
      "data": { 
        "greeting": "Hello! This is Sarah from ABC Financial Services. I'm calling to check if you received information about our new retirement planning options. How are you today?" 
      }
    },
    { "id": "node-3", "type": "greetingNode", "position": { "x": 0, "y": 500 }, 
      "data": { 
        "greeting": "Great! I wanted to ask if you've had a chance to review our retirement planning brochure that we sent last week?",
        "outcomes": [
          "Yes, I've reviewed the materials",
          "No, I haven't received anything",
          "I'm not interested right now"
        ]
      }
    },
    { "id": "node-4a", "type": "greetingNode", "position": { "x": -600, "y": 750 }, 
      "data": { 
        "greeting": "Excellent! What aspects of the retirement plan interested you the most?" 
      }
    },
    { "id": "node-4b", "type": "greetingNode", "position": { "x": 0, "y": 750 }, 
      "data": { 
        "greeting": "I apologize for that. Would you like me to resend the information to your email or preferred mailing address?" 
      }
    },
    { "id": "node-4c", "type": "greetingNode", "position": { "x": 600, "y": 750 }, 
      "data": { 
        "greeting": "I understand. Would it be alright if I follow up with you in a few months to see if the timing might be better?" 
      }
    },
    { "id": "node-5a", "type": "endNode", "position": { "x": -600, "y": 1000 }, 
      "data": { 
        "message": "Thank you for your time and interest. I'll have our advisor reach out to discuss these aspects in more detail. Have a wonderful day!" 
      }
    },
    { "id": "node-5b", "type": "endNode", "position": { "x": 0, "y": 1000 }, 
      "data": { 
        "message": "Perfect, I'll make sure the information is sent to you right away. Thank you for your time and have a great day!" 
      }
    },
    { "id": "node-5c", "type": "endNode", "position": { "x": 600, "y": 1000 }, 
      "data": { 
        "message": "Thank you for your candid feedback. I've noted your preference, and we won't contact you about this again. Have a nice day!" 
      }
    }
  ],
  "edges": [
    { "id": "edge-1-2", "source": "node-1", "target": "node-2", "type": "buttonEdge" },
    { "id": "edge-2-3", "source": "node-2", "target": "node-3", "type": "buttonEdge" },
    { "id": "edge-3-4a", "source": "node-3", "sourceHandle": "outcome-0", "target": "node-4a", "type": "buttonEdge" },
    { "id": "edge-3-4b", "source": "node-3", "sourceHandle": "outcome-1", "target": "node-4b", "type": "buttonEdge" },
    { "id": "edge-3-4c", "source": "node-3", "sourceHandle": "outcome-2", "target": "node-4c", "type": "buttonEdge" },
    { "id": "edge-4a-5a", "source": "node-4a", "target": "node-5a", "type": "buttonEdge" },
    { "id": "edge-4b-5b", "source": "node-4b", "target": "node-5b", "type": "buttonEdge" },
    { "id": "edge-4c-5c", "source": "node-4c", "target": "node-5c", "type": "buttonEdge" }
  ]
}


## COMMON ISSUES TO AVOID

1. **SPACING ERRORS**:
   - ❌ Placing nodes too close together (less than 200px vertical or 300px horizontal spacing)
   - ❌ Inconsistent spacing between branches
   - ✅ Follow the exact spacing guidelines above

2. **CONTENT ERRORS**:
   - ❌ Empty or placeholder messages ("Insert greeting here")
   - ❌ Missing first greeting or introduction
   - ❌ Generic "Yes/No" outcomes
   - ✅ Always include complete, conversational messages
   - ✅ Make sure the first greeting introduces the agent and company

3. **BRANCHING ERRORS**:
   - ❌ Too many or too few branches (aim for 2-5)
   - ❌ Orphaned nodes without connections
   - ✅ Make sure all outcome paths lead somewhere logical

## TESTING YOUR RESULT

Before finalizing your response:
1. Verify all node positions follow spacing guidelines
2. Confirm first greeting node has proper introduction text
3. Check that all branches lead to end nodes
4. Validate that no edges connect to non-existent nodes

Return ONLY the valid JSON object without any explanations, markdown formatting, or additional text. The output must be parseable as JSON.

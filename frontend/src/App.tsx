import { useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];
const nodeTypes: NodeTypes = {
};

function App() {
  const [task, setTask] = useState('');
  const [codeContext, setCodeContext] = useState('');
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [loading, setLoading] = useState(false);
  
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const handleAddContext = async () => {
    if (!codeContext) return;
    await fetch('http://localhost:3001/api/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codeContext }),
    });
    alert('Context snippet added to Vector DB!');
    setCodeContext('');
  };

  const handleGeneratePlan = async () => {
    if (!task) {
      alert("Please enter a task description.");
      return;
    }
    setLoading(true);
    setNodes([]);
    setEdges([]);

    try {
      const response = await fetch('http://localhost:3001/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      const layoutedNodes = data.nodes?.map((node: any) => ({
        ...node,
        position: node.position || { x: Math.random() * 400, y: Math.random() * 400 },
      })) || [];

      setNodes(layoutedNodes);
      setEdges(data.edges || []);
    } catch (error) {
      console.error("Failed to generate plan:", error);
      alert("An error occurred while generating the plan. Check the console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="controls-panel">
        <h1>Dynamic Traycer AI</h1>
        <div className="group">
          <label>1. Add Code Context (Optional)</label>
          <textarea
            placeholder="Paste a relevant function, class, or component here..."
            rows={8}
            value={codeContext}
            onChange={(e) => setCodeContext(e.target.value)}
          />
          <button className="secondary" onClick={handleAddContext}>Add Context to DB</button>
        </div>
        <hr/>
        <div className="group">
          <label>2. Describe High-Level Task</label>
          <textarea
            placeholder="e.g., 'Implement a password reset feature'"
            rows={4}
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
          <button className="primary" onClick={handleGeneratePlan} disabled={loading}>
            {loading ? 'Generating Plan...' : 'Generate Plan'}
          </button>
        </div>
      </div>
      <div className="flow-panel">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;
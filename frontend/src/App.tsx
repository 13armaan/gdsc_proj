import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 100, y: 200 }, data: { label: 'Node 2' } },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white" style={{ width: '100vw', height: '100vh', display: 'flex', backgroundColor: 'white' }}>
      {/* Main Canvas Area */}
      <div className="flex-1 h-full relative" style={{ flex: 1, height: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Sidebar Panel */}
      <div className="w-80 h-full border-l border-gray-200 bg-gray-50 flex flex-col p-4 shadow-sm z-10 relative" style={{ width: '20rem', height: '100%', borderLeft: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <h1 className="text-xl font-bold text-gray-800 mb-4">Repomap Analyzer</h1>
        <p className="text-sm text-gray-600 mb-4">Scan and visualize your codebase architecture here.</p>
        
        {/* Placeholder for Scan controls */}
        <div className="mt-auto">
          <p className="text-xs text-gray-400">Settings and configuration will go here.</p>
        </div>
      </div>
    </div>
  );
}

export default App;

import { create } from 'zustand';
import { type Node, type Edge, applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from 'reactflow';
import axios from 'axios';
import { getLayoutedElements } from '../utils/layout';

export interface SummaryData {
  summary: string;
  loc?: number;
}

interface GraphStore {
  scanTarget: string;
  nodes: Node[];
  edges: Edge[];
  selectedNode: string | null;
  summaryData: SummaryData | null;
  isLoading: boolean;
  isSummaryLoading: boolean;
  scanError: string | null;

  setScanTarget: (path: string) => void;
  fetchGraph: () => Promise<void>;
  fetchSummary: (filePath: string) => Promise<void>;
  
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  scanTarget: '',
  nodes: [],
  edges: [],
  selectedNode: null,
  summaryData: null,
  isLoading: false,
  isSummaryLoading: false,
  scanError: null,

  setScanTarget: (path) => set({ scanTarget: path }),

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  fetchGraph: async () => {
    const { scanTarget } = get();
    if (!scanTarget) return;

    set({ isLoading: true, selectedNode: null, summaryData: null, scanError: null });
    try {
      const response = await axios.post('http://localhost:8000/api/scan', { target_path: scanTarget });
      
      // Transform raw backend edges/nodes if necessary. React Flow requires position, data, etc.
      // Assuming backend nodes are: { id, label, type }
      // Assuming backend edges are: { id, source, target }
      
      const formattedNodes: Node[] = response.data.nodes.map((n: any) => ({
        id: n.id,
        type: 'fileNode',
        data: { label: n.label },
        position: { x: 0, y: 0 } // initial position before layout
      }));
      
      const formattedEdges: Edge[] = response.data.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 }
      }));

      const layouted = getLayoutedElements(formattedNodes, formattedEdges, 'TB');
      
      set({ nodes: layouted.nodes, edges: layouted.edges, isLoading: false, scanError: null });
    } catch (error: any) {
      console.error('Error fetching graph:', error);
      set({ isLoading: false, scanError: error.message || 'Failed to connect to backend.' });
    }
  },

  fetchSummary: async (filePath) => {
    set({ selectedNode: filePath, isSummaryLoading: true, summaryData: null });
    try {
      const response = await axios.post('http://localhost:8000/api/summary', { file_path: filePath });
      set({ 
        summaryData: { 
          summary: response.data.summary, 
          loc: response.data.loc 
        }, 
        isSummaryLoading: false 
      });
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch summary.';
      set({ 
        summaryData: { summary: `Error: ${errorMessage}` }, 
        isSummaryLoading: false 
      });
    }
  }
}));

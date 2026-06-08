import { create } from 'zustand';
import { type Node, type Edge, applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange, MarkerType, type OnNodesChange, type OnEdgesChange } from 'reactflow';
import axios from 'axios';
import { getLayoutedElements } from '../utils/layout';

export interface SummaryData {
  summary: string;
  loc?: number;
}

interface GraphState {
  rawNodes: Node[];
  rawEdges: Edge[];
  nodes: Node[];
  edges: Edge[];
  collapsedFolders: Set<string>;
  scanTarget: string;
  selectedNode: string | null;
  summaryData: any | null;
  isLoading: boolean;
  isSummaryLoading: boolean;
  scanError: string | null;
  setScanTarget: (target: string) => void;
  fetchGraph: () => Promise<void>;
  toggleFolder: (folderId: string) => Promise<void>;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  fetchSummary: (nodeId: string) => Promise<void>;
  clearSelection: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  rawNodes: [],
  rawEdges: [],
  nodes: [],
  edges: [],
  collapsedFolders: new Set<string>(),
  scanTarget: '',
  selectedNode: null,
  summaryData: null,
  isLoading: false,
  isSummaryLoading: false,
  scanError: null,

  setScanTarget: (path) => set({ scanTarget: path }),
  clearSelection: () => set({ selectedNode: null, summaryData: null }),

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
    if (!scanTarget.trim()) return;

    try {
      set({ isLoading: true, scanError: null });
      const response = await axios.post('http://localhost:8000/api/scan', { target_path: scanTarget });
      
      const incomingNodes = response.data.nodes;
      const incomingEdges = response.data.edges;

      const folderMap = new Map<string, number>();
      incomingNodes.forEach((n: any) => {
        const lastSlash = Math.max(n.id.lastIndexOf('/'), n.id.lastIndexOf('\\'));
        const folder = lastSlash >= 0 ? n.id.substring(0, lastSlash) : 'root';
        folderMap.set(folder, (folderMap.get(folder) || 0) + 1);
      });

      const allNodes: Node[] = [];
      const allEdges: Edge[] = [];
      const defaultCollapsed = new Set<string>();

      folderMap.forEach((count, folderId) => {
        const id = `folder_${folderId}`;
        defaultCollapsed.add(id);
        allNodes.push({
          id,
          type: 'folder',
          data: { label: folderId.split(/[\/\\]/).pop() || 'root', fileCount: count, isCollapsed: true },
          position: { x: 0, y: 0 }
        });
      });

      incomingNodes.forEach((n: any) => {
        const lastSlash = Math.max(n.id.lastIndexOf('/'), n.id.lastIndexOf('\\'));
        const folder = lastSlash >= 0 ? n.id.substring(0, lastSlash) : 'root';
        const folderId = `folder_${folder}`;
        
        allNodes.push({
          id: n.id,
          type: 'file',
          data: { label: n.label, type: n.type, loc: n.loc },
          position: { x: 0, y: 0 }
        });

        allEdges.push({
          id: `struct_${folderId}_${n.id}`,
          source: folderId,
          target: n.id,
          type: 'default',
          style: { stroke: '#475569', strokeWidth: 1.5, strokeDasharray: '4 4' },
          animated: false
        });
      });

      incomingEdges.forEach((e: any) => {
        allEdges.push({
          id: `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          type: 'smoothstep', // Orthogonal edges
          animated: true,
          style: { stroke: '#475569', strokeWidth: 1.5, opacity: 0.6 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' }
        });
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(allNodes, allEdges, defaultCollapsed);
      
      set({ rawNodes: allNodes, rawEdges: allEdges, nodes: layoutedNodes, edges: layoutedEdges, collapsedFolders: defaultCollapsed, isLoading: false });
    } catch (error: any) {
      console.error("Error fetching graph:", error);
      set({ 
        scanError: error.response?.data?.detail || 'Failed to analyze repository. Please check the path and try again.',
        isLoading: false 
      });
    }
  },

  toggleFolder: async (folderId: string) => {
    const { collapsedFolders, rawNodes, rawEdges } = get();
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    
    const updatedRawNodes = rawNodes.map(n => {
      if (n.id === folderId) {
        return { ...n, data: { ...n.data, isCollapsed: newCollapsed.has(folderId) } };
      }
      return n;
    });
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(updatedRawNodes, rawEdges, newCollapsed);
    set({ collapsedFolders: newCollapsed, rawNodes: updatedRawNodes, nodes: layoutedNodes, edges: layoutedEdges });
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

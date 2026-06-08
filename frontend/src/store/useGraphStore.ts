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
  circularImports: string[][];
  unusedDependencies: string[];
  packageStats: Record<string, number>;
  layers: Record<string, string[]>;
  couplingMetrics: Record<string, { afferent: number, efferent: number, instability: number }>;
  violations: Array<{ type: string, layers: string[] }>;
  monolithicComponents: string[];
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
  expandAllFolders: () => Promise<void>;
  collapseAllFolders: () => Promise<void>;
  isAnalyticsOpen: boolean;
  highlightViolations: boolean;
  toggleAnalytics: () => void;
  toggleViolations: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  rawNodes: [],
  rawEdges: [],
  nodes: [],
  edges: [],
  circularImports: [],
  heavyNodes: {},
  unusedDependencies: [],
  packageStats: {},
  layers: {},
  couplingMetrics: {},
  violations: [],
  monolithicComponents: [],
  collapsedFolders: new Set<string>(),
  isAnalyticsOpen: false,
  highlightViolations: false,
  scanTarget: '',
  selectedNode: null,
  summaryData: null,
  isLoading: false,
  isSummaryLoading: false,
  scanError: null,

  toggleAnalytics: () => set((state) => ({ isAnalyticsOpen: !state.isAnalyticsOpen })),
  
  toggleViolations: () => {
    const { highlightViolations, edges, circularImports, layers, violations } = get();
    const nextHighlight = !highlightViolations;
    
    const isViolatingEdge = (e: Edge) => {
      const isCircular = circularImports.some(cycle => cycle.includes(e.source) && cycle.includes(e.target));
      if (isCircular) return true;
      
      let sourceLayer = '', targetLayer = '';
      Object.entries(layers).forEach(([layer, files]) => {
        if (files.includes(e.source)) sourceLayer = layer;
        if (files.includes(e.target)) targetLayer = layer;
      });
      
      if (sourceLayer && targetLayer && sourceLayer !== targetLayer) {
         return violations.some(v => v.layers.includes(sourceLayer) && v.layers.includes(targetLayer));
      }
      return false;
    };

    const updatedEdges = edges.map(e => {
      const sourceExt = e.source.split('.').pop()?.toLowerCase();
      const targetExt = e.target.split('.').pop()?.toLowerCase();
      const isCrossLanguage = sourceExt && targetExt && sourceExt !== targetExt;
      
      if (nextHighlight) {
        if (isViolatingEdge(e)) {
          return { ...e, style: { stroke: '#ef4444', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' } };
        } else {
          return { ...e, style: { stroke: '#475569', strokeWidth: 1.5, opacity: 0.1 }, markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(71, 85, 105, 0.1)' } };
        }
      } else {
        const isCircular = circularImports.some(cycle => cycle.includes(e.source) && cycle.includes(e.target));
        return { 
          ...e, 
          style: isCircular 
            ? { stroke: '#ef4444', strokeWidth: 3 }
            : (isCrossLanguage ? { stroke: '#475569', strokeWidth: 1.5, opacity: 0.8, strokeDasharray: '5,5' } : { stroke: '#475569', strokeWidth: 1.5, opacity: 0.6 }),
          markerEnd: { type: MarkerType.ArrowClosed, color: isCircular ? '#ef4444' : '#475569' }
        };
      }
    });
    
    set({ highlightViolations: nextHighlight, edges: updatedEdges });
  },

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
      const circularImports = response.data.circular_imports || [];
      const heavyNodes = response.data.heavy_nodes || {};
      const unusedDependencies = response.data.unused_dependencies || [];
      const packageStats = response.data.package_stats || {};
      const layers = response.data.layers || {};
      const couplingMetrics = response.data.coupling_metrics || {};
      const violations = response.data.violations || [];
      const monolithicComponents = response.data.monolithic_components || [];

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
          data: { label: n.label, type: n.type, loc: n.loc, heavyNodeCount: heavyNodes[n.id] || 0 },
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
        const sourceExt = e.source.split('.').pop()?.toLowerCase();
        const targetExt = e.target.split('.').pop()?.toLowerCase();
        const isCrossLanguage = sourceExt && targetExt && sourceExt !== targetExt;
        
        const isCircular = circularImports.some((cycle: string[]) => 
          cycle.includes(e.source) && cycle.includes(e.target)
        );

        allEdges.push({
          id: `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          type: 'smoothstep', // Orthogonal edges
          animated: true,
          style: isCircular 
            ? { stroke: '#ef4444', strokeWidth: 3 }
            : (isCrossLanguage ? { stroke: '#475569', strokeWidth: 1.5, opacity: 0.8, strokeDasharray: '5,5' } : { stroke: '#475569', strokeWidth: 1.5, opacity: 0.6 }),
          markerEnd: { type: MarkerType.ArrowClosed, color: isCircular ? '#ef4444' : '#475569' }
        });
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(allNodes, allEdges, defaultCollapsed);
      
      set({ 
        rawNodes: allNodes, 
        rawEdges: allEdges, 
        nodes: layoutedNodes, 
        edges: layoutedEdges, 
        circularImports,
        heavyNodes,
        unusedDependencies,
        packageStats,
        layers,
        couplingMetrics,
        violations,
        monolithicComponents,
        collapsedFolders: defaultCollapsed, 
        highlightViolations: false,
        isLoading: false 
      });
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

  expandAllFolders: async () => {
    const { rawNodes, rawEdges } = get();
    const newCollapsed = new Set<string>();
    
    const updatedRawNodes = rawNodes.map(n => {
      if (n.type === 'folder') {
        return { ...n, data: { ...n.data, isCollapsed: false } };
      }
      return n;
    });
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(updatedRawNodes, rawEdges, newCollapsed);
    set({ collapsedFolders: newCollapsed, rawNodes: updatedRawNodes, nodes: layoutedNodes, edges: layoutedEdges });
  },

  collapseAllFolders: async () => {
    const { rawNodes, rawEdges } = get();
    const newCollapsed = new Set<string>();
    
    const updatedRawNodes = rawNodes.map(n => {
      if (n.type === 'folder') {
        newCollapsed.add(n.id);
        return { ...n, data: { ...n.data, isCollapsed: true } };
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

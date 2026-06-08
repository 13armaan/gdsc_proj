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
  collapsedNodes: Set<string>;
  searchQuery: string;
  scanTarget: string;
  selectedNode: string | null;
  summaryData: any | null;
  statistics: any | null;
  isLoading: boolean;
  isSummaryLoading: boolean;
  scanError: string | null;
  currentViewMode: 'file' | 'folder' | 'module';
  graphs: {
    file: { nodes: Node[], edges: Edge[] } | null;
    folder: { nodes: Node[], edges: Edge[] } | null;
    module: { nodes: Node[], edges: Edge[] } | null;
  };
  setScanTarget: (target: string) => void;
  setSearchQuery: (query: string) => void;
  fetchGraph: () => Promise<void>;
  setViewMode: (mode: 'file' | 'folder' | 'module') => Promise<void>;
  toggleNodeCollapse: (nodeId: string) => Promise<void>;
  getVisibleElements: () => { visibleNodes: Node[], visibleEdges: Edge[] };
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  fetchSummary: (nodeId: string) => Promise<void>;
  resolveNodeCollisions: (draggedNodeId: string) => void;
  clearSelection: () => void;
  expandAllFolders: () => Promise<void>;
  collapseAllFolders: () => Promise<void>;
  isAnalyticsOpen: boolean;
  isStatsModalOpen: boolean;
  highlightViolations: boolean;
  toggleAnalytics: () => void;
  toggleStatsModal: () => void;
  toggleViolations: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  rawNodes: [],
  rawEdges: [],
  nodes: [],
  edges: [],
  circularImports: [],
  unusedDependencies: [],
  packageStats: {},
  layers: {},
  couplingMetrics: {},
  violations: [],
  monolithicComponents: [],
  collapsedNodes: new Set<string>(),
  searchQuery: '',
  currentViewMode: 'file',
  graphs: { file: null, folder: null, module: null },
  isAnalyticsOpen: false,
  isStatsModalOpen: false,
  highlightViolations: false,
  scanTarget: '',
  selectedNode: null,
  summaryData: null,
  statistics: null,
  isLoading: false,
  isSummaryLoading: false,
  scanError: null,

  toggleAnalytics: () => set((state) => ({ isAnalyticsOpen: !state.isAnalyticsOpen })),
  toggleStatsModal: () => set((state) => ({ isStatsModalOpen: !state.isStatsModalOpen })),
  
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

  resolveNodeCollisions: (draggedNodeId: string) => {
    const { nodes } = get();
    const PADDING = 30;
    
    let updatedNodes = [...nodes];
    let hasCollisions = true;
    let iterations = 0;
    const MAX_ITERATIONS = 5;
    
    while (hasCollisions && iterations < MAX_ITERATIONS) {
      hasCollisions = false;
      iterations++;
      
      for (let i = 0; i < updatedNodes.length; i++) {
        for (let j = i + 1; j < updatedNodes.length; j++) {
          const n1 = updatedNodes[i];
          const n2 = updatedNodes[j];
          
          if (n1.style?.opacity === 0 || n2.style?.opacity === 0) continue;
          
          const w1 = n1.width || (n1.type === 'folder' ? 256 : (n1.type === 'aggregated' ? 250 : 180));
          const h1 = n1.height || (n1.type === 'folder' ? 60 : (n1.type === 'aggregated' ? 75 : 40));
          const w2 = n2.width || (n2.type === 'folder' ? 256 : (n2.type === 'aggregated' ? 250 : 180));
          const h2 = n2.height || (n2.type === 'folder' ? 60 : (n2.type === 'aggregated' ? 75 : 40));
          
          const dx = (n2.position.x + w2/2) - (n1.position.x + w1/2);
          const dy = (n2.position.y + h2/2) - (n1.position.y + h1/2);
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          
          const minDx = (w1 + w2) / 2 + PADDING;
          const minDy = (h1 + h2) / 2 + PADDING;
          
          if (absDx < minDx && absDy < minDy) {
            hasCollisions = true;
            
            const overlapX = minDx - absDx;
            const overlapY = minDy - absDy;
            
            let pushX = dx === 0 ? (Math.random() > 0.5 ? 10 : -10) : (dx / absDx) * overlapX;
            let pushY = dy === 0 ? (Math.random() > 0.5 ? 10 : -10) : (dy / absDy) * overlapY;
            
            if (overlapX < overlapY) {
               pushY = 0;
            } else {
               pushX = 0;
            }
            
            if (n1.id === draggedNodeId) {
              updatedNodes[j] = { ...n2, position: { x: n2.position.x + pushX, y: n2.position.y + pushY } };
            } else if (n2.id === draggedNodeId) {
              updatedNodes[i] = { ...n1, position: { x: n1.position.x - pushX, y: n1.position.y - pushY } };
            } else {
              updatedNodes[i] = { ...n1, position: { x: n1.position.x - pushX/2, y: n1.position.y - pushY/2 } };
              updatedNodes[j] = { ...n2, position: { x: n2.position.x + pushX/2, y: n2.position.y + pushY/2 } };
            }
          }
        }
      }
    }
    
    if (iterations > 1) {
      set({ nodes: updatedNodes });
    }
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
      
      const incomingFileNodes = response.data.graphs.file.nodes;
      const incomingFileEdges = response.data.graphs.file.edges;
      const folderGraphRaw = response.data.graphs.folder;
      const moduleGraphRaw = response.data.graphs.module;
      const circularImports = response.data.circular_imports || [];
      const heavyNodes = response.data.heavy_nodes || {};
      const unusedDependencies = response.data.unused_dependencies || [];
      const packageStats = response.data.package_stats || {};
      const layers = response.data.layers || {};
      const couplingMetrics = response.data.coupling_metrics || {};
      const violations = response.data.violations || [];
      const monolithicComponents = response.data.monolithic_components || [];
      const statistics = response.data.statistics || null;

      const folderMap = new Map<string, number>();
      incomingFileNodes.forEach((n: any) => {
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

      incomingFileNodes.forEach((n: any) => {
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

      incomingFileEdges.forEach((e: any) => {
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
          type: 'import',
          animated: true,
          data: { statement: e.statement, weight: 1 },
          style: isCircular 
            ? { stroke: '#ef4444', strokeWidth: 3 }
            : (isCrossLanguage ? { stroke: '#475569', strokeWidth: 1.5, opacity: 0.8, strokeDasharray: '5,5' } : { stroke: '#475569', strokeWidth: 1.5, opacity: 0.6 }),
          markerEnd: { type: MarkerType.ArrowClosed, color: isCircular ? '#ef4444' : '#475569' }
        });
      });

      const formatAggregatedNodes = (rawNodes: any[], viewType: string): Node[] => rawNodes.map(n => ({
        id: n.id,
        type: 'aggregated',
        data: { label: n.label, viewType, loc: n.loc || 0 },
        position: { x: 0, y: 0 }
      }));

      const formatAggregatedEdges = (rawEdges: any[]): Edge[] => rawEdges.map(e => {
        const w = e.weight || 1;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'import',
          animated: true,
          data: { statement: e.statement, weight: w },
          style: { stroke: '#475569', opacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' }
        };
      });

      const parsedGraphs = {
        file: { nodes: allNodes, edges: allEdges },
        folder: { nodes: formatAggregatedNodes(folderGraphRaw.nodes, 'folder'), edges: formatAggregatedEdges(folderGraphRaw.edges) },
        module: { nodes: formatAggregatedNodes(moduleGraphRaw.nodes, 'module'), edges: formatAggregatedEdges(moduleGraphRaw.edges) }
      };

      const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(parsedGraphs.file.nodes, parsedGraphs.file.edges, defaultCollapsed);
      
      set({ 
        graphs: parsedGraphs,
        currentViewMode: 'file',
        rawNodes: parsedGraphs.file.nodes, 
        rawEdges: parsedGraphs.file.edges, 
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
        statistics,
        collapsedNodes: defaultCollapsed, 
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

  setViewMode: async (mode: 'file' | 'folder' | 'module') => {
    const { graphs, collapsedNodes } = get();
    const targetGraph = graphs[mode];
    if (!targetGraph) return;

    const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(
      targetGraph.nodes, 
      targetGraph.edges, 
      mode === 'file' ? collapsedNodes : new Set()
    );

    set({
      currentViewMode: mode,
      rawNodes: targetGraph.nodes,
      rawEdges: targetGraph.edges,
      nodes: layoutedNodes,
      edges: layoutedEdges
    });
  },

  toggleNodeCollapse: async (nodeId: string) => {
    const { collapsedNodes, rawNodes, rawEdges } = get();
    const newCollapsed = new Set(collapsedNodes);
    if (newCollapsed.has(nodeId)) {
      newCollapsed.delete(nodeId);
    } else {
      newCollapsed.add(nodeId);
    }
    
    const updatedRawNodes = rawNodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, data: { ...n.data, isCollapsed: newCollapsed.has(nodeId) } };
      }
      return n;
    });
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(updatedRawNodes, rawEdges, newCollapsed);
    set({ collapsedNodes: newCollapsed, rawNodes: updatedRawNodes, nodes: layoutedNodes, edges: layoutedEdges });
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  getVisibleElements: () => {
    const { nodes, edges, searchQuery, collapsedNodes } = get();
    
    // Process edges: Re-route to parent if connected to a child of a collapsed node
    // layout.ts already does this for us, but the user explicitly requested this to be computed here.
    // To strictly follow the requirement, we will filter the master nodes/edges natively.
    
    // First, find all hidden nodes based on collapsedNodes set
    const hiddenNodesMap = new Map<string, string>();
    nodes.forEach(n => {
      if (n.parentNode && collapsedNodes.has(n.parentNode)) {
        hiddenNodesMap.set(n.id, n.parentNode);
      } else {
        // Handle deeper nestings or folder structures where id might indicate parent
        let currentFolder = '';
        if (n.id.startsWith('folder_')) {
            // Already handled by layout, but we can respect it here
        }
      }
    });

    // Actually, since layout.ts already does the heavy lifting of spatial layout and mapping,
    // we can just strip out any node that has opacity: 0 (which means it's collapsed inside a folder)
    const visibleNodes = nodes.filter(n => n.style?.opacity !== 0).map(n => {
      if (!searchQuery.trim()) return n;
      const isMatch = n.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (n.data?.label && String(n.data.label).toLowerCase().includes(searchQuery.toLowerCase()));
      return isMatch ? n : { ...n, style: { ...n.style, opacity: 0.2 } };
    });

    // Filter edges: keep edges that connect to visible nodes
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

    return { visibleNodes, visibleEdges };
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
    set({ collapsedNodes: newCollapsed, rawNodes: updatedRawNodes, nodes: layoutedNodes, edges: layoutedEdges });
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
    set({ collapsedNodes: newCollapsed, rawNodes: updatedRawNodes, nodes: layoutedNodes, edges: layoutedEdges });
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

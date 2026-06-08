import ELK from 'elkjs/lib/elk.bundled.js';
import { type Node, type Edge } from 'reactflow';

const elk = new ELK();

const getFolderId = (nodeId: string) => {
  const lastSlash = Math.max(nodeId.lastIndexOf('/'), nodeId.lastIndexOf('\\'));
  const folder = lastSlash >= 0 ? nodeId.substring(0, lastSlash) : 'root';
  return `folder_${folder}`;
};

export const getLayoutedElements = async (
  nodes: Node[],
  edges: Edge[],
  collapsedNodes: Set<string>
): Promise<{ nodes: Node[], edges: Edge[] }> => {
  const visibleNodes: Node[] = [];
  const hiddenNodesMap = new Map<string, string>(); // nodeId -> parentFolderId

  nodes.forEach(n => {
    if (n.type === 'file') {
      const parentFolderId = getFolderId(n.id);
      if (collapsedNodes.has(parentFolderId)) {
        hiddenNodesMap.set(n.id, parentFolderId);
      } else {
        visibleNodes.push(n);
      }
    } else {
      visibleNodes.push(n); // folder nodes are always in the layout
    }
  });

  const visibleEdges: Edge[] = [];
  edges.forEach(e => {
    let source = e.source;
    let target = e.target;
    
    // Drop structural edges pointing to hidden children
    if (e.id.startsWith('struct_') && hiddenNodesMap.has(target)) return;

    if (hiddenNodesMap.has(source)) source = hiddenNodesMap.get(source)!;
    if (hiddenNodesMap.has(target)) target = hiddenNodesMap.get(target)!;

    if (source === target) return; // Drop self-loops

    visibleEdges.push({ ...e, source, target, id: `${source}-${target}-${e.id}` });
  });

  // Deduplicate edges
  const edgeSeen = new Set<string>();
  const finalEdges: Edge[] = [];
  visibleEdges.forEach(e => {
    const key = `${e.source}->${e.target}`;
    if (!edgeSeen.has(key)) {
      edgeSeen.add(key);
      finalEdges.push(e);
    }
  });

  const elkNodes = visibleNodes.map(n => ({
    id: n.id,
    width: n.type === 'folder' ? 256 : 180,
    height: n.type === 'folder' ? 60 : 40
  }));

  const elkEdges = finalEdges.map(e => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target]
  }));

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '20',
      'elk.layered.spacing.nodeNodeBetweenLayers': '50',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH'
    },
    children: elkNodes,
    edges: elkEdges
  };

  const layoutedGraph = await elk.layout(graph);
  
  const positionMap = new Map<string, { x: number, y: number }>();
  layoutedGraph.children?.forEach(n => {
    if (n.x !== undefined && n.y !== undefined) {
      positionMap.set(n.id, { x: n.x, y: n.y });
    }
  });

  const finalNodes = nodes.map(n => {
    const newNode = { ...n };
    if (hiddenNodesMap.has(n.id)) {
      const parentId = hiddenNodesMap.get(n.id)!;
      const parentPos = positionMap.get(parentId) || { x: 0, y: 0 };
      newNode.position = { x: parentPos.x + 110, y: parentPos.y + 35 }; // Center of folder node
      newNode.style = { ...newNode.style, opacity: 0, pointerEvents: 'none', zIndex: -1 };
    } else {
      const pos = positionMap.get(n.id) || { x: 0, y: 0 };
      newNode.position = pos;
      newNode.style = { ...newNode.style, opacity: 1, pointerEvents: 'auto', zIndex: n.type === 'folder' ? 10 : 20 };
    }
    return newNode;
  });

  return { nodes: finalNodes, edges: finalEdges };
};

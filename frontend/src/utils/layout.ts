import dagre from 'dagre';
import { type Node, type Edge } from 'reactflow';

const nodeWidth = 250;
const nodeHeight = 60;

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
): { nodes: Node[], edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  const connectedNodes: Node[] = [];
  const isolatedNodes: Node[] = [];
  
  const edgeSet = new Set<string>();
  edges.forEach(e => {
    edgeSet.add(e.source);
    edgeSet.add(e.target);
  });

  nodes.forEach(n => {
    if (edgeSet.has(n.id)) connectedNodes.push(n);
    else isolatedNodes.push(n);
  });

  // 1. Layout connected nodes using dagre
  connectedNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  let maxY = 0;
  const layoutedNodes = connectedNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };
    newNode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    maxY = Math.max(maxY, newNode.position.y + nodeHeight);
    return newNode;
  });

  // 2. Layout isolated nodes in folder clusters (circles)
  const folderGroups: Record<string, Node[]> = {};
  isolatedNodes.forEach(n => {
    const lastSlash = Math.max(n.id.lastIndexOf('/'), n.id.lastIndexOf('\\'));
    const folder = lastSlash >= 0 ? n.id.substring(0, lastSlash) : 'root';
    if (!folderGroups[folder]) folderGroups[folder] = [];
    folderGroups[folder].push(n);
  });

  let currentY = maxY > 0 ? maxY + 200 : 100;
  let currentX = 0;
  let rowMaxHeight = 0;
  const MAX_WIDTH = 1200; // Force clusters to wrap after this width

  Object.values(folderGroups).forEach(fNodes => {
    const count = fNodes.length;
    const cols = Math.ceil(Math.sqrt(count));
    const paddingX = 40;
    const paddingY = 40;

    const clusterWidth = cols * (nodeWidth + paddingX);
    const clusterHeight = Math.ceil(count / cols) * (nodeHeight + paddingY);

    // Wrap to the next row if this cluster exceeds MAX_WIDTH (and we aren't at the start of a row)
    if (currentX + clusterWidth > MAX_WIDTH && currentX > 0) {
      currentX = 0;
      currentY += rowMaxHeight + 80;
      rowMaxHeight = 0;
    }

    fNodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const newNode = { ...node };
      newNode.position = {
        x: currentX + col * (nodeWidth + paddingX),
        y: currentY + row * (nodeHeight + paddingY)
      };
      layoutedNodes.push(newNode);
    });

    currentX += clusterWidth + 80; // Horizontal gap between clusters
    rowMaxHeight = Math.max(rowMaxHeight, clusterHeight);
  });

  return { nodes: layoutedNodes, edges };
};

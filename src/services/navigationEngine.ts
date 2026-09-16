import { CampusNode, CampusEdge, RouteResult, NavigationStep } from '../types/campus';

export interface RouteOptions {
  accessibleOnly?: boolean;
}

export class NavigationEngine {
  private nodes: Map<string, CampusNode> = new Map();
  private edges: CampusEdge[] = [];
  private adjacencyList: Map<string, Array<{ toNode: string; edge: CampusEdge; distance: number }>> = new Map();

  constructor(nodes: CampusNode[] = [], edges: CampusEdge[] = []) {
    this.updateGraph(nodes, edges);
  }

  public updateGraph(nodes: CampusNode[], edges: CampusEdge[]) {
    this.nodes.clear();
    this.edges = edges;
    this.adjacencyList.clear();

    nodes.forEach(node => {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, []);
    });

    edges.forEach(edge => {
      if (!this.nodes.has(edge.fromNode) || !this.nodes.has(edge.toNode)) {
        return;
      }

      this.adjacencyList.get(edge.fromNode)?.push({
        toNode: edge.toNode,
        edge,
        distance: edge.distance,
      });

      if (edge.bidirectional !== false) {
        this.adjacencyList.get(edge.toNode)?.push({
          toNode: edge.fromNode,
          edge,
          distance: edge.distance,
        });
      }
    });
  }

  /**
   * Calculates the shortest route using Dijkstra's Algorithm
   */
  public findRoute(startNodeId: string, targetNodeId: string, options: RouteOptions = {}): RouteResult | null {
    const startNode = this.nodes.get(startNodeId);
    const targetNode = this.nodes.get(targetNodeId);

    if (!startNode || !targetNode) {
      return null;
    }

    if (startNodeId === targetNodeId) {
      return {
        path: [startNode],
        totalDistance: 0,
        estimatedMinutes: 0,
        steps: [
          {
            instruction: `You are already at ${startNode.name}.`,
            distance: 0,
            floor: startNode.floor,
            actionType: 'arrive',
            fromNodeName: startNode.name,
            toNodeName: startNode.name,
            nodeId: startNode.id,
          },
        ],
        accessible: true,
        startNode,
        endNode: targetNode,
        floorTransitions: [],
      };
    }

    const distances: Map<string, number> = new Map();
    const previous: Map<string, { nodeId: string; edge: CampusEdge } | null> = new Map();
    const visited: Set<string> = new Set();

    // Priority queue represented via array or min-set
    const unvisited: Set<string> = new Set();

    this.nodes.forEach((_, id) => {
      distances.set(id, Infinity);
      previous.set(id, null);
      unvisited.add(id);
    });

    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      // Find node in unvisited with min distance
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const id of unvisited) {
        const dist = distances.get(id) ?? Infinity;
        if (dist < minDistance) {
          minDistance = dist;
          currentId = id;
        }
      }

      if (!currentId || minDistance === Infinity) {
        break; // remaining unvisited nodes are unreachable
      }

      if (currentId === targetNodeId) {
        break; // found shortest path to target
      }

      unvisited.delete(currentId);
      visited.add(currentId);

      const neighbors = this.adjacencyList.get(currentId) || [];
      for (const neighbor of neighbors) {
        if (visited.has(neighbor.toNode)) continue;

        // Accessible mode checks
        if (options.accessibleOnly) {
          // If accessible route requested, filter out stairs or edges flagged accessible === false
          if (!neighbor.edge.accessible || neighbor.edge.type === 'stairs') {
            continue;
          }
        }

        // Accessibility penalty/bonus: if accessible mode is off, lifts might have slight wait time vs stairs
        let edgeCost = neighbor.distance;
        if (options.accessibleOnly && neighbor.edge.type === 'lift') {
          // Slightly favor lifts over long ramps if both exist
          edgeCost = neighbor.distance;
        }

        const alt = (distances.get(currentId) ?? 0) + edgeCost;
        if (alt < (distances.get(neighbor.toNode) ?? Infinity)) {
          distances.set(neighbor.toNode, alt);
          previous.set(neighbor.toNode, { nodeId: currentId, edge: neighbor.edge });
        }
      }
    }

    // Reconstruct path
    const path: CampusNode[] = [];
    const pathEdges: CampusEdge[] = [];
    let curr: string | null = targetNodeId;

    if (distances.get(targetNodeId) === Infinity) {
      return null; // No path found
    }

    while (curr) {
      const node = this.nodes.get(curr);
      if (node) {
        path.unshift(node);
      }
      const prev = previous.get(curr);
      if (prev) {
        pathEdges.unshift(prev.edge);
        curr = prev.nodeId;
      } else {
        curr = null;
      }
    }

    if (path.length === 0 || path[0].id !== startNodeId) {
      return null;
    }

    // Calculate total real distance
    const totalDistance = Math.round(distances.get(targetNodeId) ?? 0);
    // Walking time: 70 meters/min + 1 min per floor transition
    const floorTransitions: Array<{ fromFloor: number; toFloor: number; via: 'stairs' | 'lift' | 'ramp'; atNode: string }> = [];

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      const edge = pathEdges[i];
      if (from.floor !== to.floor) {
        floorTransitions.push({
          fromFloor: from.floor,
          toFloor: to.floor,
          via: edge.type === 'lift' ? 'lift' : edge.type === 'ramp' ? 'ramp' : 'stairs',
          atNode: from.name,
        });
      }
    }

    const estimatedMinutes = Math.max(1, Math.ceil(totalDistance / 70) + floorTransitions.length);

    // Build step-by-step turn-by-turn directions
    const steps: NavigationStep[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      const edge = pathEdges[i];

      let actionType: NavigationStep['actionType'] = 'straight';
      let instruction = '';

      if (from.floor !== to.floor) {
        if (edge.type === 'lift') {
          actionType = 'take_lift';
          instruction = `Take the elevator/lift from Floor ${from.floor} to Floor ${to.floor} at ${from.name} (${edge.distance}m)`;
        } else if (edge.type === 'ramp') {
          actionType = 'take_ramp';
          instruction = `Follow the accessible ramp to Floor ${to.floor} (${edge.distance}m)`;
        } else {
          actionType = 'take_stairs';
          instruction = `Take the staircase to Floor ${to.floor} towards ${to.name} (${edge.distance}m)`;
        }
      } else if (to.id === targetNodeId) {
        actionType = 'arrive';
        instruction = `Arrive at your destination: ${to.name} (${edge.distance}m)`;
      } else {
        // Compute direction heuristically
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          actionType = dx > 0 ? 'turn_right' : 'turn_left';
          instruction = `Turn ${dx > 0 ? 'right' : 'left'} along the ${edge.type === 'outdoor_path' ? 'walkway' : 'corridor'} towards ${to.name} (${edge.distance}m)`;
        } else {
          actionType = 'straight';
          instruction = `Continue straight along ${edge.type === 'outdoor_path' ? 'campus pathway' : 'hallway'} towards ${to.name} (${edge.distance}m)`;
        }
      }

      steps.push({
        instruction,
        distance: edge.distance,
        floor: from.floor,
        actionType,
        fromNodeName: from.name,
        toNodeName: to.name,
        nodeId: to.id,
      });
    }

    return {
      path,
      totalDistance,
      estimatedMinutes,
      steps,
      accessible: pathEdges.every(e => e.accessible && e.type !== 'stairs'),
      startNode,
      endNode: targetNode,
      floorTransitions,
    };
  }

  public getNodeById(id: string): CampusNode | undefined {
    return this.nodes.get(id);
  }

  public getNodeByQRCode(qrCode: string): CampusNode | undefined {
    for (const node of this.nodes.values()) {
      if (node.qrCode === qrCode || node.id === qrCode) {
        return node;
      }
    }
    return undefined;
  }

  public getAllNodes(): CampusNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): CampusEdge[] {
    return [...this.edges];
  }
}

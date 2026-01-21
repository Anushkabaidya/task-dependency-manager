import React, { useMemo } from 'react';

const DependencyVisualizer = ({ tasks }) => {
    // Layout Constants
    const NODE_RADIUS = 25;
    const LAYER_HEIGHT = 120;
    const NODE_SPACING = 100;

    // Status Colors
    const COLORS = {
        pending: '#9CA3AF',    // Gray-400
        in_progress: '#3B82F6', // Blue-500
        completed: '#10B981',   // Green-500
        blocked: '#EF4444'      // Red-500
    };

    const graph = useMemo(() => {
        if (!tasks.length) return { nodes: [], edges: [], maxX: 0, maxY: 0 };

        // 1. Build Adjacency List (Prerequisite -> Dependent) and Reverse (Dependent -> Prerequisites)
        const adj = {};      // ID -> [Dependent IDs]
        const revAdj = {};   // ID -> [Prerequisite IDs]
        const taskMap = {};

        tasks.forEach(t => {
            taskMap[t.id] = t;
            adj[t.id] = [];
            revAdj[t.id] = [];
        });

        tasks.forEach(t => {
            if (t.dependencies) {
                t.dependencies.forEach(depId => {
                    // t depends on depId. So flow is depId -> t
                    if (adj[depId]) adj[depId].push(t.id);
                    if (revAdj[t.id]) revAdj[t.id].push(depId);
                });
            }
        });

        // 2. Compute Levels (Longest Path in DAG)
        const level = {};
        const visited = new Set();

        // Memoized DFS for level
        const getLevel = (id) => {
            if (level[id] !== undefined) return level[id];

            // Level is 1 + max level of prerequisites
            const prerequisites = revAdj[id] || [];
            if (prerequisites.length === 0) {
                level[id] = 0;
                return 0;
            }

            let maxPrereqLevel = -1;
            prerequisites.forEach(pid => {
                const l = getLevel(pid);
                if (l > maxPrereqLevel) maxPrereqLevel = l;
            });

            level[id] = maxPrereqLevel + 1;
            return level[id];
        };

        tasks.forEach(t => getLevel(t.id));

        // 3. Group by Level and Assign Coordinates
        const levelGroups = {};
        Object.entries(level).forEach(([id, lvl]) => {
            if (!levelGroups[lvl]) levelGroups[lvl] = [];
            levelGroups[lvl].push(parseInt(id));
        });

        const nodes = [];
        const edges = [];
        let maxLvl = 0;
        let maxWidth = 0;

        Object.keys(levelGroups).sort((a, b) => a - b).forEach(lvl => {
            const group = levelGroups[lvl];
            maxLvl = Math.max(maxLvl, parseInt(lvl));
            const width = group.length * NODE_SPACING;
            maxWidth = Math.max(maxWidth, width);

            group.forEach((id, index) => {
                // Center the level
                const x = (index * NODE_SPACING) + (maxWidth - width) / 2 + 50;
                const y = parseInt(lvl) * LAYER_HEIGHT + 50;
                nodes.push({
                    id,
                    x,
                    y,
                    title: taskMap[id].title,
                    status: taskMap[id].status
                });
            });
        });

        // 4. Generate Edges
        const nodePos = {};
        nodes.forEach(n => nodePos[n.id] = { x: n.x, y: n.y });

        tasks.forEach(t => {
            if (t.dependencies) {
                t.dependencies.forEach(depId => {
                    // Arrow from Prerequisite (depId) -> Dependent (t.id)
                    if (nodePos[depId] && nodePos[t.id]) {
                        edges.push({
                            source: nodePos[depId],
                            target: nodePos[t.id],
                            key: `${depId}-${t.id}`
                        });
                    }
                });
            }
        });

        return {
            nodes,
            edges,
            width: maxWidth + 100,
            height: (maxLvl + 1) * LAYER_HEIGHT + 100
        };

    }, [tasks]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 overflow-x-auto">
            <h3 className="font-semibold text-gray-700 mb-4">Dependency Graph</h3>
            <svg width={graph.width} height={graph.height} className="mx-auto">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7"
                        refX="24" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
                    </marker>
                </defs>

                {/* Edges */}
                {graph.edges.map(e => (
                    <line
                        key={e.key}
                        x1={e.source.x} y1={e.source.y}
                        x2={e.target.x} y2={e.target.y}
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                    />
                ))}

                {/* Nodes */}
                {graph.nodes.map(n => (
                    <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                        <circle
                            r={NODE_RADIUS}
                            fill={COLORS[n.status] || COLORS.pending}
                            stroke="white"
                            strokeWidth="2"
                            className="shadow-sm"
                        />
                        <text
                            y="0"
                            dy="5"
                            textAnchor="middle"
                            fill="white"
                            fontSize="12"
                            fontWeight="bold"
                            pointerEvents="none"
                        >
                            {n.id}
                        </text>
                        <text
                            y={NODE_RADIUS + 15}
                            textAnchor="middle"
                            className="text-xs fill-gray-600 font-medium"
                        >
                            {n.title.length > 10 ? n.title.substring(0, 8) + '..' : n.title}
                        </text>
                    </g>
                ))}
            </svg>
            <div className="flex gap-4 justify-center mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400"></span> Pending</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> In Progress</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Completed</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Blocked</div>
            </div>
        </div>
    );
};

export default DependencyVisualizer;

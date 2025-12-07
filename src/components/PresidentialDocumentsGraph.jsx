import { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { parsePresidentialDocuments } from '../utils/parseDocuments';
import './PresidentialDocumentsGraph.css';

const RELATIONSHIP_COLORS = {
  revoked_by: '#ff4444',
  revokes: '#ff6666',
  amends: '#44aa44',
  see: '#4488ff',
  supersedes: '#ffaa44',
  continued_by: '#aa44ff',
  reinstated_by: '#44ffaa'
};

const RELATIONSHIP_LABELS = {
  revoked_by: 'Revoked By',
  revokes: 'Revokes',
  amends: 'Amends',
  see: 'See',
  supersedes: 'Supersedes',
  continued_by: 'Continued By',
  reinstated_by: 'Reinstated By'
};

export default function PresidentialDocumentsGraph({ initialData }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [layoutMode, setLayoutMode] = useState('centrality');
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const fg2DRef = useRef();
  const fg3DRef = useRef();

  // Calculate node centrality
  const calculateCentrality = useCallback((node, links) => {
    return links.filter(
      (link) => link.source === node.id || link.target === node.id
    ).length;
  }, []);

  // Initialize node positions
  const initializeNodePositions = useCallback((data, mode) => {
    const nodes = data.nodes.map(node => ({ ...node }));
    const links = data.links.map(link => ({ ...link }));

    if (mode === 'centrality') {
      // Calculate centrality
      nodes.forEach(node => {
        node.centrality = calculateCentrality(node, links);
      });

      // Sort by centrality
      nodes.sort((a, b) => b.centrality - a.centrality);

      // Position nodes in a circle
      const maxCentrality = Math.max(...nodes.map(n => n.centrality), 1);
      nodes.forEach((node, i) => {
        const normalizedCentrality = node.centrality / maxCentrality;
        const radius = 100 + (1 - normalizedCentrality) * 300;
        const angle = (i * 2 * Math.PI) / nodes.length;
        node.x = Math.cos(angle) * radius;
        node.y = Math.sin(angle) * radius;
        // Add z coordinate for 3D view
        const height = (i / nodes.length) * 200 - 100;
        node.z = height;
      });
    }

    return { nodes, links };
  }, [calculateCentrality]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = initialData || await parsePresidentialDocuments();
        const organizedData = initializeNodePositions(data, layoutMode);
        setGraphData(organizedData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, [initialData, layoutMode, initializeNodePositions]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDrag = useCallback((node) => {
    // Pin node at dragged position
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  const handleNodeDragEnd = useCallback((node) => {
    // Keep node pinned at final position
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  // Initialize and update 3D graph
  // Note: The 3D graph uses the '3d-force-graph' npm package (dynamically imported)
  useEffect(() => {
    if (viewMode !== '3d' || !fg3DRef.current || graphData.nodes.length === 0) return;

    const container = fg3DRef.current;
    
    // Dynamically import 3d-force-graph npm package to avoid initialization issues
    if (!container._graph) {
      import('3d-force-graph').then((module) => {
        const ForceGraph3D = module.default;
        const graphInstance = ForceGraph3D()(container)
          .nodeLabel((node) => `
            <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; max-width: 300px;">
              <strong>${node.label}</strong><br/>
              ${node.title}<br/>
              ${node.signingDate ? `Signed: ${node.signingDate}` : ''}
            </div>
          `)
          .nodeColor((node) => {
            if (node === selectedNode) return '#ffd700';
            if (highlightedNodes.has(node.id)) return '#ff6b6b';
            if (layoutMode === 'centrality' && node.centrality !== undefined) {
              const maxCentrality = Math.max(...graphData.nodes.map(n => n.centrality || 0));
              const intensity = node.centrality / Math.max(maxCentrality, 1);
              const r = Math.floor(74 + intensity * 180);
              const g = Math.floor(144 + intensity * 110);
              const b = Math.floor(226 - intensity * 30);
              return `rgb(${r}, ${g}, ${b})`;
            }
            return '#4a90e2';
          })
          .nodeVal((node) => {
            const connections = graphData.links.filter(
              (link) => link.source === node.id || link.target === node.id
            ).length;
            let baseSize = Math.max(5, Math.min(15, 5 + connections * 0.3));
            if (highlightedNodes.has(node.id)) {
              baseSize *= 1.3;
            }
            return baseSize;
          })
          .linkColor((link) => RELATIONSHIP_COLORS[link.type] || '#999')
          .linkWidth(1.5)
          .linkDirectionalArrowLength(6)
          .linkDirectionalArrowRelPos(1)
          .linkCurvature(0.1)
          .onNodeClick(handleNodeClick)
          .onNodeDrag(handleNodeDrag)
          .onNodeDragEnd(handleNodeDragEnd)
          .cooldownTicks(100);
        
        container._graph = graphInstance;
        graphInstance.graphData(graphData);
      }).catch((err) => {
        console.error('Error loading 3D graph:', err);
      });
    } else {
      // Update graph data if already initialized
      container._graph.graphData(graphData);
    }

    // Cleanup
    return () => {
      if (container._graph && viewMode !== '3d') {
        container._graph._destructor?.();
        container._graph = null;
      }
    };
  }, [viewMode, graphData, selectedNode, highlightedNodes, layoutMode, handleNodeClick, handleNodeDrag, handleNodeDragEnd]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHighlightedNodes(new Set());
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = graphData.nodes.filter(node => {
      // Search by number (EO 12345 or just 12345)
      const eoNumber = node.id.toString();
      const eoLabel = node.label?.toLowerCase() || '';
      
      // Search by title/content
      const title = node.title?.toLowerCase() || '';
      const signingDate = node.signingDate?.toLowerCase() || '';
      const citation = node.citation?.toLowerCase() || '';
      
      // Check if query matches number
      if (eoNumber.includes(query) || eoLabel.includes(query)) {
        return true;
      }
      
      // Check if query matches any text content
      if (title.includes(query) || 
          signingDate.includes(query) || 
          citation.includes(query)) {
        return true;
      }
      
      return false;
    });

    setSearchResults(results);
    setHighlightedNodes(new Set(results.map(n => n.id)));
  }, [searchQuery, graphData.nodes]);

  const handleSearchSelect = useCallback((node) => {
    setSelectedNode(node);
    // Center on the node
    if (viewMode === '3d' && fg3DRef.current?._graph && node.x !== undefined && node.y !== undefined) {
      const distance = 200;
      fg3DRef.current._graph.cameraPosition(
        { x: node.x + distance, y: node.y + distance, z: (node.z || 0) + distance },
        { x: node.x, y: node.y, z: node.z || 0 },
        2000
      );
    } else if (viewMode === '2d' && fg2DRef.current && node.x !== undefined && node.y !== undefined) {
      fg2DRef.current.centerAt(node.x, node.y, 1000);
      fg2DRef.current.zoom(2, 1000);
    }
  }, [viewMode]);

  if (loading) {
    return (
      <div className="graph-container">
        <div className="loading">Loading presidential documents graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="graph-container">
        <div className="error">Error loading graph: {error}</div>
      </div>
    );
  }

  if (!graphData || !graphData.nodes || !graphData.nodes.length) {
    return (
      <div className="graph-container">
        <div className="loading">No data available.</div>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h1>Presidential Documents Graph</h1>
        <p className="graph-stats">
          {graphData.nodes.length} Executive Orders • {graphData.links.length} Relationships
        </p>
      </div>

      <div className="search-container" style={{ 
        padding: '10px 20px', 
        background: 'white', 
        borderBottom: '1px solid #e0e0e0',
        position: 'relative'
      }}>
        <input
          type="text"
          placeholder="Search by number (e.g., EO 12345) or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 15px',
            fontSize: '14px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4a90e2'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '20px',
            right: '20px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '5px'
          }}>
            <div style={{ padding: '5px 10px', fontSize: '12px', color: '#666', borderBottom: '1px solid #eee' }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </div>
            {searchResults.slice(0, 10).map(node => (
              <div
                key={node.id}
                onClick={() => handleSearchSelect(node)}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                <div style={{ fontWeight: 'bold', color: '#4a90e2' }}>{node.label}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                  {node.title?.substring(0, 60)}{node.title?.length > 60 ? '...' : ''}
                </div>
                {node.signingDate && (
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                    {node.signingDate}
                  </div>
                )}
              </div>
            ))}
            {searchResults.length > 10 && (
              <div style={{ padding: '10px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                Showing first 10 of {searchResults.length} results
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', padding: '0 20px' }}>
        <button
          onClick={() => setViewMode('2d')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            background: viewMode === '2d' ? '#4a90e2' : 'white',
            color: viewMode === '2d' ? 'white' : '#333',
            cursor: 'pointer',
            fontWeight: viewMode === '2d' ? 'bold' : 'normal'
          }}
        >
          2D View
        </button>
        <button
          onClick={() => setViewMode('3d')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            background: viewMode === '3d' ? '#4a90e2' : 'white',
            color: viewMode === '3d' ? 'white' : '#333',
            cursor: 'pointer',
            fontWeight: viewMode === '3d' ? 'bold' : 'normal'
          }}
        >
          3D View
        </button>
      </div>

      {viewMode === '2d' ? (
        <div className="graph-wrapper">
          <ForceGraph2D
            ref={fg2DRef}
            graphData={graphData}
            nodeLabel={(node) => `
              <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; max-width: 300px;">
                <strong>${node.label}</strong><br/>
                ${node.title}<br/>
                ${node.signingDate ? `Signed: ${node.signingDate}` : ''}
              </div>
            `}
            nodeColor={(node) => {
              if (node === selectedNode) return '#ffd700';
              if (highlightedNodes.has(node.id)) return '#ff6b6b';
              if (layoutMode === 'centrality' && node.centrality !== undefined) {
                const maxCentrality = Math.max(...graphData.nodes.map(n => n.centrality || 0));
                const intensity = node.centrality / Math.max(maxCentrality, 1);
                const r = Math.floor(74 + intensity * 180);
                const g = Math.floor(144 + intensity * 110);
                const b = Math.floor(226 - intensity * 30);
                return `rgb(${r}, ${g}, ${b})`;
              }
              return '#4a90e2';
            }}
            nodeVal={(node) => {
              const connections = graphData.links.filter(
                (link) => link.source === node.id || link.target === node.id
              ).length;
              let baseSize = Math.max(5, Math.min(15, 5 + connections * 0.3));
              if (highlightedNodes.has(node.id)) {
                baseSize *= 1.3;
              }
              return baseSize;
            }}
            linkColor={(link) => RELATIONSHIP_COLORS[link.type] || '#999'}
            linkWidth={1.5}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.1}
            onNodeClick={handleNodeClick}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            cooldownTicks={100}
          />
        </div>
      ) : (
        <div className="graph-wrapper" ref={fg3DRef} style={{ width: '100%', height: '100%' }} />
      )}

      <div className="layout-controls">
        <h4>Layout Mode</h4>
        <div className="control-buttons">
          <button 
            className={layoutMode === 'centrality' ? 'active' : ''}
            onClick={() => setLayoutMode('centrality')}
          >
            By Centrality
          </button>
          <button 
            className={layoutMode === 'date' ? 'active' : ''}
            onClick={() => setLayoutMode('date')}
          >
            By Date
          </button>
        </div>
      </div>

      {selectedNode && (
        <div className="node-details">
          <h3>{selectedNode.label}</h3>
          <p><strong>Title:</strong> {selectedNode.title}</p>
          {selectedNode.signingDate && (
            <p><strong>Signed:</strong> {selectedNode.signingDate}</p>
          )}
          {selectedNode.htmlUrl && (
            <p>
              <a href={selectedNode.htmlUrl} target="_blank" rel="noopener noreferrer">
                View on Federal Register
              </a>
            </p>
          )}
          <button onClick={() => setSelectedNode(null)}>Close</button>
        </div>
      )}

      <div className="legend">
        <h4>Relationship Types</h4>
        <div className="legend-items">
          {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
            <div key={type} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: color }}></span>
              <span>{RELATIONSHIP_LABELS[type]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

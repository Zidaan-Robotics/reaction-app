import { useMemo } from 'react';
import './DataAnalysis.css';

export default function DataAnalysis({ graphData }) {
  const analysis = useMemo(() => {
    if (!graphData || !graphData.nodes || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
      return null;
    }

    const { nodes, links } = graphData;

    // Basic statistics
    const totalDocuments = nodes.length;
    const totalRelationships = links.length;
    const isolatedNodes = nodes.filter(node => {
      return !links.some(link => link.source === node.id || link.target === node.id);
    }).length;
    const connectedNodes = totalDocuments - isolatedNodes;

    // Relationship type breakdown
    const relationshipCounts = {};
    links.forEach(link => {
      relationshipCounts[link.type] = (relationshipCounts[link.type] || 0) + 1;
    });

    // Calculate centrality for each node
    const nodeCentrality = nodes.map(node => {
      const connections = links.filter(
        link => link.source === node.id || link.target === node.id
      ).length;
      return { node, connections };
    });

    // Most connected documents
    const mostConnected = [...nodeCentrality]
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    // Date analysis
    const dates = nodes
      .map(n => {
        if (!n.signingDate) return null;
        const date = new Date(n.signingDate);
        return isNaN(date.getTime()) ? null : date;
      })
      .filter(d => d !== null);

    let dateRange = null;
    let averageYear = null;
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      dateRange = {
        earliest: minDate,
        latest: maxDate,
        span: Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24 * 365.25)) // years
      };
      
      const totalYears = dates.reduce((sum, date) => sum + date.getFullYear(), 0);
      averageYear = Math.round(totalYears / dates.length);
    }

    // Network density
    const possibleConnections = (totalDocuments * (totalDocuments - 1)) / 2;
    const networkDensity = possibleConnections > 0 
      ? (totalRelationships / possibleConnections).toFixed(4) 
      : 0;

    // Relationship direction analysis
    const outgoingLinks = links.filter(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      return sourceNode;
    }).length;

    const incomingLinks = links.filter(link => {
      const targetNode = nodes.find(n => n.id === link.target);
      return targetNode;
    }).length;

    // Average connections per node
    const avgConnections = connectedNodes > 0 
      ? (totalRelationships * 2 / totalDocuments).toFixed(2) 
      : 0;

    return {
      totalDocuments,
      totalRelationships,
      isolatedNodes,
      connectedNodes,
      relationshipCounts,
      mostConnected,
      dateRange,
      averageYear,
      networkDensity,
      outgoingLinks,
      incomingLinks,
      avgConnections
    };
  }, [graphData]);

  if (!analysis) {
    return (
      <div className="data-analysis">
        <div className="analysis-loading">Loading analysis...</div>
      </div>
    );
  }

  const relationshipLabels = {
    revoked_by: 'Revoked By',
    revokes: 'Revokes',
    amends: 'Amends',
    see: 'See',
    supersedes: 'Supersedes',
    continued_by: 'Continued By',
    reinstated_by: 'Reinstated By'
  };

  return (
    <div className="data-analysis">
      <div className="analysis-header">
        <h2>Data Analysis & Insights</h2>
        <p className="analysis-subtitle">
          Understanding the structure and patterns in presidential documents
        </p>
      </div>

      <div className="analysis-content">
        <section className="analysis-section">
          <h3>Overview Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{analysis.totalDocuments}</div>
              <div className="stat-label">Total Executive Orders</div>
              <div className="stat-explanation">
                The total number of executive orders in the dataset. Each order represents a presidential directive with legal force.
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analysis.totalRelationships}</div>
              <div className="stat-label">Total Relationships</div>
              <div className="stat-explanation">
                The number of connections between executive orders, showing how documents reference, modify, or relate to each other.
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analysis.connectedNodes}</div>
              <div className="stat-label">Connected Documents</div>
              <div className="stat-explanation">
                Documents that have at least one relationship with another document. Higher connectivity indicates more interconnected policy areas.
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analysis.isolatedNodes}</div>
              <div className="stat-label">Isolated Documents</div>
              <div className="stat-explanation">
                Documents with no relationships to others. These may represent standalone policies or documents with incomplete relationship data.
              </div>
            </div>
          </div>
        </section>

        <section className="analysis-section">
          <h3>Network Characteristics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{analysis.networkDensity}</div>
              <div className="stat-label">Network Density</div>
              <div className="stat-explanation">
                The ratio of actual connections to possible connections. A value closer to 1 indicates a highly interconnected network, while values closer to 0 suggest a sparse network with isolated clusters.
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analysis.avgConnections}</div>
              <div className="stat-label">Avg Connections per Document</div>
              <div className="stat-explanation">
                The average number of relationships each document has. Higher values indicate documents that frequently reference or are referenced by others.
              </div>
            </div>
          </div>
        </section>

        <section className="analysis-section">
          <h3>Relationship Types Breakdown</h3>
          <p className="section-explanation">
            Different types of relationships show how executive orders interact with each other. Understanding these patterns reveals the evolution and structure of presidential policy.
          </p>
          <div className="relationship-breakdown">
            {Object.entries(analysis.relationshipCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="relationship-item">
                  <div className="relationship-header">
                    <span className="relationship-name">
                      {relationshipLabels[type] || type}
                    </span>
                    <span className="relationship-count">{count}</span>
                  </div>
                  <div className="relationship-bar">
                    <div 
                      className="relationship-bar-fill"
                      style={{ 
                        width: `${(count / analysis.totalRelationships) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="relationship-percentage">
                    {((count / analysis.totalRelationships) * 100).toFixed(1)}% of all relationships
                  </div>
                </div>
              ))}
          </div>
        </section>

        <section className="analysis-section">
          <h3>Most Connected Documents</h3>
          <p className="section-explanation">
            These executive orders have the most relationships with other documents. They often represent key policy hubs or documents that have been frequently amended, revoked, or referenced.
          </p>
          <div className="connected-documents">
            {analysis.mostConnected.map((item, index) => (
              <div key={item.node.id} className="connected-doc-item">
                <div className="doc-rank">#{index + 1}</div>
                <div className="doc-info">
                  <div className="doc-label">{item.node.label}</div>
                  <div className="doc-title">{item.node.title}</div>
                  {item.node.signingDate && (
                    <div className="doc-date">Signed: {item.node.signingDate}</div>
                  )}
                </div>
                <div className="doc-connections">
                  <span className="connections-value">{item.connections}</span>
                  <span className="connections-label">connections</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {analysis.dateRange && (
          <section className="analysis-section">
            <h3>Temporal Analysis</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">
                  {analysis.dateRange.earliest.toLocaleDateString()}
                </div>
                <div className="stat-label">Earliest Document</div>
                <div className="stat-explanation">
                  The date of the oldest executive order in the dataset.
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {analysis.dateRange.latest.toLocaleDateString()}
                </div>
                <div className="stat-label">Latest Document</div>
                <div className="stat-explanation">
                  The date of the most recent executive order in the dataset.
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analysis.dateRange.span}</div>
                <div className="stat-label">Time Span (Years)</div>
                <div className="stat-explanation">
                  The total time period covered by the documents in the dataset.
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analysis.averageYear}</div>
                <div className="stat-label">Average Year</div>
                <div className="stat-explanation">
                  The average year of all documents, providing insight into when most activity occurred.
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="analysis-section">
          <h3>What This Data Means</h3>
          <div className="insights">
            <div className="insight-item">
              <h4>Policy Evolution</h4>
              <p>
                The relationships between executive orders reveal how presidential policies evolve over time. 
                Documents that "amend" or "supersede" others show policy refinement, while "revokes" relationships 
                indicate policy reversals or updates.
              </p>
            </div>
            <div className="insight-item">
              <h4>Network Structure</h4>
              <p>
                The network density and connection patterns show whether executive orders form isolated clusters 
                (topic-specific policies) or a highly interconnected web (overlapping policy areas). Documents 
                with many connections are often foundational policies that many others build upon.
              </p>
            </div>
            <div className="insight-item">
              <h4>Administrative Continuity</h4>
              <p>
                Relationships like "continued by" and "reinstated by" show how policies persist across 
                administrations. The presence of many such relationships indicates policy continuity, while 
                many "revokes" relationships might indicate significant policy changes between administrations.
              </p>
            </div>
            <div className="insight-item">
              <h4>Document Interdependence</h4>
              <p>
                The high number of relationships suggests that executive orders are not created in isolation. 
                They frequently reference, modify, or build upon previous orders, creating a complex web of 
                interdependent policies that shape the executive branch's legal framework.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


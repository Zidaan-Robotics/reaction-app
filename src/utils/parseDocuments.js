import Papa from 'papaparse';

/**
 * Parse disposition notes to extract relationships
 * Examples:
 * - "Revoked by: EO 13811, September 29, 2017"
 * - "Amends: EO 13597, January 19, 2012"
 * - "See: EO 14024, April 15, 2021; EO 14039, August 20, 2021"
 * - "Supersedes: EO 13490, January 21, 2009"
 */
function parseRelationships(dispositionNotes, currentEO) {
  if (!dispositionNotes || dispositionNotes.trim() === '') {
    return [];
  }

  const relationships = [];
  const lines = dispositionNotes.split('\n').map(line => line.trim()).filter(line => line);

  for (const line of lines) {
    // Match patterns like "Revoked by: EO 13811" or "Amends: EO 13597"
    const revokedByMatch = line.match(/Revoked by:\s*EO\s+(\d+)/i);
    if (revokedByMatch) {
      relationships.push({
        type: 'revoked_by',
        target: parseInt(revokedByMatch[1]),
        source: currentEO
      });
    }

    // Match "Revokes: EO 13673" (this EO revokes others)
    const revokesMatch = line.match(/Revokes:\s*EO\s+(\d+)/i);
    if (revokesMatch) {
      relationships.push({
        type: 'revokes',
        source: currentEO,
        target: parseInt(revokesMatch[1])
      });
    }

    // Match "Amends: EO 13597"
    const amendsMatch = line.match(/Amends:\s*EO\s+(\d+)/i);
    if (amendsMatch) {
      relationships.push({
        type: 'amends',
        source: currentEO,
        target: parseInt(amendsMatch[1])
      });
    }

    // Match "See: EO 14024" (multiple can be in one line)
    const seeMatches = line.matchAll(/See:\s*EO\s+(\d+)/gi);
    for (const match of seeMatches) {
      relationships.push({
        type: 'see',
        source: currentEO,
        target: parseInt(match[1])
      });
    }

    // Match "Supersedes: EO 13490"
    const supersedesMatch = line.match(/Supersedes:\s*EO\s+(\d+)/i);
    if (supersedesMatch) {
      relationships.push({
        type: 'supersedes',
        source: currentEO,
        target: parseInt(supersedesMatch[1])
      });
    }

    // Match "Continued by: EO 13811"
    const continuedByMatch = line.match(/Continued by:\s*EO\s+(\d+)/i);
    if (continuedByMatch) {
      relationships.push({
        type: 'continued_by',
        target: parseInt(continuedByMatch[1]),
        source: currentEO
      });
    }

    // Match "Reinstated by: EO 14030"
    const reinstatedByMatch = line.match(/Reinstated by:\s*EO\s+(\d+)/i);
    if (reinstatedByMatch) {
      relationships.push({
        type: 'reinstated_by',
        target: parseInt(reinstatedByMatch[1]),
        source: currentEO
      });
    }
  }

  return relationships;
}

/**
 * Parse CSV and build graph data structure
 */
export async function parsePresidentialDocuments() {
  // Try multiple possible paths for the CSV file
  const csvPaths = [
    '/presidential_documents.csv',
    './presidential_documents.csv',
    'presidential_documents.csv'
  ];
  
  return new Promise((resolve, reject) => {
    let lastError = null;
    let pathIndex = 0;
    
    const tryFetch = (path) => {
      console.log(`Attempting to fetch CSV from: ${path}`);
      fetch(path)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(csvText => {
          if (!csvText || csvText.trim().length === 0) {
            throw new Error('CSV file is empty');
          }
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const nodes = new Map();
              const edges = [];
              const nodeIds = new Set();

              // First pass: create nodes and collect all EO numbers
              results.data.forEach((row) => {
                if (!row.executive_order_number || row.executive_order_number.trim() === '') {
                  return;
                }

                const eoNumber = parseInt(row.executive_order_number);
                if (isNaN(eoNumber)) {
                  return;
                }

                nodeIds.add(eoNumber);
                nodes.set(eoNumber, {
                  id: eoNumber,
                  label: `EO ${eoNumber}`,
                  title: row.title || `Executive Order ${eoNumber}`,
                  signingDate: row.signing_date || '',
                  publicationDate: row.publication_date || '',
                  citation: row.citation || '',
                  htmlUrl: row.html_url || '',
                  pdfUrl: row.pdf_url || ''
                });
              });

              // Second pass: extract relationships
              results.data.forEach((row) => {
                if (!row.executive_order_number || row.executive_order_number.trim() === '') {
                  return;
                }

                const eoNumber = parseInt(row.executive_order_number);
                if (isNaN(eoNumber)) {
                  return;
                }

                const relationships = parseRelationships(row.disposition_notes, eoNumber);
                
                relationships.forEach((rel) => {
                  // Only add edges if both nodes exist
                  if (nodeIds.has(rel.source) && nodeIds.has(rel.target)) {
                    edges.push({
                      source: rel.source,
                      target: rel.target,
                      type: rel.type
                    });
                  }
                });
              });

              resolve({
                nodes: Array.from(nodes.values()),
                links: edges
              });
            },
            error: (error) => {
              reject(new Error(`CSV parsing error: ${error.message || error}`));
            }
          });
        })
        .catch(error => {
          lastError = error;
          pathIndex++;
          if (pathIndex < csvPaths.length) {
            // Try next path
            tryFetch(csvPaths[pathIndex]);
          } else {
            // All paths failed
            reject(new Error(`Failed to load CSV file. Tried paths: ${csvPaths.join(', ')}. Last error: ${error.message || error}`));
          }
        });
    };
    
    // Start with first path
    tryFetch(csvPaths[0]);
  });
}


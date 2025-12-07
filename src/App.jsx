import { useState, useEffect } from 'react'
import PresidentialDocumentsGraph from './components/PresidentialDocumentsGraph'
import DataAnalysis from './components/DataAnalysis'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('graph')
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('App useEffect - starting data load');
    // Import and parse data once at app level
    import('./utils/parseDocuments').then(({ parsePresidentialDocuments }) => {
      console.log('parsePresidentialDocuments imported');
      parsePresidentialDocuments()
        .then((data) => {
          console.log('Data loaded successfully:', data.nodes?.length, 'nodes,', data.links?.length, 'links');
          if (!data || !data.nodes || data.nodes.length === 0) {
            throw new Error('No data loaded from CSV file');
          }
          setGraphData(data)
          setLoading(false)
          setError(null)
        })
        .catch((err) => {
          console.error('Error loading data:', err)
          setError(err.message || 'Failed to load data. Please check the browser console for details.')
          setLoading(false)
        })
    }).catch((err) => {
      console.error('Error importing parseDocuments:', err);
      setError('Failed to load data parser. Please refresh the page.')
      setLoading(false);
    })
  }, [])

  console.log('App render - loading:', loading, 'error:', error, 'graphData:', graphData);

  if (loading) {
    return (
      <div className="app-loading" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        width: '100vw',
        backgroundColor: '#ffffff',
        color: '#333',
        fontSize: '18px',
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '10px' }}>Loading presidential documents...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Please wait while we load the data</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#ffffff',
        padding: '20px',
        gap: '20px'
      }}>
        <div style={{ color: '#d32f2f', fontSize: '20px', fontWeight: 'bold' }}>Error Loading Data</div>
        <div style={{ color: '#666', maxWidth: '600px', textAlign: 'center' }}>{error}</div>
        <button 
          onClick={() => {
            setLoading(true)
            setError(null)
            window.location.reload()
          }}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: 'pointer',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Presidential Documents Network</h1>
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            Network Graph
          </button>
          <button
            className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            Data Analysis
          </button>
        </div>
      </div>
      <div className="app-content">
        {activeTab === 'graph' && (
          graphData ? (
            <PresidentialDocumentsGraph initialData={graphData} />
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              <p>No graph data available. Please wait for data to load.</p>
            </div>
          )
        )}
        {activeTab === 'analysis' && (
          <DataAnalysis graphData={graphData} />
        )}
      </div>
    </div>
  )
}

export default App

import { useState, useEffect } from 'react';

function Debug() {
  const [status, setStatus] = useState('Loading...');
  
  useEffect(() => {
    console.log('Debug component mounted');
    setStatus('Component mounted successfully!');
    
    // Test if DOM is ready
    console.log('DOM ready:', document.readyState);
    console.log('Root element:', document.getElementById('root'));
    
    // Test basic React features
    console.log('React version:', '18.x');
    
    return () => {
      console.log('Debug component unmounting');
    };
  }, []);
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      border: '2px solid #333',
      margin: '20px'
    }}>
      <h1 style={{ color: '#333' }}>Debug Component</h1>
      <p>Status: {status}</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
      <button onClick={() => alert('Button works!')}>
        Test Button
      </button>
    </div>
  );
}

export default Debug;
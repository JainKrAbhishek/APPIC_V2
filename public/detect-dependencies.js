// Dependency detection script
(function() {
  console.log('Running dependency detection...');
  
  // Check for React
  const reactExists = typeof window.React !== 'undefined';
  const reactDOMExists = typeof window.ReactDOM !== 'undefined';
  
  console.log('React available globally:', reactExists);
  console.log('ReactDOM available globally:', reactDOMExists);
  
  // Check for common global libraries
  const globals = {
    '_': typeof window._ !== 'undefined', // Lodash/Underscore
    '$': typeof window.$ !== 'undefined' || typeof window.jQuery !== 'undefined', // jQuery
    'dayjs': typeof window.dayjs !== 'undefined',
    'moment': typeof window.moment !== 'undefined',
    'axios': typeof window.axios !== 'undefined',
  };
  
  console.log('Other global libraries:', globals);
  
  // Test DOM functionality
  try {
    const testContainer = document.createElement('div');
    testContainer.id = 'dependency-test-container';
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);
    
    console.log('DOM manipulation working correctly');
    
    // If React is available, try to render a simple component
    if (reactExists && reactDOMExists) {
      try {
        const TestComponent = React.createElement('div', { className: 'test-component' }, 'Test Component');
        ReactDOM.render(TestComponent, testContainer);
        console.log('React rendering working correctly');
        
        // Clean up
        setTimeout(() => {
          ReactDOM.unmountComponentAtNode(testContainer);
          testContainer.remove();
        }, 500);
      } catch (e) {
        console.error('React rendering failed:', e);
      }
    }
  } catch (e) {
    console.error('DOM test failed:', e);
  }
  
  // Check for ES6 features
  const es6Features = {
    'Arrow functions': (() => { try { return (() => {}).toString().includes('=>'); } catch(e) { return false; } })(),
    'Destructuring': (() => { try { const { a } = { a: 1 }; return a === 1; } catch(e) { return false; } })(),
    'Spread operator': (() => { try { return [...[1]].length === 1; } catch(e) { return false; } })(),
    'Classes': (() => { try { new (class {}); return true; } catch(e) { return false; } })(),
    'Promises': (() => { try { return typeof Promise === 'function'; } catch(e) { return false; } })(),
    'Async/await': (() => { try { eval('(async function() {})'); return true; } catch(e) { return false; } })()
  };
  
  console.log('ES6 features support:', es6Features);
  
  // Check for import capabilities
  const importCapabilities = {
    'dynamic import': (() => { 
      try { 
        typeof import === 'function'; 
        return true; 
      } catch(e) { 
        return false; 
      } 
    })()
  };
  
  console.log('Import capabilities:', importCapabilities);
  
  // Check for common browser APIs
  const browserAPIs = {
    'Fetch API': typeof fetch === 'function',
    'localStorage': (() => { try { return typeof localStorage !== 'undefined'; } catch(e) { return false; } })(),
    'sessionStorage': (() => { try { return typeof sessionStorage !== 'undefined'; } catch(e) { return false; } })(),
    'IndexedDB': typeof indexedDB !== 'undefined',
    'WebSockets': typeof WebSocket === 'function',
    'WebWorkers': typeof Worker === 'function',
    'ResizeObserver': typeof ResizeObserver === 'function',
    'IntersectionObserver': typeof IntersectionObserver === 'function'
  };
  
  console.log('Browser APIs support:', browserAPIs);
  
  // Check for console methods
  const consoleAPI = {
    'log': typeof console.log === 'function',
    'error': typeof console.error === 'function',
    'warn': typeof console.warn === 'function',
    'info': typeof console.info === 'function',
    'debug': typeof console.debug === 'function',
    'group': typeof console.group === 'function'
  };
  
  console.log('Console API support:', consoleAPI);
  
  // Send results to the parent page
  try {
    const results = {
      react: { reactExists, reactDOMExists },
      globals,
      es6Features,
      importCapabilities,
      browserAPIs,
      consoleAPI,
      timestamp: new Date().toISOString()
    };
    
    window.parent.postMessage({
      type: 'dependencyResults',
      results
    }, window.location.origin);
    
    console.log('Dependency check complete and results sent to parent');
  } catch (e) {
    console.error('Failed to send results:', e);
  }
})();
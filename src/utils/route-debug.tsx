// Simple route debugging utility
export function debugRoutes() {
  if (typeof window === 'undefined') return;
  
  console.log('🚀 Route Debug Information:');
  console.log('Current URL:', window.location.href);
  console.log('Pathname:', window.location.pathname);
  console.log('Search:', window.location.search);
  console.log('Hash:', window.location.hash);
  console.log('Host:', window.location.host);
  console.log('Origin:', window.location.origin);
  
  const expectedRoutes = ['/form', '/registration', '/admin', '/'];
  const currentPath = window.location.pathname;
  
  console.log('Expected routes:', expectedRoutes);
  console.log('Current path matches expected:', expectedRoutes.includes(currentPath));
  
  // Test if React Router is working
  console.log('React app loaded:', !!document.getElementById('root'));
  console.log('Document ready state:', document.readyState);
}

// Auto-run on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', debugRoutes);
}
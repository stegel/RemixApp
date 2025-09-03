// Deployment debugging utilities
export function logRoutingInfo() {
  if (typeof window !== 'undefined') {
    console.log('🔍 Routing Debug Info:', {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }
}

export function getCurrentPath(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
}

export function isValidRoute(path: string): boolean {
  const validRoutes = ['/', '/form', '/registration', '/admin'];
  const cleanPath = path.toLowerCase().replace(/\/$/, '') || '/';
  return validRoutes.includes(cleanPath) || validRoutes.some(route => cleanPath.endsWith(route));
}
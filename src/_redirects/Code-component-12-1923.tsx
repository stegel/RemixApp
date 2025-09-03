# SPA fallback routing
# This ensures that all routes that don't match actual files are served by the main index.html
# allowing client-side routing to work properly

# Serve static assets directly
/static/* /static/:splat 200
/assets/* /assets/:splat 200
/images/* /images/:splat 200

# API routes (if any) should be handled by their respective endpoints
/api/* /api/:splat 200

# Supabase functions
/supabase/* /supabase/:splat 200

# All other routes should fall back to the main app
/* /index.html 200
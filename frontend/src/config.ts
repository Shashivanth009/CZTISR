// Centralized API configuration for deployment
// Uses Vite environment variables with localhost fallbacks for development

export const config = {
    // Identity service (auth endpoints)
    identityUrl: import.meta.env.VITE_IDENTITY_URL || 'http://localhost:8001',

    // Gateway service (API endpoints) 
    gatewayUrl: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8020',

    // WebSocket gateway
    wsGatewayUrl: import.meta.env.VITE_WS_GATEWAY_URL || 'ws://localhost:8020',
};

// smithery.config.js - Configuration for Smithery CLI development server

export default {
  // Development server configuration
  port: 8081,
  
  // Default configuration values for the MCP server
  config: {
    maxMemories: 100,
    enableGraph: true
  },
  
  // Additional dev options
  noTunnel: true,
  noOpen: true
};
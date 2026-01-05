#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js';

// ============================================================================
// CORE IMPORTS
// ============================================================================

import { z } from 'zod';

// ============================================================================
// CORE IMPORTS
// ============================================================================

import { MemoryManager } from './lib/MemoryManager.js';

// Time Utils
import { getCurrentTimeDefinition, getCurrentTime } from './tools/time/getCurrentTime.js';

// Semantic Code Analysis
import { findSymbolDefinition, findSymbol } from './tools/semantic/findSymbol.js';
import { findReferencesDefinition, findReferences } from './tools/semantic/findReferences.js';
import { analyzeDependencyGraphDefinition, analyzeDependencyGraph } from './tools/semantic/analyzeDependencyGraph.js';

// Sequential Thinking
import { createThinkingChainDefinition, createThinkingChain } from './tools/thinking/createThinkingChain.js';
import { analyzeProblemDefinition, analyzeProblem } from './tools/thinking/analyzeProblem.js';
import { stepByStepAnalysisDefinition, stepByStepAnalysis } from './tools/thinking/stepByStepAnalysis.js';
import { formatAsPlanDefinition, formatAsPlan } from './tools/thinking/formatAsPlan.js';

// Memory Management (Basic)
import { saveMemoryDefinition, saveMemory } from './tools/memory/saveMemory.js';
import { recallMemoryDefinition, recallMemory } from './tools/memory/recallMemory.js';
import { listMemoriesDefinition, listMemories } from './tools/memory/listMemories.js';
import { deleteMemoryDefinition, deleteMemory } from './tools/memory/deleteMemory.js';
import { updateMemoryDefinition, updateMemory } from './tools/memory/updateMemory.js';
import { prioritizeMemoryDefinition, prioritizeMemory } from './tools/memory/prioritizeMemory.js';

// Memory Management (Graph - v2.0 NEW)
import { linkMemoriesDefinition, linkMemories } from './tools/memory/linkMemories.js';
import { getMemoryGraphDefinition, getMemoryGraph } from './tools/memory/getMemoryGraph.js';
import { searchMemoriesAdvancedDefinition, searchMemoriesAdvanced } from './tools/memory/searchMemoriesAdvanced.js';
import { createMemoryTimelineDefinition, createMemoryTimeline } from './tools/memory/createMemoryTimeline.js';

// Memory Management (Session Context - v2.1 NEW)
import { getSessionContextDefinition, getSessionContext } from './tools/memory/getSessionContext.js';

// Code Quality & Convention
import { getCodingGuideDefinition, getCodingGuide } from './tools/convention/getCodingGuide.js';
import { applyQualityRulesDefinition, applyQualityRules } from './tools/convention/applyQualityRules.js';
import { validateCodeQualityDefinition, validateCodeQuality } from './tools/convention/validateCodeQuality.js';
import { analyzeComplexityDefinition, analyzeComplexity } from './tools/convention/analyzeComplexity.js';
import { checkCouplingCohesionDefinition, checkCouplingCohesion } from './tools/convention/checkCouplingCohesion.js';
import { suggestImprovementsDefinition, suggestImprovements } from './tools/convention/suggestImprovements.js';

// Planning
import { generatePrdDefinition, generatePrd } from './tools/planning/generatePrd.js';
import { createUserStoriesDefinition, createUserStories } from './tools/planning/createUserStories.js';
import { analyzeRequirementsDefinition, analyzeRequirements } from './tools/planning/analyzeRequirements.js';
import { featureRoadmapDefinition, featureRoadmap } from './tools/planning/featureRoadmap.js';

// Prompt Engineering
import { enhancePromptDefinition, enhancePrompt } from './tools/prompt/enhancePrompt.js';
import { analyzePromptDefinition, analyzePrompt } from './tools/prompt/analyzePrompt.js';
import { enhancePromptGeminiDefinition, enhancePromptGemini } from './tools/prompt/enhancePromptGemini.js';

// Reasoning
import { applyReasoningFrameworkDefinition, applyReasoningFramework } from './tools/reasoning/applyReasoningFramework.js';

// UI & Analytics
import { previewUiAsciiDefinition, previewUiAscii } from './tools/ui/previewUiAscii.js';
import { getUsageAnalyticsDefinition, getUsageAnalytics } from './tools/analytics/getUsageAnalytics.js';

// ============================================================================
// TOOL REGISTRY - Clean, Organized, Easy to Maintain
// ============================================================================

const tools = [
  // Core Utilities (2)
  getCurrentTimeDefinition,
  previewUiAsciiDefinition,

  // Memory Management - Basic (6)
  saveMemoryDefinition,
  recallMemoryDefinition,
  updateMemoryDefinition,
  deleteMemoryDefinition,
  listMemoriesDefinition,
  prioritizeMemoryDefinition,

  // Memory Management - Graph (4) - v2.0 NEW
  linkMemoriesDefinition,
  getMemoryGraphDefinition,
  searchMemoriesAdvancedDefinition,
  createMemoryTimelineDefinition,

  // Memory Management - Session Context (1) - v2.1 NEW
  getSessionContextDefinition,

  // Code Analysis - Semantic (2)
  findSymbolDefinition,
  findReferencesDefinition,

  // Code Analysis - Advanced (1) - v2.0 NEW
  analyzeDependencyGraphDefinition,

  // Code Quality (6)
  getCodingGuideDefinition,
  applyQualityRulesDefinition,
  validateCodeQualityDefinition,
  analyzeComplexityDefinition,
  checkCouplingCohesionDefinition,
  suggestImprovementsDefinition,

  // Thinking & Planning (8)
  createThinkingChainDefinition,
  analyzeProblemDefinition,
  stepByStepAnalysisDefinition,
  formatAsPlanDefinition,
  generatePrdDefinition,
  createUserStoriesDefinition,
  analyzeRequirementsDefinition,
  featureRoadmapDefinition,

  // Prompt Engineering (3)
  enhancePromptDefinition,
  analyzePromptDefinition,
  enhancePromptGeminiDefinition,

  // Reasoning (1)
  applyReasoningFrameworkDefinition,

  // Analytics (1) - v2.0 NEW
  getUsageAnalyticsDefinition
];

// Total: 35 tools (v2.1: +1 get_session_context)

// ============================================================================
// TOOL HANDLER REGISTRY - Dynamic Dispatch Pattern (No Switch Statement)
// ============================================================================

type ToolHandler = (args: unknown) => Promise<CallToolResult>;

const toolHandlers: Record<string, ToolHandler> = {
  // Time & UI
  'get_current_time': (args) => getCurrentTime(args as Parameters<typeof getCurrentTime>[0]),
  'preview_ui_ascii': (args) => previewUiAscii(args as Parameters<typeof previewUiAscii>[0]),

  // Memory - Basic
  'save_memory': (args) => saveMemory(args as Parameters<typeof saveMemory>[0]),
  'recall_memory': (args) => recallMemory(args as Parameters<typeof recallMemory>[0]),
  'update_memory': (args) => updateMemory(args as Parameters<typeof updateMemory>[0]),
  'delete_memory': (args) => deleteMemory(args as Parameters<typeof deleteMemory>[0]),
  'list_memories': (args) => listMemories(args as Parameters<typeof listMemories>[0]),
  'prioritize_memory': (args) => prioritizeMemory(args as Parameters<typeof prioritizeMemory>[0]),

  // Memory - Graph (v2.0 NEW)
  'link_memories': (args) => linkMemories(args as Parameters<typeof linkMemories>[0]),
  'get_memory_graph': (args) => getMemoryGraph(args as Parameters<typeof getMemoryGraph>[0]),
  'search_memories_advanced': (args) => searchMemoriesAdvanced(args as Parameters<typeof searchMemoriesAdvanced>[0]),
  'create_memory_timeline': (args) => createMemoryTimeline(args as Parameters<typeof createMemoryTimeline>[0]),

  // Memory - Session Context (v2.1 NEW)
  'get_session_context': (args) => getSessionContext(args as Parameters<typeof getSessionContext>[0]),

  // Code Analysis
  'find_symbol': (args) => findSymbol(args as Parameters<typeof findSymbol>[0]),
  'find_references': (args) => findReferences(args as Parameters<typeof findReferences>[0]),
  'analyze_dependency_graph': (args) => analyzeDependencyGraph(args as Parameters<typeof analyzeDependencyGraph>[0]),

  // Code Quality
  'get_coding_guide': (args) => getCodingGuide(args as Parameters<typeof getCodingGuide>[0]),
  'apply_quality_rules': (args) => applyQualityRules(args as Parameters<typeof applyQualityRules>[0]),
  'validate_code_quality': (args) => validateCodeQuality(args as Parameters<typeof validateCodeQuality>[0]),
  'analyze_complexity': (args) => analyzeComplexity(args as Parameters<typeof analyzeComplexity>[0]),
  'check_coupling_cohesion': (args) => checkCouplingCohesion(args as Parameters<typeof checkCouplingCohesion>[0]),
  'suggest_improvements': (args) => suggestImprovements(args as Parameters<typeof suggestImprovements>[0]),

  // Thinking
  'create_thinking_chain': (args) => createThinkingChain(args as Parameters<typeof createThinkingChain>[0]),
  'analyze_problem': (args) => analyzeProblem(args as Parameters<typeof analyzeProblem>[0]),
  'step_by_step_analysis': (args) => stepByStepAnalysis(args as Parameters<typeof stepByStepAnalysis>[0]),
  'format_as_plan': (args) => formatAsPlan(args as Parameters<typeof formatAsPlan>[0]),

  // Planning
  'generate_prd': (args) => generatePrd(args as Parameters<typeof generatePrd>[0]),
  'create_user_stories': (args) => createUserStories(args as Parameters<typeof createUserStories>[0]),
  'analyze_requirements': (args) => analyzeRequirements(args as Parameters<typeof analyzeRequirements>[0]),
  'feature_roadmap': (args) => featureRoadmap(args as Parameters<typeof featureRoadmap>[0]),

  // Prompt
  'enhance_prompt': (args) => enhancePrompt(args as Parameters<typeof enhancePrompt>[0]),
  'analyze_prompt': (args) => analyzePrompt(args as Parameters<typeof analyzePrompt>[0]),
  'enhance_prompt_gemini': (args) => enhancePromptGemini(args as Parameters<typeof enhancePromptGemini>[0]),

  // Reasoning
  'apply_reasoning_framework': (args) => applyReasoningFramework(args as Parameters<typeof applyReasoningFramework>[0]),

  // Analytics (v2.0 NEW)
  'get_usage_analytics': (args) => getUsageAnalytics(args as Parameters<typeof getUsageAnalytics>[0])
};

// ============================================================================
// CONFIGURATION SCHEMA - For Smithery session configuration
// ============================================================================

export const configSchema = z.object({
  // Optional configuration for memory management
  maxMemories: z.number().min(10).max(1000).default(100).describe('Maximum number of memories to store'),
  enableGraph: z.boolean().default(true).describe('Enable knowledge graph features'),
  // Add more config options as needed
});

// ============================================================================
// SERVER SETUP
// ============================================================================

function createServer() {
  const mcpServer = new McpServer(
    {
      name: 'Op-AI',
      version: '3.0.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  const server = mcpServer.server;

  // List all available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Prompts - predefined workflows
  const prompts = [
    {
      name: 'code-review',
      description: 'Comprehensive code review with quality analysis',
      arguments: [
        { name: 'code', description: 'Code to review', required: true },
        { name: 'language', description: 'Programming language', required: false }
      ]
    },
    {
      name: 'problem-solver',
      description: 'Step-by-step problem analysis and solution planning',
      arguments: [
        { name: 'problem', description: 'Problem description', required: true },
        { name: 'context', description: 'Additional context', required: false }
      ]
    },
    {
      name: 'project-kickoff',
      description: 'Start a new project with PRD, user stories, and roadmap',
      arguments: [
        { name: 'projectName', description: 'Name of the project', required: true },
        { name: 'vision', description: 'Project vision and goals', required: true }
      ]
    }
  ];

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'code-review':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please perform a comprehensive code review for the following code:\n\n${args?.code || ''}\n\nAnalyze for:\n1. Code quality and best practices\n2. Complexity and maintainability\n3. Potential improvements\n4. Security considerations`
              }
            }
          ]
        };
      case 'problem-solver':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need help solving this problem:\n\n${args?.problem || ''}\n\nContext: ${args?.context || 'None provided'}\n\nPlease:\n1. Break down the problem into sub-problems\n2. Analyze each component step-by-step\n3. Propose a structured solution plan`
              }
            }
          ]
        };
      case 'project-kickoff':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Let's kick off a new project:\n\nProject Name: ${args?.projectName || 'Unnamed Project'}\nVision: ${args?.vision || ''}\n\nPlease help me create:\n1. A Product Requirements Document (PRD)\n2. User stories with acceptance criteria\n3. A development roadmap`
              }
            }
          ]
        };
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
    }
  });

  // Resources - project information and guides
  const resources = [
    {
      uri: 'hi-ai://context/session',
      name: '🧠 Session Context (Auto-load)',
      description: 'Automatically provides previous memory and knowledge graph context when starting a session. When starting a new conversation, reading this resource allows you to quickly understand the project context.',
      mimeType: 'text/plain'
    },
    {
      uri: 'hi-ai://guides/quality-rules',
      name: 'Code Quality Rules',
      description: 'Best practices and quality rules for code development',
      mimeType: 'text/plain'
    },
    {
      uri: 'hi-ai://guides/naming-conventions',
      name: 'Naming Conventions',
      description: 'Naming conventions for variables, functions, and components',
      mimeType: 'text/plain'
    },
    {
      uri: 'hi-ai://info/capabilities',
      name: 'Hi-AI Capabilities',
      description: 'Overview of Hi-AI tools and features',
      mimeType: 'text/plain'
    }
  ];

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case 'hi-ai://context/session':
        // v2.1: Session context resource - provides memory context automatically
        try {
          const memoryManager = MemoryManager.getInstance();
          const stats = memoryManager.getStats();
          const memories = memoryManager.list().slice(0, 15);
          const graph = memoryManager.getMemoryGraph(undefined, 2);

          let contextText = `# 🧠 Session Context\n\n`;
          contextText += `> Previous session memories and knowledge graph.\n\n`;

          // Stats
          contextText += `## 📊 Statistics\n`;
          contextText += `- Total memories: ${stats.total}\n`;
          const catStats = Object.entries(stats.byCategory).slice(0, 5).map(([c, n]) => `${c}: ${n}`).join(', ');
          contextText += `- Categories: ${catStats || 'None'}\n\n`;

          // Top memories
          contextText += `## 📝 Key Memories\n\n`;
          if (memories.length === 0) {
            contextText += `_No saved memories._\n\n`;
          } else {
            for (const m of memories) {
              const preview = m.value.length > 100 ? m.value.substring(0, 100) + '...' : m.value;
              contextText += `### ${m.key}\n`;
              contextText += `**[${m.category}]** ${m.priority ? `⭐${m.priority}` : ''}\n`;
              contextText += `> ${preview}\n\n`;
            }
          }

          // Graph summary
          if (graph.edges.length > 0) {
            contextText += `## 🔗 Knowledge Graph\n\n`;
            for (const edge of graph.edges.slice(0, 5)) {
              contextText += `- ${edge.sourceKey} → ${edge.targetKey} (${edge.relationType})\n`;
            }
            if (graph.edges.length > 5) {
              contextText += `- _... and ${graph.edges.length - 5} more relations_\n`;
            }
          }

          contextText += `\n---\n`;
          contextText += `💡 **Tip**: Use the get_session_context tool for more detailed context.`;

          return {
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: contextText
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: `# Session Context\n\n_Cannot load memories: ${error instanceof Error ? error.message : 'Unknown error'}_`
            }]
          };
        }

      case 'hi-ai://guides/quality-rules':
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: `# Code Quality Rules

## Complexity
- Max Cyclomatic Complexity: 10
- Max Cognitive Complexity: 15
- Max Function Lines: 20
- Max Nesting Depth: 3
- Max Parameters: 5

## Coupling
- Max Dependencies: 7
- Max Fan-Out: 5
- Prevent Circular Dependencies

## Maintainability
- No Magic Numbers
- Consistent Naming
- Proper Error Handling
- Type Safety`
          }]
        };
      case 'hi-ai://guides/naming-conventions':
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: `# Naming Conventions

## Variables
- Use nouns: userList, userData

## Functions
- Use verb+noun: fetchData, updateUser

## Event Handlers
- Use handle prefix: handleClick, handleSubmit

## Booleans
- Use is/has/can prefix: isLoading, hasError, canEdit

## Constants
- Use UPPER_SNAKE_CASE: MAX_RETRY_COUNT, API_TIMEOUT

## Components
- Use PascalCase: UserProfile, HeaderSection

## Hooks
- Use use prefix: useUserData, useAuth`
          }]
        };
      case 'hi-ai://info/capabilities':
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: `# Hi-AI Capabilities (v2.1)

## Tool Categories (35 tools)

### Time Utilities (1)
- get_current_time

### Semantic Code Analysis (3)
- find_symbol, find_references, analyze_dependency_graph

### Sequential Thinking (4)
- create_thinking_chain, analyze_problem
- step_by_step_analysis, format_as_plan

### Memory Management - Basic (6)
- save_memory, recall_memory, list_memories
- delete_memory, update_memory, prioritize_memory

### Memory Management - Graph (4)
- link_memories, get_memory_graph
- search_memories_advanced, create_memory_timeline

### Memory Management - Session (1) [v2.1 NEW]
- get_session_context 🚀 Recommended for auto-execution on session start

### Code Quality (6)
- get_coding_guide, apply_quality_rules
- validate_code_quality, analyze_complexity
- check_coupling_cohesion, suggest_improvements

### Project Planning (4)
- generate_prd, create_user_stories
- analyze_requirements, feature_roadmap

### Prompt Enhancement (3)
- enhance_prompt, analyze_prompt, enhance_prompt_gemini

### Reasoning (1)
- apply_reasoning_framework

### Analytics (1)
- get_usage_analytics

### UI Preview (1)
- preview_ui_ascii

## Resources (4)
- hi-ai://context/session - 🧠 Auto-load session context
- hi-ai://guides/quality-rules - Code quality rules
- hi-ai://guides/naming-conventions - Naming conventions
- hi-ai://info/capabilities - Feature overview`
          }]
        };
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    }
  });

  // Handle tool execution - Dynamic dispatch (no switch statement)
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    try {
      const handler = toolHandlers[name];

      if (!handler) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
      }

      return await handler(args);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  return mcpServer;
}

// ============================================================================
// ENTRY POINTS
// ============================================================================

// Default export for Smithery platform

export default function({ sessionId, config }: { sessionId: string; config?: Partial<z.infer<typeof configSchema>> }) {
  void sessionId;
  void config;
  // Config is available for future use but not currently needed
  return createServer();
}

// CLI entry point
async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();

  // Handle process termination gracefully
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });

  // Handle EPIPE errors that occur with sidecar proxy
  process.on('uncaughtException', (error) => {
    if (error.message && error.message.includes('EPIPE')) {
      console.error('Connection closed by client');
      return;
    }
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  await server.connect(transport);
}

// Only run main when not being imported by Smithery
if (
  process.argv[1]?.includes('hi-ai') ||
  process.argv[1]?.includes('op-ai') ||
  process.argv[1]?.endsWith('index.js')
) {
  main().catch((error) => {
    console.error('Server initialization failed:', error);
    process.exit(1);
  });
}

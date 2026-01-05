# AGENTS.md

This file provides guidelines for AI agents working in the Hi-AI MCP Server codebase.

## Build, Lint, and Test Commands

### Core Commands
```bash
# Install dependencies
npm install

# Build (TypeScript compilation)
npm run build        # runs: tsc

# Development mode (build + run)
npm run dev

# Run all tests
npm test            # runs: vitest run

# Test modes
npm run test:watch  # watch mode
npm run test:ui     # UI mode
npm run test:coverage # with coverage report

# Type checking only
npm run typecheck   # runs: tsc --noEmit
```

### Testing Single Files
```bash
# Run specific test file
npx vitest run tests/unit/MemoryManager.test.ts

# Run test matching pattern
npx vitest run -t "MemoryManager"
```

## Project Structure

```
src/
├── index.ts              # MCP server, tool registry (dynamic dispatch)
├── lib/
│   ├── MemoryManager.ts  # SQLite + Knowledge Graph (core)
│   ├── ContextCompressor.ts
│   ├── ProjectCache.ts   # ts-morph LRU cache
│   └── PythonParser.ts   # Python AST via subprocess
├── tools/                # 35 tools organized by category
│   ├── analytics/        # usage analytics
│   ├── convention/       # code quality (6 tools)
│   ├── memory/           # 11 tools (basic + graph + session)
│   ├── planning/         # 4 tools
│   ├── prompt/           # 3 tools
│   ├── reasoning/        # 1 tool
│   ├── semantic/         # code analysis (3 tools)
│   ├── thinking/         # 4 tools
│   ├── time/             # 1 tool
│   └── ui/               # 1 tool
└── types/
    └── tool.ts           # ToolDefinition interface
```

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode enabled** (`strict: true` in tsconfig.json)
- Target: `ES2022`, Module: `ESNext`
- No type suppression (`as any`, `@ts-ignore`) - fix types properly

### Imports
- **Organize by category** with section comments (see `src/index.ts`):
  ```typescript
  // CORE IMPORTS
  // TOOL IMPORTS - Organized by Category
  // Time Utils
  // Semantic Code Analysis
  // Memory Management (Basic)
  ```
- Use named imports: `import { fn } from './module.js'`
- No default imports for tool files (consistency with pattern)

### Tool File Structure
Each tool file (`src/tools/category/*.ts`) must export:
```typescript
// 1. Definition (for registry)
export const toolNameDefinition = { ... };

// 2. Implementation
export async function toolName(args: any): Promise<CallToolResult> {
  // implementation
}
```

### Naming Conventions
| Type | Pattern | Examples |
|------|---------|----------|
| Variables | camelCase, nouns | `userList`, `memoryData` |
| Functions | verb+noun | `fetchData`, `saveMemory` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Booleans | is/has/can prefix | `isLoading`, `hasError` |
| Tool names | snake_case | `save_memory`, `find_symbol` |
| Tool handlers | snake_case (dict keys) | `'save_memory': saveMemory` |

### Error Handling
- Use `McpError` from `@modelcontextprotocol/sdk/types.js`
- Throw on unknown tool/resource: `throw new McpError(ErrorCode.MethodNotFound, ...)`
- Wrap tool execution in try/catch, re-throw McpError
- Handle process signals: SIGINT, SIGTERM, EPIPE

### Tool Handler Pattern
**Use dynamic dispatch** (Record<string, Handler>) - NO switch statements:
```typescript
const toolHandlers: Record<string, ToolHandler> = {
  'save_memory': saveMemory,
  'find_symbol': findSymbol,
  // ...
};
```

### Memory & Graph Operations
- Use `MemoryManager.getInstance()` for singleton access
- Category: 'project', 'personal', 'code', 'notes'
- Relations: `depends_on`, `implements`, `related_to`, `requires`
- Use SQLite transactions for batch operations

### Code Quality Thresholds
| Metric | Max Value |
|--------|-----------|
| Cyclomatic Complexity | 10 |
| Cognitive Complexity | 15 |
| Function Lines | 20 |
| Nesting Depth | 3 |
| Parameters | 5 |
| Dependencies per Module | 7 |

### File Organization Rules
- New tool → Create file in `src/tools/<category>/`
- Export definition + implementation
- Register in `src/index.ts`:
  1. Add to `tools` array (definition)
  2. Add to `toolHandlers` (implementation)
- Create test in `tests/unit/<ToolName>.test.ts`
- Update README.md documentation

### Git Workflow
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Maintain 100% test coverage
- Run `npm test` before committing
- No linter issues (project uses TypeScript strict mode only)

# Changelog

## [2.1.0] - 2025-01-20

### ✨ New Features

- **Session Context Auto-Injection**
  - Added `get_session_context` tool: Query previous memories, knowledge graph, and timeline at once on session start
  - Added `hi-ai://context/session` resource: Automatically provides context when client reads the resource
  - Improved tool descriptions to encourage LLM to automatically understand context on session start

### 🔄 Changes

- **Tool Description Improvements**
  - `save_memory`: Added knowledge graph connection guidance
  - `recall_memory`: Recommended using get_session_context
  - `list_memories`: Recommended using get_session_context on session start

- **Resource Expansion**
  - `hi-ai://context/session`: Auto-load session context (memory + graph)
  - `hi-ai://info/capabilities`: Updated to v2.1 tool list

### 📊 Statistics

- Total tools: 34 → 35 (+1)
- Total resources: 3 → 4 (+1)

---

## [2.0.0] - 2025-01-19

### ✨ New Features (6 tools)

- `link_memories`: Set memory relationships (knowledge graph)
- `get_memory_graph`: Query/visualize knowledge graph (Mermaid support)
- `search_memories_advanced`: Multi-strategy search (5 strategies)
- `create_memory_timeline`: Create timeline
- `analyze_dependency_graph`: Code dependency analysis and circular reference detection
- `get_usage_analytics`: Usage statistics/analysis

### 🗑️ Removed Tools (8)

- search_memories, auto_save_context, restore_session_context, start_session
- break_down_problem, think_aloud_process, monitor_console_logs, inspect_network_requests

### 🏗️ Architecture Improvements

- index.ts: 37 switch cases → Dynamic dispatch pattern
- MemoryManager extension: 395 lines → 823 lines (+428 lines)
- Knowledge graph table addition (memory_relations)

---

## [1.3.0] - 2025-01-16

### ✨ New Features

- **Python Support Addition**
  - Python code semantic analysis (function, class, variable search)
  - Cyclomatic complexity analysis
  - Python AST parser via subprocess
  - TypeScript/JavaScript + Python hybrid project support

- **Smart Context Compression**
  - 50-70% token reduction in long conversations
  - Priority-based scoring (code > answers > questions > metadata)
  - Emergency-aware compression levels (2K-6K tokens)
  - Automatic low-priority section removal

- **Comprehensive Test Suite**
  - 71 tests (100% passing)
  - Critical path verification
  - MemoryManager, ContextCompressor, PythonParser, ProjectCache unit tests

- **Common Type Definitions**
  - `src/types/tool.ts` centralized type system
  - 170 lines duplicate interfaces removed
  - 34 tools full type consistency improvement

### ⚡ Performance Improvements

- **25x Faster Code Analysis**: LRU project cache
  - 5 project cache, 5-minute TTL
  - Large project analysis: 8 seconds → 0.3 seconds
  - Automatic cache invalidation and removal

- **80% Token Reduction**: Compressed tool responses and descriptions
  - Tool descriptions: 8KB → 2KB (70% reduction)
  - Tool responses: 200-500 tokens → 30-100 tokens (80% reduction)
  - Browser tools: Compact summary format

### 🔄 Changes

- **SQLite Migration**: JSON file storage to SQLite
  - `memories.json` → `memories.db` automatic migration
  - Backup creation (`memories.json.backup`)
  - Category, timestamp, priority indexing
  - Concurrency control and transaction support improvement

- **MemoryManager Feature Enhancement**
  - `getByPriority(priority)`: Priority-based filtering
  - `updatePriority(key, priority)`: Priority update
  - `search(query)`: Key/value full-text search

### 🐛 Bug Fixes

- ProjectCache path normalization (trailing slash handling)
- Context compression edge cases (empty strings, short text)
- Python parser temporary file cleanup (error cleanup)
- All tool response format consistency

### 🏗️ Infrastructure

- vitest testing framework addition
- Test scripts: `test`, `test:watch`, `test:ui`, `test:coverage`
- `tests/unit/` directory structure creation
- `vitest.config.ts` settings addition

### 📦 Dependencies

- `vitest@^4.0.9` (dev)
- `@vitest/ui@^4.0.9` (dev)
- `better-sqlite3@^12.4.1`
- `@types/better-sqlite3@^7.6.13`
- `glob@^11.0.3`
- `@types/glob@^8.1.0`

---

## [1.1.0] - 2025-08-13

### ✨ New Features

- **Semantic Code Analysis Tools Addition**
  - `find_symbol`: Search for functions, classes, variables across the entire project
  - `find_references`: Find all usage locations of specific symbols
  - ts-morph based accurate AST analysis - more accurate than simple text matching
  - TypeScript, JavaScript, JSX, TSX file support

### 🐛 Bug Fixes

- **Browser Tool Fixes**
  - `browserUtils.ts` addition: Automatic detection of Chrome/Edge/Brave installed on PC
  - `monitorConsoleLogs`, `inspectNetworkRequests` tools improved to automatically find browser execution paths
  - Clear error messages and solutions provided when browser not found
  - All Windows/macOS/Linux platforms support

---

## [1.0.6] - 2025-07-10

### 🛠️ Performance Optimization

- ts-morph `Project` reused as singleton to reduce memory/CPU usage
- `allowJs: true`, `skipLibCheck: true` applied → JavaScript code parsing speed improvement
- Response delay reduction in large code analysis (perceived 20~40%)

---

## [1.0.5] - 2025-07-10

### ✨ Major Features Addition

- **AST Based Code Analysis Introduction**
  - `analyze_complexity`: Calculate Cyclomatic/Cognitive/Halstead complexity accurately with AST
  - `check_coupling_cohesion`: Analyze Import/Require/Class/Function structures with AST to improve coupling/cohesion evaluation
  - `break_down_problem`: Automatically decompose functions/classes/variables with AST when inputting code
- **New Dependency**: `ts-morph`(v26) addition

### 📝 Documentation Updates

- README: AST based analysis feature introduction, tool count updated to 31
- smithery.json: Tool count text (29→31) and version 1.0.5 reflection

### 🛠️ Other Changes

- `package.json` version 1.0.5
- Test script creation/deletion

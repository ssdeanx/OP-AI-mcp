// Memory management tool - SQLite based (v1.3)

import { MemoryManager } from '../../lib/MemoryManager.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const recallMemoryDefinition: ToolDefinition = {
  name: 'recall_memory',
  description: `Retrieve a specific memory by key.

Keywords: recall, remember what, what was, remind

💡 If you need the full context, use get_session_context first.`,
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Memory key to retrieve' },
      category: { type: 'string', description: 'Memory category to search in' }
    },
    required: ['key']
  },
  annotations: {
    title: 'Recall Memory',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function recallMemory(args: { key: string; category?: string }): Promise<ToolResult> {
  const { key: recallKey } = args;

  try {
    const memoryManager = MemoryManager.getInstance();
    const memory = memoryManager.recall(recallKey);

    if (memory) {
      return {
        content: [{ type: 'text', text: `${memory.key}: ${memory.value}\n[${memory.category}]` }]
      };
    } else {
      return {
        content: [{ type: 'text', text: `✗ Not found: "${recallKey}"` }]
      };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}

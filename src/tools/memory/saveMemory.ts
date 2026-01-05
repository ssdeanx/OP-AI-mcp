// Memory management tool - SQLite based (v1.3)

import { MemoryManager } from '../../lib/MemoryManager.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const saveMemoryDefinition: ToolDefinition = {
  name: 'save_memory',
  description: `Save important information to long-term memory. Record project decisions, architecture, settings, etc.

Keywords: remember, save, memorize, keep

💡 After saving, link related memories with link_memories to build a knowledge graph.`,
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Memory key/identifier' },
      value: { type: 'string', description: 'Information to save' },
      category: { type: 'string', description: 'Memory category', enum: ['project', 'personal', 'code', 'notes'] }
    },
    required: ['key', 'value']
  },
  annotations: {
    title: 'Save Memory',
    audience: ['user', 'assistant'],
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function saveMemory(args: { key: string; value: string; category?: string }): Promise<ToolResult> {
  const { key: memoryKey, value: memoryValue, category = 'general' } = args;

  try {
    const memoryManager = MemoryManager.getInstance();
    memoryManager.save(memoryKey, memoryValue, category);

    return {
      content: [{ type: 'text', text: `✓ Saved: ${memoryKey}\nCategory: ${category}` }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}

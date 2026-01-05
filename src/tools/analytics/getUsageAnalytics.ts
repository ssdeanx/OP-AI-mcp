// v2.0 - Get usage analytics and telemetry

import { ToolResult, ToolDefinition, UsageStats } from '../../types/tool.js';
import { MemoryManager } from '../../lib/MemoryManager.js';

export const getUsageAnalyticsDefinition: ToolDefinition = {
  name: 'get_usage_analytics',
  description: `Query tool usage analytics and statistics.

Keywords: analytics, statistics, usage, usage data

**Provides Information:**
- Memory usage statistics
- Category distribution
- Time-based usage patterns
- Graph relationship statistics

Usage examples:
- "Show usage statistics"
- "Memory analysis"`,
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Analysis type',
        enum: ['memory', 'graph', 'all']
      },
      timeRange: {
        type: 'string',
        description: 'Time range',
        enum: ['1d', '7d', '30d', 'all']
      },
      detailed: {
        type: 'boolean',
        description: 'Include detailed information (default: false)'
      }
    }
  },
  annotations: {
    title: 'Get Usage Analytics',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface GetUsageAnalyticsArgs {
  type?: 'memory' | 'graph' | 'all';
  timeRange?: '1d' | '7d' | '30d' | 'all';
  detailed?: boolean;
}

export async function getUsageAnalytics(args: GetUsageAnalyticsArgs): Promise<ToolResult> {
  try {
    const { type = 'all', timeRange = 'all', detailed = false } = args;
    const memoryManager = MemoryManager.getInstance();

    let output = '## Hi-AI Usage Analytics\n\n';

    // Memory statistics
    if (type === 'memory' || type === 'all') {
      output += await generateMemoryStats(memoryManager, timeRange, detailed);
    }

    // Graph statistics
    if (type === 'graph' || type === 'all') {
      output += await generateGraphStats(memoryManager, detailed);
    }

    // System info
    output += `---\n### System Information\n\n`;
    output += `- **Hi-AI Version**: 2.0.0\n`;
    output += `- **Analysis Time**: ${new Date().toLocaleString('en-US')}\n`;
    output += `- **Time Range**: ${getTimeRangeLabel(timeRange)}\n`;

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `✗ Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function generateMemoryStats(
  memoryManager: MemoryManager,
  timeRange: string,
  detailed: boolean
): Promise<string> {
  const stats = memoryManager.getStats();
  const allMemories = memoryManager.list();

  let output = '### Memory Statistics\n\n';
  output += `- **Total Memories**: ${stats.total}\n`;
  output += `- **Category Count**: ${Object.keys(stats.byCategory).length}\n\n`;

  // Category distribution
  output += `#### Category Distribution\n\n`;
  const sortedCategories = Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1]);

  for (const [category, count] of sortedCategories) {
    const percentage = ((count / stats.total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / stats.total * 20));
    output += `- **${category}**: ${count} (${percentage}%) ${bar}\n`;
  }
  output += '\n';

  // Time analysis
  if (allMemories.length > 0) {
    output += `#### Time Analysis\n\n`;

    const now = new Date();
    const filterDate = getFilterDate(timeRange);

    const recentMemories = filterDate
      ? allMemories.filter(m => new Date(m.timestamp) >= filterDate)
      : allMemories;

    // Group by day
    const byDay: Record<string, number> = {};
    for (const memory of recentMemories) {
      const day = memory.timestamp.substring(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    }

    const sortedDays = Object.entries(byDay)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7);

    if (sortedDays.length > 0) {
      output += `**Recent Daily Activity**:\n`;
      for (const [day, count] of sortedDays) {
        const bar = '▓'.repeat(Math.min(count, 20));
        output += `- ${day}: ${count} ${bar}\n`;
      }
      output += '\n';
    }

    // Priority distribution
    const priorityCounts: Record<number, number> = {};
    for (const memory of allMemories) {
      const priority = memory.priority || 0;
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    }

    if (Object.keys(priorityCounts).length > 1) {
      output += `**Priority Distribution**:\n`;
      for (const [priority, count] of Object.entries(priorityCounts).sort((a, b) => Number(b[0]) - Number(a[0]))) {
        output += `- Priority ${priority}: ${count}\n`;
      }
      output += '\n';
    }
  }

  // Detailed info
  if (detailed && allMemories.length > 0) {
    output += `#### Detailed Information\n\n`;

    // Most recently accessed
    const byAccess = [...allMemories]
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, 5);

    output += `**Recently Accessed Memories**:\n`;
    for (const memory of byAccess) {
      output += `- \`${memory.key}\` (${formatDate(memory.lastAccessed)})\n`;
    }
    output += '\n';

    // Oldest memories
    const oldest = [...allMemories]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, 5);

    output += `**Oldest Memories**:\n`;
    for (const memory of oldest) {
      output += `- \`${memory.key}\` (${formatDate(memory.timestamp)})\n`;
    }
    output += '\n';
  }

  return output;
}

async function generateGraphStats(
  memoryManager: MemoryManager,
  detailed: boolean
): Promise<string> {
  const graph = memoryManager.getMemoryGraph();

  let output = '### Knowledge Graph Statistics\n\n';
  output += `- **Node Count**: ${graph.nodes.length}\n`;
  output += `- **Relationship Count**: ${graph.edges.length}\n`;
  output += `- **Cluster Count**: ${graph.clusters.length}\n\n`;

  if (graph.edges.length > 0) {
    // Relation type distribution
    const relationTypes: Record<string, number> = {};
    for (const edge of graph.edges) {
      relationTypes[edge.relationType] = (relationTypes[edge.relationType] || 0) + 1;
    }

    output += `#### Relationship Type Distribution\n\n`;
    for (const [type, count] of Object.entries(relationTypes).sort((a, b) => b[1] - a[1])) {
      output += `- **${type}**: ${count}\n`;
    }
    output += '\n';

    // Average connections per node
    const avgConnections = (graph.edges.length * 2 / graph.nodes.length).toFixed(2);
    output += `- **Average Connections**: ${avgConnections}/node\n`;

    // Most connected nodes
    const connectionCount: Record<string, number> = {};
    for (const edge of graph.edges) {
      connectionCount[edge.sourceKey] = (connectionCount[edge.sourceKey] || 0) + 1;
      connectionCount[edge.targetKey] = (connectionCount[edge.targetKey] || 0) + 1;
    }

    const topConnected = Object.entries(connectionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topConnected.length > 0) {
      output += `\n**Most Connected Nodes**:\n`;
      for (const [key, count] of topConnected) {
        output += `- \`${key}\`: ${count} connections\n`;
      }
      output += '\n';
    }
  }

  // Cluster info
  if (graph.clusters.length > 0 && detailed) {
    output += `#### Cluster Details\n\n`;
    for (let i = 0; i < Math.min(graph.clusters.length, 5); i++) {
      const cluster = graph.clusters[i];
      output += `**Cluster ${i + 1}** (${cluster.length} nodes):\n`;
      output += `- ${cluster.slice(0, 5).join(', ')}`;
      if (cluster.length > 5) {
        output += ` ... and ${cluster.length - 5} more`;
      }
      output += '\n';
    }
    output += '\n';
  }

  return output;
}

function getFilterDate(timeRange: string): Date | null {
  const now = new Date();

  switch (timeRange) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

function getTimeRangeLabel(timeRange: string): string {
  switch (timeRange) {
    case '1d':
      return 'Last 24 hours';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    default:
      return 'All time';
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  } catch {
    return dateString;
  }
}

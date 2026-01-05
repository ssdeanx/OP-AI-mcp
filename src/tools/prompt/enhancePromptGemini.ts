// Enhance prompts using Gemini API prompting strategies

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const enhancePromptGeminiDefinition: ToolDefinition = {
  name: 'enhance_prompt_gemini',
  description: 'prompt enhancement|gemini strategies|quality improvement|Few-Shot|Output Format|Context - Enhance prompts using Gemini API prompting strategies',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The original prompt to enhance'
      },
      agent_role: {
        type: 'string',
        description: 'The role of the agent that will receive this prompt (e.g., "Specification Agent", "Planning Agent")'
      },
      strategies: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['few-shot', 'output-format', 'context-placement', 'decomposition', 'parameters']
        },
        description: 'Specific Gemini strategies to apply. If not provided, all strategies will be applied.'
      }
    },
    required: ['prompt']
  },
  annotations: {
    title: 'Enhance Prompt (Gemini Strategies)',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface PromptEnhancement {
  strategy: string;
  description: string;
  applied: string;
  improvement: string;
}

export async function enhancePromptGemini(args: {
  prompt: string;
  agent_role?: string;
  strategies?: string[];
}): Promise<ToolResult> {
  const { prompt, agent_role, strategies } = args;

  // Ensure parameters are used for linting compliance
  void prompt;

  const allStrategies = ['few-shot', 'output-format', 'context-placement', 'decomposition', 'parameters'];
  const strategiesToApply = strategies && strategies.length > 0 ? strategies : allStrategies;

  const enhancements: PromptEnhancement[] = [];

  // 1. Few-Shot Examples
  if (strategiesToApply.includes('few-shot')) {
    enhancements.push({
      strategy: 'Add Few-Shot Examples',
      description: 'Add 2-3 high-quality examples to guide the model to learn patterns',
      applied: addFewShotExamples(prompt, agent_role),
      improvement: 'Improved consistency by clarifying format, expression, and scope'
    });
  }

  // 2. Output Format Specification
  if (strategiesToApply.includes('output-format')) {
    enhancements.push({
      strategy: 'Output Format Specification',
      description: 'Specify structured format with XML tags or markdown headers',
      applied: specifyOutputFormat(prompt, agent_role),
      improvement: 'Clearer desired response structure improves parsing ease'
    });
  }

  // 3. Context Placement
  if (strategiesToApply.includes('context-placement')) {
    enhancements.push({
      strategy: 'Context Placement Optimization',
      description: 'Place long context before specific requests (Gemini 3 optimization)',
      applied: optimizeContextPlacement(prompt),
      improvement: 'Model utilizes context more effectively'
    });
  }

  // 4. Prompt Decomposition
  if (strategiesToApply.includes('decomposition')) {
    enhancements.push({
      strategy: 'Prompt Decomposition',
      description: 'Break down complex tasks into multiple steps for chaining',
      applied: decomposePrompt(prompt, agent_role),
      improvement: 'Improved output quality per step, easier debugging'
    });
  }

  // 5. Parameter Tuning Suggestions
  if (strategiesToApply.includes('parameters')) {
    enhancements.push({
      strategy: 'Parameter Tuning Suggestions',
      description: 'Suggest optimal values for Temperature, Top-K, Top-P, Max Tokens',
      applied: suggestParameters(prompt, agent_role),
      improvement: 'Optimize model behavior for task type'
    });
  }

  const result = {
    original_prompt: prompt,
    agent_role: agent_role || 'Generic Agent',
    strategies_applied: strategiesToApply,
    enhancements,
    enhanced_prompt: combineEnhancements(prompt, enhancements),
    summary: generateSummary(enhancements)
  };

  const output = formatOutput(result);

  return {
    content: [{ type: 'text', text: output }]
  };
}

// Helper methods
function addFewShotExamples(prompt: string, agent_role?: string): string {
  const examples = {
    'Specification Agent': `
**Example 1: Push Notification Settings**
Input: "Enable/disable comments, likes, and follow notifications"
Output:
- Notification types: 6 (comments, likes, follows, notices, events, marketing)
- Setting method: ON/OFF toggle
- Design reference: iOS Settings > Notifications
- Tech stack: FCM (already in use)

**Example 2: User Profile Edit**
Input: "Allow changing profile photo and bio"
Output:
- Edit items: profile photo, bio, display name
- Validation: image size < 5MB, bio < 500 chars
- UI pattern: inline editing (not modal)
- Save method: auto-save (debounce 500ms)`,

    'Planning Agent': `
**Example 1: API Endpoint Add**
Input: "User follow/unfollow feature"
Output:
- Phase 1: Backend (8 hours)
  - DB schema (follows table)
  - API endpoints (POST /follows, DELETE /follows/:id)
  - Business logic (prevent duplicates, no self-follow)
- Phase 2: Frontend (6 hours)
  - Follow button component
  - Follower/Following lists
- Cost impact: +$0 (use existing infrastructure)

**Example 2: Real-time Notifications**
Input: "Real-time notification when comment is posted"
Output:
- Phase 1: WebSocket server setup (12 hours)
- Phase 2: Client subscription logic (8 hours)
- Phase 3: Notification UI (6 hours)
- Cost impact: +$20/month (Redis Pub/Sub)`
  };

  return examples[agent_role as keyof typeof examples] || `
**Add Few-Shot examples suitable for your task type**:
- Example 1: [Specific input] → [Clear output]
- Example 2: [Different input format] → [Consistent output format]
- Example 3: [Edge case] → [Handling method]

**Guidelines**:
- 2-3 examples (prevent overfitting)
- Include diverse scenarios
- Maintain consistent output format`;
}

function specifyOutputFormat(prompt: string, agent_role?: string): string {
  const formats = {
    'Specification Agent': `
**Output Format (Markdown + YAML frontmatter)**:

\`\`\`markdown
---
title: [Feature Name]
priority: [HIGH/MEDIUM/LOW]
created: [Date]
---

# SPEC: [Feature Name]

## REQ-001: [Requirement Title]
**WHEN** [Condition]
**THEN** [Result]

### Acceptance Criteria
- [ ] [Criteria 1]
- [ ] [Criteria 2]
\`\`\`

**Response prefix**: Start with "# SPEC: " to guide the model to complete in correct format`,

    'Planning Agent': `
**Output Format (Structured Markdown)**:

\`\`\`markdown
# PLAN: [Feature Name]

## Architecture
- Backend: [Tech Stack]
- Frontend: [Tech Stack]
- Database: [Schema changes]

## Timeline
| Phase | Tasks | Duration |
|-------|-------|----------|
| 1     | ...   | 8h       |

## Cost Analysis
- Infrastructure: +$X/month
- Third-party: +$Y/month
- Total: +$Z/month
\`\`\`

**Response prefix**: Start with "# PLAN: "`
  };

  return formats[agent_role as keyof typeof formats] || `
**Specify output format**:
- Use markdown headers for section separation (##, ###)
- Use tables, bullet points, checkboxes
- Label semantic components with XML tags (optional)
  Example: <analysis>...</analysis>, <recommendation>...</recommendation>
- Use response prefixes to guide completion
  Example: Start with "Analysis result: " and the model completes with analysis content`;
}

function optimizeContextPlacement(prompt: string): string {
  return `
**Context Placement Optimization (Gemini 3 recommended)**:

1. **Place long context first**:
\`\`\`
[Tech stack info (CLAUDE.md contents)]
[Existing codebase structure]
[Related SPEC/PLAN documents]

--- Specific request follows ---

[User's specific question or task]
\`\`\`

2. **Structure context**:
- Group by category (tech stack, architecture, business logic)
- Repeat important constraints for emphasis
- Clear labeling for reference

3. **Place explicit instructions after context**:
- Specific task instructions after context
- Step-by-step instructions (1, 2, 3...)
- Output format examples`;
}

function decomposePrompt(prompt: string, agent_role?: string): string {
  const isComplex = prompt.length > 200 || prompt.includes(' and ');

  if (!isComplex) {
    return '**Prompt decomposition not needed**: Simple task, single prompt is sufficient.';
  }

  return `
**Prompt Decomposition (Sequential Chain)**:

**Step 1: Information Gathering**
\`\`\`
Prompt: Identify required information for "${prompt.slice(0, 100)}...".
Output: Required tech stack, constraints, prerequisite tasks
\`\`\`

**Step 2: Analysis and Planning**
\`\`\`
Prompt: Create implementation plan based on Step 1 information.
Input: [Step 1 output]
Output: Phase-by-phase tasks, timeline, risks
\`\`\`

**Step 3: Detail Task Generation**
\`\`\`
Prompt: Break down Step 2 plan into actionable tasks.
Input: [Step 2 output]
Output: Task list (with dependencies)
\`\`\`

**Advantages**:
- Improved output quality per step
- Intermediate validation possible
- Re-run only specific step on error`;
}

function suggestParameters(prompt: string, agent_role?: string): string {
  const isCreative = prompt.includes('design') || prompt.includes('idea') || prompt.includes('suggest');
  const isDeterministic = prompt.includes('analysis') || prompt.includes('calculate') || prompt.includes('verify');

  let temperature = 1.0; // Gemini 3 default
  let topP = 0.95;
  let topK = 40;

  if (isCreative) {
    temperature = 1.0;
    topP = 0.95;
  } else if (isDeterministic) {
    temperature = 0.2;
    topP = 0.8;
    topK = 20;
  }

  return `
**Recommended Parameters** (based on task characteristics):

- **Temperature**: ${temperature}
  ${temperature > 0.7 ? 'Suitable for creative tasks (explore diverse options)' : 'Suitable for deterministic tasks (consistent output)'}

- **Top-P**: ${topP}
  Select tokens up to cumulative probability ${topP * 100}%

- **Top-K**: ${topK}
  Consider only top ${topK} tokens

- **Max Output Tokens**: ${agent_role === 'Specification Agent' ? '4000 (detailed document)' : '2000 (general)'}

- **Stop Sequences**: ["---END---", "\`\`\`"] (optional)

**Note**:
- Gemini 3 recommends keeping temperature at default 1.0
- Avoid deviating significantly from defaults to prevent unexpected behavior`;
}

function combineEnhancements(prompt: string, enhancements: PromptEnhancement[]): string {
  let enhanced = `# Enhanced Prompt\n\n`;
  enhanced += `## Original Request\n${prompt}\n\n`;
  enhanced += `---\n\n`;

  enhancements.forEach((e, i) => {
    enhanced += `## Enhancement ${i + 1}: ${e.strategy}\n\n`;
    enhanced += `${e.applied}\n\n`;
  });

  return enhanced;
}

function generateSummary(enhancements: PromptEnhancement[]): string {
  return `${enhancements.length} Gemini prompting strategies applied to improve prompt quality:
${enhancements.map(e => `- ${e.strategy}: ${e.improvement}`).join('\n')}`;
}

function formatOutput(result: any): string {
  let output = `# Gemini Prompt Enhancement\n\n`;
  output += `**Original Prompt**: ${result.original_prompt}\n`;
  output += `**Target Agent**: ${result.agent_role}\n`;
  output += `**Applied Strategies**: ${result.strategies_applied.join(', ')}\n\n`;
  output += `---\n\n`;

  result.enhancements.forEach((e: PromptEnhancement, i: number) => {
    output += `## ${i + 1}. ${e.strategy}\n\n`;
    output += `**Description**: ${e.description}\n\n`;
    output += `**Applied**:\n${e.applied}\n\n`;
    output += `**Improvement**: ${e.improvement}\n\n`;
    output += `---\n\n`;
  });

  output += `## Enhanced Prompt\n\n`;
  output += '```markdown\n' + result.enhanced_prompt + '\n```\n\n';
  output += `## Summary\n\n${result.summary}`;

  return output;
}

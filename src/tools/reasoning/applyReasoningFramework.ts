// Apply 9-step reasoning framework to complex problems

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const applyReasoningFrameworkDefinition: ToolDefinition = {
  name: 'apply_reasoning_framework',
  description: 'reasoning framework|systematic analysis|logical thinking - Apply 9-step reasoning framework to analyze complex problems systematically',
  inputSchema: {
    type: 'object',
    properties: {
      problem: {
        type: 'string',
        description: 'The problem or task to analyze using the reasoning framework'
      },
      context: {
        type: 'string',
        description: 'Additional context about the problem (project constraints, tech stack, etc.)'
      },
      focus_steps: {
        type: 'array',
        items: { type: 'number' },
        description: 'Specific framework steps to focus on (1-9). If not provided, all steps will be applied.'
      }
    },
    required: ['problem']
  },
  annotations: {
    title: 'Apply Reasoning Framework',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface ReasoningStep {
  step: number;
  title: string;
  description: string;
  questions: string[];
  output: string;
}

export async function applyReasoningFramework(args: {
  problem: string;
  context?: string;
  focus_steps?: number[];
}): Promise<ToolResult> {
  const { problem, context, focus_steps } = args;

  // Ensure parameters are used for linting compliance
  void problem;
  void context;

  const allSteps: ReasoningStep[] = [
    {
      step: 1,
      title: 'Logical Dependencies and Constraints',
      description: 'Analyze policies, task order, prerequisites, and user constraints in order of importance',
      questions: [
        'What policies or mandatory rules apply?',
        'Does the task order need to be rearranged? (Check predecessor tasks)',
        'What prerequisites or information are needed?',
        'Are there explicit user constraints?'
      ],
      output: analyzeConstraints(problem, context)
    },
    {
      step: 2,
      title: 'Risk Assessment',
      description: 'Evaluate the consequences of actions and potential future problems',
      questions: [
        'Could this action cause problems in the future?',
        'Is this an exploration task or implementation task? (Determine risk level)',
        'What are compatibility, security, and performance risks?',
        'Is rollback possible?'
      ],
      output: assessRisks(problem, context)
    },
    {
      step: 3,
      title: 'Inductive Reasoning and Hypothesis Exploration',
      description: 'Generate hypotheses about the root cause of the problem and prioritize them',
      questions: [
        'What is the root cause beyond the immediate symptoms?',
        'How will each hypothesis be verified?',
        'Have low-probability causes been considered?'
      ],
      output: generateHypotheses(problem, context)
    },
    {
      step: 4,
      title: 'Result Evaluation and Adaptability',
      description: 'Adjust plans based on observation results',
      questions: [
        'Do previous observations require plan modifications?',
        'Have disproven hypotheses been discarded and new ones generated?',
        'Is backtracking needed when reaching dead ends?'
      ],
      output: evaluateAdaptability(problem, context)
    },
    {
      step: 5,
      title: 'Information Availability',
      description: 'Identify and utilize all information sources',
      questions: [
        'What tools are available? (MCP tools, file system, Git, etc.)',
        'What policy/rule documents need to be referenced? (CLAUDE.md, constitution.md)',
        'Have relevant information been found in previous conversations or memory?',
        'What information should be asked from users?'
      ],
      output: identifyInformationSources(problem, context)
    },
    {
      step: 6,
      title: 'Precision and Evidence',
      description: 'Provide accurate evidence for claims',
      questions: [
        'Have policies been cited accurately?',
        'Have code references included file:line format?',
        'Are numbers and metrics accurate?'
      ],
      output: ensurePrecision(problem, context)
    },
    {
      step: 7,
      title: 'Completeness',
      description: 'Integrate all requirements, options, and preferences',
      questions: [
        'Have conflicting requirements been resolved by importance order?',
        'Have multiple options been considered without early fixation?',
        'Have all relevant information sources been reviewed?'
      ],
      output: ensureCompleteness(problem, context)
    },
    {
      step: 8,
      title: 'Persistence and Perseverance',
      description: 'Continue until all reasoning is exhausted',
      questions: [
        'Have temporary errors been retried?',
        'Have clear limits been reached (retry limits, timeouts)?',
        'Have strategies been changed without repeating same failures?'
      ],
      output: demonstratePersistence(problem, context)
    },
    {
      step: 9,
      title: 'Response Suppression',
      description: 'Only respond after reasoning is complete',
      questions: [
        'Has all reasoning above been completed?',
        'Has the reasoning process been documented?',
        'Is only one major action performed at a time?'
      ],
      output: planExecution(problem, context)
    }
  ];

  // Filter steps if focus_steps is provided
  const stepsToApply = focus_steps && focus_steps.length > 0
    ? allSteps.filter(s => focus_steps.includes(s.step))
    : allSteps;

  const result = {
    problem,
    context: context || 'No additional context provided',
    steps_applied: stepsToApply.length,
    framework_steps: stepsToApply,
    summary: generateSummary(problem, stepsToApply)
  };

  const output = formatOutput(result);

  return {
    content: [{ type: 'text', text: output }]
  };
}

// Helper methods
function analyzeConstraints(problem: string, context?: string): string {
  return `**Constraint Analysis**:
- Policies/Rules: ${context ? 'Project context verification required' : 'CLAUDE.md, constitution.md verification required'}
- Task Order: Predecessor task identification required (consider DB → Backend → Frontend pattern)
- Prerequisites: Verify essential information/tools for ${problem}
- User Constraints: Apply explicit requirements first`;
}

function assessRisks(problem: string, context?: string): string {
  const isExploration = problem.toLowerCase().includes('find') ||
                        problem.toLowerCase().includes('analyze') ||
                        problem.toLowerCase().includes('check') ||
                        problem.toLowerCase().includes('find') ||
                        problem.toLowerCase().includes('analyze');

  return `**Risk Assessment**:
- Task Type: ${isExploration ? 'Exploration task (low risk)' : 'Implementation task (high risk)'}
- Rollback Possibility: ${isExploration ? 'High' : 'Verification required'}
- Compatibility Risk: Review potential conflicts with existing code
- Security Risk: Review SQL Injection, XSS, sensitive information exposure
- Performance Risk: Review N+1 queries, memory leaks, unnecessary re-renders`;
}

function generateHypotheses(problem: string, context?: string): string {
  return `**Hypothesis Generation**:
1. **Hypothesis 1** (Probability: High)
   - Evidence: Most direct cause of ${problem}
   - Verification: Confirm through [tool/file]
2. **Hypothesis 2** (Probability: Medium)
   - Evidence: Indirect factors or environmental differences
   - Verification: Additional information collection required
3. **Hypothesis 3** (Probability: Low)
   - Evidence: Edge cases or rare situations
   - Verification: Review if other hypotheses are disproven

**Priority**: Verify in order of probability, but don't completely exclude low probability options`;
}

function evaluateAdaptability(problem: string, context?: string): string {
  return `**Adaptability Assessment**:
- Reflect observation results: Check if plan needs modification based on new information
- Hypothesis updates: Discard disproven hypotheses, generate new ones
- Backtracking: Return to previous steps when reaching dead ends to explore different paths
- Plan re-evaluation: Periodically review if overall approach is still valid`;
}

function identifyInformationSources(problem: string, context?: string): string {
  return `**Information Sources**:
1. **Tools**:
   - MCP tools (hi-ai 38 tools)
   - File system (Read, Write, Edit, Glob, Grep)
   - Git, package managers
2. **Policies/Rules**:
   - CLAUDE.md (tech stack, architecture)
   - .vibe/constitution.md (project rules)
   - skills/ folder (quality standards, coding conventions)
3. **Memory**:
   - recall_memory (previous session information)
   - restore_session_context (context restoration)
4. **User Confirmation**:
   - Business logic details
   - Design preferences
   - Priority decisions`;
}

function ensurePrecision(problem: string, context?: string): string {
  return `**Precision Assurance**:
- Policy citations: Explicitly state "According to CLAUDE.md:12..."
- Code references: Include file:line format like "User model in users.py:45"
- Numeric accuracy: Express complexity, coverage, performance metrics with exact figures
- Evidence presentation: Clearly state sources and evidence for all claims`;
}

function ensureCompleteness(problem: string, context?: string): string {
  return `**Completeness Assurance**:
- Conflict resolution: Policy → Task order → Prerequisites → User preferences priority order
- Option exploration: Don't fixate on single solution early, review multiple alternatives
- Information review: Thoroughly review all relevant information sources (#5)
- User confirmation: Don't assume uncertain parts, confirm instead`;
}

function demonstratePersistence(problem: string, context?: string): string {
  return `**Persistence Strategy**:
- Temporary errors: Retry with exponential backoff (e.g., 1s, 2s, 4s...)
- Limit recognition: Set clear retry limits, stop when timeout reached
- Strategy changes: Don't repeat same failures → Try different approaches
- Thorough analysis: Complete all reasoning steps even if time-consuming`;
}

function planExecution(problem: string, context?: string): string {
  return `**Execution Plan**:
1. **Document reasoning**: Briefly explain reasoning process for complex decisions
2. **Step-by-step execution**: Perform only one major action at a time
3. **Result verification**: Confirm results of each action before proceeding to next step
4. **Rollback preparation**: Prepare to restore to previous state if issues occur`;
}

function generateSummary(problem: string, steps: ReasoningStep[]): string {
  return `Applied 9-step reasoning framework to "${problem}".
Systematically analyzed ${steps.length} steps to comprehensively review logical dependencies, risks, hypotheses, and information sources.`;
}

function formatOutput(result: any): string {
  let output = `# Reasoning Framework Analysis\n\n`;
  output += `**Problem**: ${result.problem}\n`;
  output += `**Context**: ${result.context}\n`;
  output += `**Applied Steps**: ${result.steps_applied}/9\n\n`;
  output += `---\n\n`;

  for (const step of result.framework_steps) {
    output += `## ${step.step}. ${step.title}\n\n`;
    output += `${step.description}\n\n`;
    output += `**Key Questions**:\n`;
    step.questions.forEach((q: string) => {
      output += `- ${q}\n`;
    });
    output += `\n${step.output}\n\n`;
    output += `---\n\n`;
  }

  output += `## Summary\n\n${result.summary}`;

  return output;
}

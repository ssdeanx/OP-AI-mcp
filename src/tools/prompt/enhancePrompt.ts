// Prompt enhancement tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const enhancePromptDefinition: ToolDefinition = {
  name: 'enhance_prompt',
  description: 'be specific|more detail|clarify|elaborate|vague|transform - Transform vague requests into clear, actionable prompts',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Original prompt to enhance' },
      context: { type: 'string', description: 'Additional context or project information' },
      enhancement_type: {
        type: 'string',
        enum: ['clarity', 'specificity', 'context', 'all'],
        description: 'Type of enhancement (default: all)'
      }
    },
    required: ['prompt']
  },
  annotations: {
    title: 'Enhance Prompt',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function enhancePrompt(args: { prompt: string; context?: string; enhancement_type?: string }): Promise<ToolResult> {
  const { prompt, context = '', enhancement_type = 'all' } = args;
  
  // Enhancement logic
  const enhancements: Record<string, string[]> = {
    clarity: [],
    specificity: [],
    context: [],
    structure: []
  };
  
  // Analyze original prompt
  const promptLength = prompt.length;
  const hasQuestion = prompt.includes('?');
  const hasSpecificTerms = /\b(implement|develop|modify|analyze|debug|refactor)\b/i.test(prompt);
  
  // Apply enhancements based on type
  if (enhancement_type === 'clarity' || enhancement_type === 'all') {
    if (promptLength < 20) {
      enhancements.clarity.push('Add more specific description');
    }
    if (!hasQuestion && !hasSpecificTerms) {
      enhancements.clarity.push('Convert to clear request or question format');
    }
  }
  
  if (enhancement_type === 'specificity' || enhancement_type === 'all') {
    if (!prompt.match(/\b(language|framework|library|version)\b/i)) {
      enhancements.specificity.push('Specify technology stack');
    }
    if (!prompt.match(/\b(input|output|result|format)\b/i)) {
      enhancements.specificity.push('Define expected input/output');
    }
  }
  
  if (enhancement_type === 'context' || enhancement_type === 'all') {
    if (!prompt.match(/\b(purpose|reason|background|situation)\b/i)) {
      enhancements.context.push('Add task purpose and background');
    }
    if (context) {
      enhancements.context.push('Integrate provided context');
    }
  }
  
  // Generate enhanced prompt
  let enhancedPrompt = prompt;
  
  // Build enhanced version
  const components = [];
  
  // Add objective
  components.push(`**Objective**: ${prompt}`);
  
  // Add context if provided
  if (context) {
    components.push(`**Background**: ${context}`);
  }
  
  // Add specific requirements based on analysis
  const requirements = [];
  if (enhancements.specificity.includes('Specify technology stack')) {
    requirements.push('- Please specify the language/framework to use');
  }
  if (enhancements.specificity.includes('Define expected input/output')) {
    requirements.push('- Describe the expected input and output format');
  }
  
  if (requirements.length > 0) {
    components.push(`**Requirements**:\n${requirements.join('\n')}`);
  }
  
  // Add quality considerations
  const quality = [
    '- Include error handling',
    '- Make it testable',
    '- Design for extensibility'
  ];
  components.push(`**Quality Standards**:\n${quality.join('\n')}`);
  
  enhancedPrompt = components.join('\n\n');
  
  const result = {
    action: 'enhance_prompt',
    original: prompt,
    enhanced: enhancedPrompt,
    enhancements,
    improvements: [
      enhancements.clarity.length > 0 ? `Clarity improvement (${enhancements.clarity.length})` : null,
      enhancements.specificity.length > 0 ? `Specificity added (${enhancements.specificity.length})` : null,
      enhancements.context.length > 0 ? `Context enhanced (${enhancements.context.length})` : null
    ].filter(Boolean),
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Original: ${prompt}\n\nEnhanced:\n${enhancedPrompt}\n\nImprovements: ${result.improvements.join(', ')}` }]
  };
}

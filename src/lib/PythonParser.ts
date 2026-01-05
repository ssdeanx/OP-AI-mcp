// Python code parser utility for v1.3
// Uses Python's ast module via subprocess

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, unlinkSync } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import path from 'node:path';
import os from 'os';

const execAsync = promisify(exec);

// Determine Python command based on platform
function getPythonCommand(): string {
  if (process.platform === 'win32') {
    // Try common Windows Python locations
    const pythonPaths = [
      `${process.env.LOCALAPPDATA}\\Programs\\Python\\Python312\\python.exe`,
      `${process.env.LOCALAPPDATA}\\Programs\\Python\\Python311\\python.exe`,
      `${process.env.LOCALAPPDATA}\\Programs\\Python\\Python310\\python.exe`,
      'py',  // Python Launcher
      'python'
    ];

    for (const pythonPath of pythonPaths) {
      try {
        if (pythonPath.includes('\\') && existsSync(pythonPath)) {
          return `"${pythonPath}"`;
        }
      } catch {
        continue;
      }
    }
    return 'python';
  }
  return 'python3';
}

const PYTHON_CMD = getPythonCommand();

export interface PythonSymbol {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'import';
  line: number;
  column: number;
  endLine?: number;
  docstring?: string;
}

export interface PythonComplexity {
  cyclomaticComplexity: number;
  functions: Array<{
    name: string;
    complexity: number;
    line: number;
  }>;
  classes: Array<{
    name: string;
    methods: number;
    line: number;
  }>;
}

type PythonSymbolsResult = { success: true; symbols: PythonSymbol[] };
type PythonComplexityResult = { success: true } & PythonComplexity;
type PythonErrorResult = { success: false; error: string };

export class PythonParser {
  private static cleanupRegistered = false;

  private static isPythonExecError(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === 'object' && error !== null && 'code' in error;
  }

  private static pythonScript = `
import ast
import sys
import json

def analyze_code(code):
    try:
        tree = ast.parse(code)
        symbols = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                symbols.append({
                    'name': node.name,
                    'kind': 'function',
                    'line': node.lineno,
                    'column': node.col_offset,
                    'endLine': node.end_lineno,
                    'docstring': ast.get_docstring(node)
                })
            elif isinstance(node, ast.ClassDef):
                symbols.append({
                    'name': node.name,
                    'kind': 'class',
                    'line': node.lineno,
                    'column': node.col_offset,
                    'endLine': node.end_lineno,
                    'docstring': ast.get_docstring(node)
                })
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        symbols.append({
                            'name': target.id,
                            'kind': 'variable',
                            'line': node.lineno,
                            'column': node.col_offset
                        })
            elif isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    symbols.append({
                        'name': alias.name,
                        'kind': 'import',
                        'line': node.lineno,
                        'column': node.col_offset
                    })

        return {'success': True, 'symbols': symbols}
    except SyntaxError as e:
        return {'success': False, 'error': str(e)}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def calculate_complexity(code):
    try:
        tree = ast.parse(code)

        def cyclomatic_complexity(node):
            complexity = 1
            for child in ast.walk(node):
                if isinstance(child, (ast.If, ast.For, ast.While, ast.And, ast.Or, ast.ExceptHandler)):
                    complexity += 1
                elif isinstance(child, ast.BoolOp):
                    complexity += len(child.values) - 1
            return complexity

        functions = []
        classes = []
        total_complexity = 1

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                func_complexity = cyclomatic_complexity(node)
                functions.append({
                    'name': node.name,
                    'complexity': func_complexity,
                    'line': node.lineno
                })
                total_complexity += func_complexity
            elif isinstance(node, ast.ClassDef):
                method_count = sum(1 for n in node.body if isinstance(n, ast.FunctionDef))
                classes.append({
                    'name': node.name,
                    'methods': method_count,
                    'line': node.lineno
                })

        return {
            'success': True,
            'cyclomaticComplexity': total_complexity,
            'functions': functions,
            'classes': classes
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    code = sys.stdin.read()
    action = sys.argv[1] if len(sys.argv) > 1 else 'symbols'

    if action == 'symbols':
        result = analyze_code(code)
    elif action == 'complexity':
        result = calculate_complexity(code)
    else:
        result = {'success': False, 'error': 'Unknown action'}

    print(json.dumps(result))
`;

  // Singleton Python script path to avoid recreating it
  private static scriptPath: string | null = null;

  /**
   * Register cleanup handlers on first use
   */
  private static registerCleanup(): void {
    if (this.cleanupRegistered) {
      return;
    }

    this.cleanupRegistered = true;

    // Cleanup on normal exit
    process.on('exit', () => {
      if (this.scriptPath) {
        try {
          unlinkSync(this.scriptPath);
        } catch {
          // Ignore errors during cleanup
        }
      }
    });

    // Cleanup on SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      this.cleanup().then(() => process.exit(0));
    });

    // Cleanup on SIGTERM
    process.on('SIGTERM', () => {
      this.cleanup().then(() => process.exit(0));
    });

    // Cleanup on uncaught exception
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      this.cleanup().then(() => process.exit(1));
    });
  }

  /**
   * Initialize Python script (singleton pattern)
   */
  private static async ensureScriptExists(): Promise<string> {
    if (this.scriptPath) {
      return this.scriptPath;
    }

    // Register cleanup handlers on first use
    this.registerCleanup();

    this.scriptPath = path.join(os.tmpdir(), `hi-ai-parser-${process.pid}.py`);
    await writeFile(this.scriptPath, this.pythonScript);
    return this.scriptPath;
  }

  /**
   * Execute Python code analysis with improved memory management
   */
  private static async executePython(code: string, action: 'symbols'): Promise<PythonSymbolsResult>;
  private static async executePython(code: string, action: 'complexity'): Promise<PythonComplexityResult>;
  private static async executePython(code: string, action: 'symbols' | 'complexity'): Promise<PythonSymbolsResult | PythonComplexityResult> {
    let codePath: string | null = null;

    try {
      const scriptPath = await this.ensureScriptExists();

      // Write code to temp file with unique name
      codePath = path.join(os.tmpdir(), `hi-ai-code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.py`);
      await writeFile(codePath, code);

      // Execute Python script
      const { stdout, stderr } = await execAsync(`${PYTHON_CMD} "${scriptPath}" ${action} < "${codePath}"`, {
        maxBuffer: 10 * 1024 * 1024, // 10MB
        timeout: 30000 // 30 second timeout
      });

      if (stderr && !stderr.includes('DeprecationWarning')) {
        console.error('Python stderr:', stderr);
      }

      const parsed: unknown = JSON.parse(stdout);

      if (!parsed || typeof parsed !== 'object' || !('success' in parsed)) {
        throw new Error(`Python ${action} analysis failed`);
      }

      const base = parsed as { success: boolean };
      if (!base.success) {
        const err = parsed as PythonErrorResult;
        throw new Error(err.error || `Python ${action} analysis failed`);
      }

      if (action === 'symbols') {
        return parsed as PythonSymbolsResult;
      }

      return parsed as PythonComplexityResult;
    } catch (error) {
      if (this.isPythonExecError(error) && error.code === 'ENOENT') {
        throw new Error('Python 3 not found. Please install Python 3 to analyze Python code.');
      }
      throw error;
    } finally {
      // Always cleanup code temp file immediately
      if (codePath) {
        await unlink(codePath).catch(() => {});
      }
    }
  }

  /**
   * Fast heuristic symbol finder using regular expressions.
   * This provides a lightweight, dependency-free fast-path for common symbol lookups.
   */
  private static findSymbolsFast(code: string): PythonSymbol[] {
    const symbols: PythonSymbol[] = [];

    const getPos = (idx: number) => {
      const before = code.slice(0, idx);
      const line = before.split('\n').length;
      const col = idx - before.lastIndexOf('\n') - 1;
      return { line, column: col };
    };

    // Functions
    const funcRe = /^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(.*?\)\s*:/gm;
    let m: RegExpExecArray | null;
    while ((m = funcRe.exec(code)) !== null) {
      const pos = getPos(m.index);
      symbols.push({ name: m[1], kind: 'function', line: pos.line, column: pos.column });
    }

    // Classes
    const classRe = /^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)\b/gm;
    while ((m = classRe.exec(code)) !== null) {
      const pos = getPos(m.index);
      symbols.push({ name: m[1], kind: 'class', line: pos.line, column: pos.column });
    }

    // Simple variable assignments (module-level)
    const varRe = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*[^=].*$/gm;
    while ((m = varRe.exec(code)) !== null) {
      const lineStart = code.lastIndexOf('\n', m.index) + 1;
      const line = code.slice(lineStart, m.index + m[0].length);
      // Skip assignments that are likely function or class headers
      if (/^\s*(def|class|import|from)\b/.test(line)) continue;
      const pos = getPos(m.index);
      symbols.push({ name: m[1], kind: 'variable', line: pos.line, column: pos.column });
    }

    // Imports
    const importRe = /^(?:\s*import\s+([A-Za-z0-9_\\.]+)|\s*from\s+([A-Za-z0-9_\\.]+)\s+import\s+([A-Za-z0-9_*,\s]+))/gm;
    while ((m = importRe.exec(code)) !== null) {
      const name = m[1] || m[3] || m[2];
      if (!name) continue;
      const pos = getPos(m.index);
      // when 'from X import A, B' m[3] contains the imported names - capture them
      if (m[3]) {
        for (const part of m[3].split(',')) {
          const nm = part.trim().split(' as ')[0];
          if (nm) symbols.push({ name: nm, kind: 'import', line: pos.line, column: pos.column });
        }
      } else {
        symbols.push({ name, kind: 'import', line: pos.line, column: pos.column });
      }
    }

    return symbols;
  }

  public static async findSymbols(code: string): Promise<PythonSymbol[]> {
    // Try a fast regex-based pass first (very fast, no deps). If it finds results, return them.
    // For more thorough analysis, callers can still call analyzeComplexity or the Python AST-based path.
    try {
      const fast = this.findSymbolsFast(code);
      if (fast.length > 0) return fast;
    } catch (e) {
      // ignore and fallback
    }

    const result = await this.executePython(code, 'symbols');
    return result.symbols || [];
  }

  public static async analyzeComplexity(code: string): Promise<PythonComplexity> {
    const result = await this.executePython(code, 'complexity');
    return {
      cyclomaticComplexity: result.cyclomaticComplexity || 1,
      functions: result.functions || [],
      classes: result.classes || []
    };
  }

  /**
   * Cleanup singleton script on process exit
   */
  public static async cleanup(): Promise<void> {
    if (this.scriptPath) {
      await unlink(this.scriptPath).catch(() => {});
      this.scriptPath = null;
    }
  }

  public static isPythonFile(filePath: string): boolean {
    return filePath.endsWith('.py');
  }

  public static isPythonCode(code: string): boolean {
    // Heuristic: Check for Python-specific patterns
    const pythonPatterns = [
      /^import\s+\w+/m,
      /^from\s+\w+\s+import/m,
      /^def\s+\w+\s*\(/m,
      /^class\s+\w+/m,
      /^if\s+__name__\s*==\s*['"]__main__['"]/m
    ];

    return pythonPatterns.some(pattern => pattern.test(code));
  }
}

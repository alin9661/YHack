import type { ToolRegistryEntry, AnthropicTool } from "@/types";

export class ToolRegistry {
  private tools = new Map<string, ToolRegistryEntry>();

  register(entry: ToolRegistryEntry): void {
    this.tools.set(entry.name, entry);
  }

  get(name: string): ToolRegistryEntry | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolRegistryEntry[] {
    return Array.from(this.tools.values());
  }

  /**
   * Build Anthropic-format tool manifest from all registered tools.
   * This is passed directly to the Claude API as the `tools` parameter.
   */
  buildManifest(): AnthropicTool[] {
    return this.getAll().map((entry) => ({
      name: entry.name,
      description: entry.description,
      input_schema: entry.parameters,
    }));
  }

  get size(): number {
    return this.tools.size;
  }
}

// Singleton registry instance
let _registry: ToolRegistry | null = null;

export function getRegistry(): ToolRegistry {
  if (!_registry) {
    _registry = new ToolRegistry();
    // Register tools from config
    const { TOOL_DEFINITIONS } = require("@/config/tools");
    for (const tool of TOOL_DEFINITIONS) {
      _registry.register(tool);
    }
  }
  return _registry;
}

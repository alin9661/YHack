import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface MCPServerConfig {
  name: string;
  transport: "stdio";
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface MCPConnection {
  client: Client;
  transport: StdioClientTransport;
  config: MCPServerConfig;
}

class MCPManager {
  private connections = new Map<string, MCPConnection>();

  async connect(config: MCPServerConfig): Promise<void> {
    if (this.connections.has(config.name)) {
      return; // Already connected
    }

    console.log(`[mcp] Connecting to ${config.name}: ${config.command} ${config.args.join(" ")}`);

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: {
        ...process.env,
        ...config.env,
      } as Record<string, string>,
    });

    const client = new Client(
      { name: "lava-orchestrator", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);

    this.connections.set(config.name, { client, transport, config });
    console.log(`[mcp] Connected to ${config.name}`);
  }

  async executeTool(
    serverName: string,
    toolName: string,
    input: Record<string, unknown>
  ): Promise<unknown> {
    const conn = this.connections.get(serverName);
    if (!conn) {
      throw new Error(`MCP server "${serverName}" not connected`);
    }

    console.log(`[mcp] Calling ${serverName}/${toolName}`, input);

    const result = await conn.client.callTool({
      name: toolName,
      arguments: input,
    });

    // Extract content from MCP result
    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content.find(
        (c: { type: string }) => c.type === "text"
      );
      if (textContent && "text" in textContent) {
        try {
          return JSON.parse(textContent.text as string);
        } catch {
          return { text: textContent.text };
        }
      }
    }

    return result;
  }

  async disconnect(serverName: string): Promise<void> {
    const conn = this.connections.get(serverName);
    if (conn) {
      await conn.transport.close();
      this.connections.delete(serverName);
      console.log(`[mcp] Disconnected from ${serverName}`);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const name of this.connections.keys()) {
      await this.disconnect(name);
    }
  }

  isConnected(serverName: string): boolean {
    return this.connections.has(serverName);
  }
}

// Singleton instance
let _manager: MCPManager | null = null;

export function getMCPManager(): MCPManager {
  if (!_manager) {
    _manager = new MCPManager();
  }
  return _manager;
}

// MCP server configurations
export const MCP_SERVER_CONFIGS: MCPServerConfig[] = [
  {
    name: "signals",
    transport: "stdio",
    command: "npx",
    args: ["tsx", "src/mcp-servers/signals/index.ts"],
    env: {
      LAVA_SECRET_KEY: process.env.LAVA_SECRET_KEY || "",
      DEFAULT_MODEL: process.env.DEFAULT_MODEL || "claude-sonnet-4-20250514",
    },
  },
];

/**
 * Initialize all configured MCP servers.
 * Called once on first orchestrator invocation.
 */
export async function initMCPServers(): Promise<void> {
  const manager = getMCPManager();
  for (const config of MCP_SERVER_CONFIGS) {
    try {
      await manager.connect(config);
    } catch (error) {
      console.error(`[mcp] Failed to connect to ${config.name}:`, error);
    }
  }
}

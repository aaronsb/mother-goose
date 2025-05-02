#!/usr/bin/env node

/**
 * Mother Goose MCP Server
 * 
 * This MCP server allows an agent to call Goose and manage child processes (goslings).
 * It provides tools for running Goose commands and resources for accessing process information.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { spawn, ChildProcess } from "child_process";
import { randomUUID } from "crypto";


/**
 * Interface for a Gosling process
 */
interface Gosling {
  id: string;
  prompt: string;
  options: string[];
  process: ChildProcess;
  status: "running" | "completed" | "error";
  output: string;
  error: string;
  startTime: Date;
  endTime?: Date;
}

/**
 * Process manager for Goose processes
 */
class GoslingManager {
  private goslings: Map<string, Gosling> = new Map();

  /**
   * Run a new Goose process with the given prompt and options
   */
  async runGoose(prompt: string, options: string[] = []): Promise<Gosling> {
    const id = randomUUID();
    
    // Build the command arguments
    const args = ["run"];
    
    // Add any options (like -t for text-only mode)
    if (options && options.length > 0) {
      args.push(...options);
    }
    
    // Add the --text option and prompt
    args.push("--text", prompt);
    
    console.error(`Starting Goose process: goose ${args.join(" ")}`);
    
    // Get the current environment variables and set non-ANSI terminal environment
    const env = { 
      ...process.env,
      DBUS_SESSION_BUS_ADDRESS: "unix:path=/run/user/1000/bus",
      // Disable ANSI color output
      TERM: "dumb",
      NO_COLOR: "1",
      CLICOLOR: "0",
      FORCE_COLOR: "0"
    };
    
    console.error("Environment variables:", JSON.stringify({ 
      DBUS_SESSION_BUS_ADDRESS: env.DBUS_SESSION_BUS_ADDRESS,
      TERM: env.TERM,
      NO_COLOR: env.NO_COLOR,
      CLICOLOR: env.CLICOLOR,
      FORCE_COLOR: env.FORCE_COLOR
    }));
    
    // Spawn the Goose process with the parent's environment
    const gooseProcess = spawn("goose", args, { env });
    
    // Create a new Gosling object
    const gosling: Gosling = {
      id,
      prompt,
      options,
      process: gooseProcess,
      status: "running",
      output: "",
      error: "",
      startTime: new Date()
    };
    
    // Store the Gosling
    this.goslings.set(id, gosling);
    
    // Collect stdout
    gooseProcess.stdout.on("data", (data) => {
      gosling.output += data.toString();
    });
    
    // Collect stderr
    gooseProcess.stderr.on("data", (data) => {
      gosling.error += data.toString();
    });
    
    // Handle process exit
    gooseProcess.on("exit", (code) => {
      gosling.endTime = new Date();
      gosling.status = code === 0 ? "completed" : "error";
      console.error(`Goose process ${id} exited with code ${code}`);
    });
    
    // Handle process error
    gooseProcess.on("error", (err) => {
      gosling.error += err.message;
      gosling.status = "error";
      console.error(`Goose process ${id} error: ${err.message}`);
    });
    
    return gosling;
  }
  
  /**
   * Get a Gosling by ID
   */
  getGosling(id: string): Gosling | undefined {
    return this.goslings.get(id);
  }
  
  /**
   * Get all Goslings
   */
  getAllGoslings(): Gosling[] {
    return Array.from(this.goslings.values());
  }
  
  /**
   * Terminate a Gosling process
   */
  terminateGosling(id: string): boolean {
    const gosling = this.goslings.get(id);
    if (!gosling) {
      return false;
    }
    
    if (gosling.status === "running") {
      gosling.process.kill();
      gosling.status = "completed";
      gosling.endTime = new Date();
    }
    
    return true;
  }
}

// Create the Gosling manager
const goslingManager = new GoslingManager();

/**
 * Create an MCP server with capabilities for resources and tools
 */
const server = new Server(
  {
    name: "mother-goose",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * Handler for listing available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const goslings = goslingManager.getAllGoslings();
  
  return {
    resources: [
      {
        uri: "goslings://list",
        mimeType: "application/json",
        name: "List of all gosling processes",
        description: "Information about all running and completed Goose processes"
      },
      ...goslings.map(gosling => ({
        uri: `goslings://${gosling.id}`,
        mimeType: "application/json",
        name: `Gosling ${gosling.id.substring(0, 8)}`,
        description: `Goose process for prompt: "${gosling.prompt.substring(0, 50)}${gosling.prompt.length > 50 ? '...' : ''}"`
      }))
    ]
  };
});

/**
 * Handler for resource templates
 */
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return {
    resourceTemplates: [
      {
        uriTemplate: "goslings://{process_id}",
        name: "Gosling process details",
        mimeType: "application/json",
        description: "Details about a specific Goose process"
      },
      {
        uriTemplate: "goslings://{process_id}/output",
        name: "Gosling process output",
        mimeType: "text/plain",
        description: "Output from a specific Goose process"
      }
    ]
  };
});

/**
 * Handler for reading resources
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  // Handle goslings://list resource
  if (uri === "goslings://list") {
    const goslings = goslingManager.getAllGoslings();
    const goslingList = goslings.map(g => ({
      id: g.id,
      prompt: g.prompt,
      status: g.status,
      startTime: g.startTime.toISOString(),
      endTime: g.endTime ? g.endTime.toISOString() : null,
      hasOutput: g.output.length > 0,
      hasError: g.error.length > 0
    }));
    
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(goslingList, null, 2)
      }]
    };
  }
  
  // Handle goslings://{process_id} resource
  const processIdMatch = uri.match(/^goslings:\/\/([^\/]+)$/);
  if (processIdMatch) {
    const processId = processIdMatch[1];
    const gosling = goslingManager.getGosling(processId);
    
    if (!gosling) {
      throw new McpError(ErrorCode.InvalidRequest, `Gosling process ${processId} not found`);
    }
    
    const goslingInfo = {
      id: gosling.id,
      prompt: gosling.prompt,
      options: gosling.options,
      status: gosling.status,
      startTime: gosling.startTime.toISOString(),
      endTime: gosling.endTime ? gosling.endTime.toISOString() : null,
      outputLength: gosling.output.length,
      errorLength: gosling.error.length
    };
    
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(goslingInfo, null, 2)
      }]
    };
  }
  
  // Handle goslings://{process_id}/output resource
  const outputMatch = uri.match(/^goslings:\/\/([^\/]+)\/output$/);
  if (outputMatch) {
    const processId = outputMatch[1];
    const gosling = goslingManager.getGosling(processId);
    
    if (!gosling) {
      throw new McpError(ErrorCode.InvalidRequest, `Gosling process ${processId} not found`);
    }
    
    let output = gosling.output;
    
    // If there's an error, append it to the output
    if (gosling.error) {
      output += "\n\nERROR:\n" + gosling.error;
    }
    
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: output
      }]
    };
  }
  
  throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
});

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_goose",
        description: "Run a Goose command with the specified prompt",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The prompt to send to Goose"
            },
            options: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Optional parameters for Goose (e.g., [\"-t\"] for text-only mode)"
            }
          },
          required: ["prompt"]
        }
      },
      {
        name: "list_goslings",
        description: "List all running and completed Goose processes",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["all", "running", "completed", "error"],
              description: "Filter goslings by status"
            }
          }
        }
      },
      {
        name: "get_gosling_output",
        description: "Get the current output from a specific gosling process",
        inputSchema: {
          type: "object",
          properties: {
            process_id: {
              type: "string",
              description: "ID of the gosling process"
            }
          },
          required: ["process_id"]
        }
      },
      {
        name: "terminate_gosling",
        description: "Terminate a specific gosling process",
        inputSchema: {
          type: "object",
          properties: {
            process_id: {
              type: "string",
              description: "ID of the gosling process to terminate"
            }
          },
          required: ["process_id"]
        }
      }
    ]
  };
});

/**
 * Handler for tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "run_goose": {
      const prompt = String(request.params.arguments?.prompt || "");
      const options = Array.isArray(request.params.arguments?.options) 
        ? request.params.arguments?.options.map(String)
        : [];
      
      if (!prompt) {
        throw new McpError(ErrorCode.InvalidParams, "Prompt is required");
      }
      
      try {
        const gosling = await goslingManager.runGoose(prompt, options);
        
        return {
          content: [{
            type: "text",
            text: `Started Goose process with ID: ${gosling.id}\nPrompt: "${prompt}"\nThe process is now running. You can check its status and output using the get_gosling_output tool or the goslings://${gosling.id}/output resource.`
          }]
        };
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Failed to start Goose process: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    case "list_goslings": {
      const statusFilter = String(request.params.arguments?.status || "all");
      const goslings = goslingManager.getAllGoslings();
      
      let filteredGoslings = goslings;
      if (statusFilter !== "all") {
        filteredGoslings = goslings.filter(g => g.status === statusFilter);
      }
      
      const goslingList = filteredGoslings.map(g => ({
        id: g.id,
        prompt: g.prompt,
        status: g.status,
        startTime: g.startTime.toISOString(),
        endTime: g.endTime ? g.endTime.toISOString() : null,
        runtime: g.endTime 
          ? ((g.endTime.getTime() - g.startTime.getTime()) / 1000).toFixed(2) + "s"
          : ((new Date().getTime() - g.startTime.getTime()) / 1000).toFixed(2) + "s (running)",
        hasOutput: g.output.length > 0,
        hasError: g.error.length > 0
      }));
      
      return {
        content: [{
          type: "text",
          text: `Found ${goslingList.length} gosling processes${statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}:\n\n${
            goslingList.length > 0 
              ? JSON.stringify(goslingList, null, 2)
              : "No gosling processes found."
          }`
        }]
      };
    }
    
    case "get_gosling_output": {
      const processId = String(request.params.arguments?.process_id || "");
      
      if (!processId) {
        throw new McpError(ErrorCode.InvalidParams, "Process ID is required");
      }
      
      const gosling = goslingManager.getGosling(processId);
      if (!gosling) {
        throw new McpError(ErrorCode.InvalidRequest, `Gosling process ${processId} not found`);
      }
      
      let output = gosling.output || "No output yet.";
      
      // If there's an error, append it to the output
      if (gosling.error) {
        output += "\n\nERROR:\n" + gosling.error;
      }
      
      return {
        content: [{
          type: "text",
          text: `Output from gosling ${processId} (status: ${gosling.status}):\n\n${output}`
        }]
      };
    }
    
    case "terminate_gosling": {
      const processId = String(request.params.arguments?.process_id || "");
      
      if (!processId) {
        throw new McpError(ErrorCode.InvalidParams, "Process ID is required");
      }
      
      const success = goslingManager.terminateGosling(processId);
      if (!success) {
        throw new McpError(ErrorCode.InvalidRequest, `Gosling process ${processId} not found`);
      }
      
      return {
        content: [{
          type: "text",
          text: `Successfully terminated gosling process ${processId}`
        }]
      };
    }
    
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  }
});

/**
 * Start the server using stdio transport
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mother Goose MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

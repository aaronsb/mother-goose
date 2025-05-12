/**
 * Handler functions for MCP server requests
 */
import {
  McpError,
  ErrorCode,
  ReadResourceRequest
} from "@modelcontextprotocol/sdk/types.js";
import { GoslingManager } from './gosling-manager.js';
import { formatDate, formatDuration } from './utils.js';

/**
 * Handler for listing available resources
 */
export async function handleListResources(
  goslingManager: GoslingManager
): Promise<any> {
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
}

/**
 * Handler for resource templates
 */
export async function handleListResourceTemplates(): Promise<any> {
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
}

/**
 * Handler for reading resources
 */
export async function handleReadResource(
  goslingManager: GoslingManager, 
  request: ReadResourceRequest
): Promise<any> {
  const uri = request.params.uri;
  
  // Handle goslings://list resource
  if (uri === "goslings://list") {
    const goslings = goslingManager.getAllGoslings();
    const goslingList = goslings.map(g => ({
      id: g.id,
      prompt: g.prompt,
      status: g.status,
      startTime: formatDate(g.startTime),
      endTime: g.endTime ? formatDate(g.endTime) : null,
      duration: g.endTime 
        ? formatDuration(g.startTime, g.endTime)
        : formatDuration(g.startTime) + " (running)",
      hasOutput: g.output.length > 0,
      hasError: g.error.length > 0,
      outputPreview: g.output.length > 0 
        ? g.output.substring(0, 100) + (g.output.length > 100 ? '...' : '') 
        : null
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
  const processIdMatch = uri.match(/^goslings:\/\/([^/]+)$/);
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
      startTime: formatDate(gosling.startTime),
      endTime: gosling.endTime ? formatDate(gosling.endTime) : null,
      duration: gosling.endTime 
        ? formatDuration(gosling.startTime, gosling.endTime)
        : formatDuration(gosling.startTime) + " (running)",
      outputLength: gosling.output.length,
      errorLength: gosling.error.length,
      outputPreview: gosling.output.length > 0 
        ? gosling.output.substring(0, 100) + (gosling.output.length > 100 ? '...' : '') 
        : null
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
  const outputMatch = uri.match(/^goslings:\/\/([^/]+)\/output$/);
  if (outputMatch) {
    const processId = outputMatch[1];
    const gosling = goslingManager.getGosling(processId);
    
    if (!gosling) {
      throw new McpError(ErrorCode.InvalidRequest, `Gosling process ${processId} not found`);
    }
    
    let output = gosling.output || "No output yet.";
    
    // Add status information at the top
    const statusInfo = `# Gosling Process ID: ${gosling.id}
# Status: ${gosling.status}
# Started: ${formatDate(gosling.startTime)}
${gosling.endTime ? '# Ended: ' + formatDate(gosling.endTime) : '# Duration: ' + formatDuration(gosling.startTime) + ' (running)'}
# Prompt: ${gosling.prompt}

----- OUTPUT -----

`;
    
    output = statusInfo + output;
    
    // If there's an error, append it to the output
    if (gosling.error) {
      output += "\n\n----- ERROR -----\n\n" + gosling.error;
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
}

/**
 * Handler for listing available tools
 */
export async function handleListTools(): Promise<any> {
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
}

/**
 * Handler for tool calls
 */
export async function handleCallTool(
  goslingManager: GoslingManager,
  request: any
): Promise<any> {
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
        console.error(`Starting Goose process with prompt: "${prompt.substring(0, 30)}..."`);
        const gosling = await goslingManager.runGoose(prompt, options);
        
        return {
          content: [{
            type: "text",
            text: `Started Goose process with ID: ${gosling.id}

Prompt: "${prompt}"

The process is now running. You can check its status and output using:
- get_gosling_output tool with process_id="${gosling.id}"
- Resource URI: goslings://${gosling.id}/output

This child Goose process is working on your request in parallel.`
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
        prompt: g.prompt.length > 50 ? g.prompt.substring(0, 50) + "..." : g.prompt,
        status: g.status,
        startTime: formatDate(g.startTime),
        endTime: g.endTime ? formatDate(g.endTime) : null,
        runtime: g.endTime 
          ? formatDuration(g.startTime, g.endTime)
          : formatDuration(g.startTime) + " (running)",
        hasOutput: g.output.length > 0,
        hasError: g.error.length > 0
      }));
      
      // Create a more readable response
      const statusCounts = {
        running: filteredGoslings.filter(g => g.status === 'running').length,
        completed: filteredGoslings.filter(g => g.status === 'completed').length,
        error: filteredGoslings.filter(g => g.status === 'error').length
      };
      
      let response = `Found ${goslingList.length} gosling processes${statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}:\n\n`;
      
      if (statusFilter === "all") {
        response += `Status summary: ${statusCounts.running} running, ${statusCounts.completed} completed, ${statusCounts.error} error\n\n`;
      }
      
      if (goslingList.length === 0) {
        response += "No gosling processes found.";
      } else {
        // Format as a more readable list rather than raw JSON
        goslingList.forEach((g, i) => {
          response += `${i+1}. ID: ${g.id}\n`;
          response += `   Status: ${g.status}\n`;
          response += `   Runtime: ${g.runtime}\n`;
          response += `   Prompt: "${g.prompt}"\n`;
          if (i < goslingList.length - 1) response += "\n";
        });
        
        // Add instructions
        response += "\n\nTo view output from a specific process:\n";
        response += "Use the get_gosling_output tool with the process_id parameter.";
      }
      
      return {
        content: [{
          type: "text",
          text: response
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
      
      // Create a header with gosling information
      const header = `=== Gosling Process ${processId} ===
Status: ${gosling.status}
Started: ${formatDate(gosling.startTime)}
${gosling.endTime ? 'Ended: ' + formatDate(gosling.endTime) : 'Duration: ' + formatDuration(gosling.startTime) + ' (running)'}
Prompt: "${gosling.prompt}"

`;
      
      // If there's an error, append it to the output
      let errorInfo = "";
      if (gosling.error) {
        errorInfo = "\n\n=== ERROR ===\n" + gosling.error;
      }
      
      return {
        content: [{
          type: "text",
          text: header + output + errorInfo
        }]
      };
    }
    
    case "terminate_gosling": {
      const processId = String(request.params.arguments?.process_id || "");
      
      if (!processId) {
        throw new McpError(ErrorCode.InvalidParams, "Process ID is required");
      }
      
      const gosling = goslingManager.getGosling(processId);
      if (!gosling) {
        throw new McpError(ErrorCode.InvalidRequest, `Gosling process ${processId} not found`);
      }
      
      // Get status before termination
      const wasRunning = gosling.status === "running";
      const runtime = formatDuration(gosling.startTime, new Date());
      
      const success = goslingManager.terminateGosling(processId);
      if (!success) {
        throw new McpError(ErrorCode.InvalidRequest, `Failed to terminate gosling process ${processId}`);
      }
      
      return {
        content: [{
          type: "text",
          text: `Successfully ${wasRunning ? 'terminated' : 'cleaned up'} gosling process ${processId}
${wasRunning ? `The process was running for ${runtime} before termination.` : `The process had already completed with status: ${gosling.status}`}

You can still access its output using get_gosling_output or the resource URI: goslings://${processId}/output`
        }]
      };
    }
    
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  }
}
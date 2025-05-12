/**
 * Handler functions for MCP server requests
 */
import {
  McpError,
  ErrorCode,
  ReadResourceRequest
} from "@modelcontextprotocol/sdk/types.js";
import { GoslingManager, ActivityStatus } from './gosling-manager.js';
import { formatDate, formatDuration, formatFileSize } from './utils.js';

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
    
    // Format the prompt history
    const promptHistory = gosling.promptHistory
      ? gosling.promptHistory.map(entry => ({
          prompt: entry.prompt,
          timestamp: formatDate(entry.timestamp)
        }))
      : [{ prompt: gosling.prompt, timestamp: formatDate(gosling.startTime) }];

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
      promptHistory: promptHistory,
      promptCount: promptHistory.length,
      outputLineCount: gosling.outputLineCount || 0,
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
        description: "Get the current output from a specific gosling process with pagination support",
        inputSchema: {
          type: "object",
          properties: {
            process_id: {
              type: "string",
              description: "ID of the gosling process"
            },
            offset: {
              type: "number",
              description: "Line number to start from (0-indexed)"
            },
            limit: {
              type: "number",
              description: "Maximum number of lines to return"
            },
            full_output: {
              type: "boolean",
              description: "Return complete output regardless of size"
            }
          },
          required: ["process_id"]
        }
      },
      {
        name: "get_gosling_status",
        description: "Get a compact activity status report of goslings with their working/idle state",
        inputSchema: {
          type: "object",
          properties: {
            process_id: {
              type: "string",
              description: "ID of a specific gosling process to check. If not provided, returns status for all goslings."
            },
            idle_threshold_ms: {
              type: "number",
              description: "Time in milliseconds with no output to consider a gosling idle. Defaults to 2000ms."
            }
          }
        }
      },
      {
        name: "send_prompt_to_gosling",
        description: "Send a follow-up prompt to a running gosling process",
        inputSchema: {
          type: "object",
          properties: {
            process_id: {
              type: "string",
              description: "ID of the gosling process"
            },
            prompt: {
              type: "string",
              description: "The follow-up prompt to send to the gosling"
            }
          },
          required: ["process_id", "prompt"]
        }
      },
      {
        name: "release_gosling",
        description: "Release a specific gosling process when you're done with it",
        inputSchema: {
          type: "object",
          properties: {
            process_id: {
              type: "string",
              description: "ID of the gosling process to release"
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

      // Get pagination parameters with defaults
      const offset = typeof request.params.arguments?.offset === 'number' ? request.params.arguments.offset : 0;
      const limit = typeof request.params.arguments?.limit === 'number' ? request.params.arguments.limit : 100;
      const fullOutput = Boolean(request.params.arguments?.full_output);

      // Get paginated output
      const outputResult = goslingManager.getGoslingOutput(processId, offset, limit, fullOutput);
      if (!outputResult) {
        throw new McpError(ErrorCode.InternalError, `Failed to get output for gosling ${processId}`);
      }

      const { text: output, metadata } = outputResult;

      // Create a header with gosling information
      let header = `=== Gosling Process ${processId} ===
Status: ${gosling.status}
Started: ${formatDate(gosling.startTime)}
${gosling.endTime ? 'Ended: ' + formatDate(gosling.endTime) : 'Duration: ' + formatDuration(gosling.startTime) + ' (running)'}
`;

      // Add prompt and prompt history information
      if (gosling.promptHistory && gosling.promptHistory.length > 0) {
        header += `Prompts: ${gosling.promptHistory.length}\n`;
        gosling.promptHistory.forEach((entry, index) => {
          const promptText = entry.prompt.length > 50 ? entry.prompt.substring(0, 50) + "..." : entry.prompt;
          header += `  ${index + 1}. [${formatDate(entry.timestamp)}] "${promptText}"\n`;
        });
      } else {
        header += `Prompt: "${gosling.prompt}"\n`;
      }

      // Add pagination info
      header += `\n=== Output (${metadata.startLine+1}-${metadata.endLine} of ${metadata.totalLines} lines) ===\n\n`;

      // If there's an error, prepare to append it to the output
      let errorInfo = "";
      if (gosling.error) {
        errorInfo = "\n\n=== ERROR ===\n" + gosling.error;
      }

      // Add pagination help text
      let paginationHelp = "";
      if (metadata.hasMore) {
        paginationHelp = `\n\n=== Pagination ===
Showing lines ${metadata.startLine+1} to ${metadata.endLine} of ${metadata.totalLines} total lines.
To see more, use:
  - Next page: offset=${metadata.endLine} limit=${limit}
  - Full output: full_output=true
`;
      }

      return {
        content: [{
          type: "text",
          text: header + output + errorInfo + paginationHelp
        }]
      };
    }
    
    case "send_prompt_to_gosling": {
      const processId = String(request.params.arguments?.process_id || "");
      const prompt = String(request.params.arguments?.prompt || "");

      if (!processId) {
        throw new McpError(ErrorCode.InvalidParams, "Process ID is required");
      }

      if (!prompt) {
        throw new McpError(ErrorCode.InvalidParams, "Prompt is required");
      }

      const gosling = goslingManager.getGosling(processId);
      if (!gosling) {
        throw new McpError(ErrorCode.InvalidRequest, `Gosling process ${processId} not found`);
      }

      // No need to check running status - our enhanced method will try to resume if not running

      // Send the follow-up prompt (now async)
      const success = await goslingManager.sendPromptToGosling(processId, prompt);
      if (!success) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to send prompt to gosling ${processId}. Process could not be resumed or is not accepting input.`
        );
      }

      // Count of prompts including the initial one
      const promptCount = gosling.promptHistory ? gosling.promptHistory.length : 1;

      return {
        content: [{
          type: "text",
          text: `Successfully sent follow-up prompt to gosling ${processId}

Prompt #${promptCount}: "${prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt}"

The gosling is processing your follow-up prompt. You can check its progress using:
- get_gosling_output tool with process_id="${processId}"
- Resource URI: goslings://${processId}/output

This allows for interactive, multi-turn conversations with your gosling process.`
        }]
      };
    }

    case "get_gosling_status": {
      const processId = request.params.arguments?.process_id;
      const idleThresholdMs = typeof request.params.arguments?.idle_threshold_ms === 'number'
        ? request.params.arguments.idle_threshold_ms
        : 2000;

      // Get the status report
      const statusReport = goslingManager.getGoslingStatus(processId, idleThresholdMs);

      // Format the response based on whether it's for a specific gosling or all goslings
      if (statusReport.specificGosling) {
        const g = statusReport.specificGosling;

        // Format idle time if available
        let idleTimeStr = "";
        if (g.idleTimeMs !== undefined) {
          const idleSeconds = Math.floor(g.idleTimeMs / 1000);
          const idleMs = g.idleTimeMs % 1000;
          idleTimeStr = `(No output for ${idleSeconds}.${idleMs.toString().padStart(3, '0').substring(0, 1)}s)`;
        }

        // Check if gosling exists
        if (g.status === "not_found") {
          return {
            content: [{
              type: "text",
              text: `=== Gosling Status ===\n\nError: Gosling with ID ${g.id} not found.\n\nUse list_goslings to see all available goslings.`
            }]
          };
        }

        // Format a specific gosling's status report
        const response = `=== Gosling Status ===\n\nID: ${g.id}
Status: ${g.activity} ${idleTimeStr}
Process state: ${g.status}
Task: "${g.prompt}"
${g.lastPrompt ? `Last prompt: "${g.lastPrompt}"` : ""}
Prompt count: ${g.promptCount}
Output size: ${formatFileSize(g.outputSize)} (${g.outputLines} lines)
Runtime: ${g.runtime}

${g.activity === "IDLE" ? "This gosling is idle and ready for interaction." : "This gosling is actively working. Wait for it to become idle for best results."}
${g.status === "running"
  ? "Use get_gosling_output to view its current response or send_prompt_to_gosling to continue the conversation."
  : `This gosling's process is in ${g.status} state. You can still view its output with get_gosling_output.`}`;

        return {
          content: [{
            type: "text",
            text: response
          }]
        };
      } else if (statusReport.allGoslings) {
        // Format the status report for all goslings
        const g = statusReport.allGoslings;

        let response = `=== Gosling Status Report ===\n\nTotal: ${g.total} goslings (${g.working} working, ${g.idle} idle, ${g.completed} completed, ${g.error} error)\n\n`;

        if (g.goslings.length === 0) {
          response += "No goslings found. Use run_goose to create a new gosling process.";
        } else {
          g.goslings.forEach((gosling, i) => {
            // Format idle time if available
            let idleTimeStr = "";
            if (gosling.activity === "IDLE" && gosling.idleTimeMs !== undefined) {
              const idleSeconds = Math.floor(gosling.idleTimeMs / 1000);
              const idleMs = gosling.idleTimeMs % 1000;
              idleTimeStr = `(No output for ${idleSeconds}.${idleMs.toString().padStart(3, '0').substring(0, 1)}s)`;
            }

            response += `${i+1}. ID: ${gosling.id}\n`;
            response += `   Status: ${gosling.activity} ${idleTimeStr}\n`;
            response += `   Process state: ${gosling.status}\n`;
            response += `   Task: "${gosling.prompt}"\n`;
            if (gosling.lastPrompt) {
              response += `   Last prompt: "${gosling.lastPrompt}"\n`;
            }
            response += `   Output size: ${formatFileSize(gosling.outputSize)} (${gosling.outputLines} lines)\n`;

            if (i < g.goslings.length - 1) response += "\n";
          });

          // Add helpful instructions
          response += "\n\nUse get_gosling_output with process_id=\"ID\" to view complete output of idle goslings.";
          response += "\nUse send_prompt_to_gosling with process_id=\"ID\" to continue conversations with idle goslings.";
          response += "\nWait for goslings to become IDLE before retrieving their output for best results.";
        }

        return {
          content: [{
            type: "text",
            text: response
          }]
        };
      } else {
        // This shouldn't happen based on the implementation, but just in case
        return {
          content: [{
            type: "text",
            text: "No status information available."
          }]
        };
      }
    }

    case "release_gosling": {
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
        throw new McpError(ErrorCode.InvalidRequest, `Failed to release gosling process ${processId}`);
      }

      return {
        content: [{
          type: "text",
          text: `Successfully ${wasRunning ? 'released' : 'released'} gosling process ${processId}
${wasRunning ? `The gosling was active for ${runtime} before being released.` : `The gosling had already completed with status: ${gosling.status}`}

You can still access its output using get_gosling_output or the resource URI: goslings://${processId}/output`
        }]
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  }
}
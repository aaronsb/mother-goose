/**
 * Gosling Manager for handling Goose processes
 */
import { spawn, ChildProcess } from "child_process";
import { randomUUID } from "crypto";
import { formatDuration } from "./utils.js";

/**
 * Interface for prompt history entry
 */
export interface PromptEntry {
  prompt: string;
  timestamp: Date;
}

/**
 * Interface for a Gosling process
 */
export interface Gosling {
  id: string;
  prompt: string;
  options: string[];
  process: ChildProcess;
  status: "running" | "completed" | "error";
  output: string;
  error: string;
  startTime: Date;
  endTime?: Date;
  promptHistory: PromptEntry[];
  outputLineCount: number;
  sessionName: string;  // Name of the Goose session
}

/**
 * Process manager for Goose processes
 */
export class GoslingManager {
  private goslings: Map<string, Gosling> = new Map();

  /**
   * Run a new Goose process with the given prompt and options
   */
  async runGoose(prompt: string, options: string[] = []): Promise<Gosling> {
    const id = randomUUID();
    
    // Generate a unique session name for this gosling
    const sessionName = `gosling-${id.substring(0, 8)}`;

    // Build the command arguments with interactive mode and named session
    // -s: Interactive mode, stays open for further input
    // -n: Named session for later resumption
    const args = ["run", "-s", "-n", sessionName];

    // Add any options (like -t for text-only mode)
    if (options && options.length > 0) {
      args.push(...options);
    }

    // Add the --text option with a modified prompt to encourage interactivity
    // This helps the model understand it's expected to stay active and responsive
    const interactivePrompt = `I'll be sending you multiple prompts in this session. Please respond to each one as they come.\n\nYour first task: ${prompt}`;
    args.push("--text", interactivePrompt);
    
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
    const timestamp = new Date();
    const gosling: Gosling = {
      id,
      prompt,  // Store the original user prompt, not our modified one
      options,
      process: gooseProcess,
      status: "running",
      output: "",
      error: "",
      startTime: timestamp,
      promptHistory: [{ prompt, timestamp }],  // Original prompt in history
      outputLineCount: 0,
      sessionName
    };
    
    // Store the Gosling
    this.goslings.set(id, gosling);
    
    // Collect stdout
    gooseProcess.stdout.on("data", (data) => {
      const text = data.toString();
      gosling.output += text;

      // Count new lines
      const newLines = text.split('\n').length - 1;
      gosling.outputLineCount += newLines;
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
   * Send a follow-up prompt to a Gosling process
   * If the process has completed, it will attempt to resume the session
   */
  async sendPromptToGosling(id: string, followUpPrompt: string): Promise<boolean> {
    const gosling = this.goslings.get(id);
    if (!gosling) {
      return false;
    }

    // If the process is not running, try to resume the session
    if (gosling.status !== "running") {
      try {
        console.error(`Gosling ${id} is not running (status: ${gosling.status}). Attempting to resume session ${gosling.sessionName}...`);

        // Build command to resume the session
        // Note: We need to provide both the session name AND a text prompt
        // Even for resumed sessions, Goose requires a text prompt
        const resumeArgs = ["run", "-s", "-n", gosling.sessionName, "-r", "--text", followUpPrompt];

        // Get the parent's environment variables
        const env = {
          ...process.env,
          DBUS_SESSION_BUS_ADDRESS: "unix:path=/run/user/1000/bus",
          // Disable ANSI color output
          TERM: "dumb",
          NO_COLOR: "1",
          CLICOLOR: "0",
          FORCE_COLOR: "0"
        };

        // Spawn a new process to resume the session
        const newProcess = spawn("goose", resumeArgs, { env });

        // Update the gosling object
        gosling.process = newProcess;
        gosling.status = "running";
        if (gosling.endTime) {
          console.error(`Gosling ${id} was inactive for ${formatDuration(gosling.endTime, new Date())}`);
        }
        gosling.endTime = undefined;

        // Set up event handlers for the new process
        newProcess.stdout.on("data", (data) => {
          const text = data.toString();
          gosling.output += text;
          // Count new lines
          const newLines = text.split('\n').length - 1;
          gosling.outputLineCount += newLines;
        });

        newProcess.stderr.on("data", (data) => {
          gosling.error += data.toString();
        });

        newProcess.on("exit", (code) => {
          gosling.endTime = new Date();
          gosling.status = code === 0 ? "completed" : "error";
          console.error(`Goose process ${id} exited with code ${code}`);
        });

        newProcess.on("error", (err) => {
          gosling.error += err.message;
          gosling.status = "error";
          console.error(`Goose process ${id} error: ${err.message}`);
        });

        // Give the process a moment to start up
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to resume gosling ${id} session: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }

    // Check if the process's stdin is writable
    if (!gosling.process.stdin || !gosling.process.stdin.writable) {
      console.error(`Gosling ${id} stdin is not writable`);
      return false;
    }

    try {
      // Log the follow-up prompt
      console.error(`Sending follow-up prompt to gosling ${id} (session ${gosling.sessionName}): "${followUpPrompt.substring(0, 30)}${followUpPrompt.length > 30 ? '...' : ''}"`);

      // Format the prompt with a clear separator, context reminder, and newlines
      const formattedPrompt = `\n\n--- NEW QUESTION/INSTRUCTION ---\n${followUpPrompt}\n\nPlease respond to this new question/instruction.\n\n`;

      // Write the prompt to the gosling's stdin and ensure it's sent
      gosling.process.stdin.write(formattedPrompt);

      // Add to prompt history
      const timestamp = new Date();
      gosling.promptHistory.push({ prompt: followUpPrompt, timestamp });

      return true;
    } catch (error) {
      console.error(`Error sending prompt to gosling ${id}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Get paginated output from a Gosling
   */
  getGoslingOutput(id: string, offset: number = 0, limit: number = 100, fullOutput: boolean = false): {
    text: string;
    metadata: {
      totalLines: number;
      startLine: number;
      endLine: number;
      hasMore: boolean;
    };
  } | undefined {
    const gosling = this.goslings.get(id);
    if (!gosling) {
      return undefined;
    }

    // If full output is requested, return everything
    if (fullOutput) {
      return {
        text: gosling.output,
        metadata: {
          totalLines: gosling.outputLineCount,
          startLine: 0,
          endLine: gosling.outputLineCount,
          hasMore: false
        }
      };
    }

    // Split output into lines
    const lines = gosling.output.split('\n');

    // Validate offset
    if (offset < 0) offset = 0;
    if (offset >= lines.length) offset = Math.max(0, lines.length - 1);

    // Validate limit
    if (limit <= 0) limit = 100;

    // Calculate end index (exclusive)
    const endIndex = Math.min(offset + limit, lines.length);

    // Get requested lines
    const requestedLines = lines.slice(offset, endIndex);

    return {
      text: requestedLines.join('\n'),
      metadata: {
        totalLines: lines.length,
        startLine: offset,
        endLine: endIndex,
        hasMore: endIndex < lines.length
      }
    };
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
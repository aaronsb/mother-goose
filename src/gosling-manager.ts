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
 * Enum for gosling activity status
 */
export enum ActivityStatus {
  WORKING = "WORKING",
  IDLE = "IDLE"
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
  lastOutputTime: Date; // Timestamp of last output update
  outputSize: number;   // Size of the output in bytes
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
      sessionName,
      lastOutputTime: timestamp,
      outputSize: 0
    };
    
    // Store the Gosling
    this.goslings.set(id, gosling);
    
    // Collect stdout
    gooseProcess.stdout.on("data", (data) => {
      const text = data.toString();
      gosling.output += text;

      // Update activity tracking
      gosling.lastOutputTime = new Date();
      gosling.outputSize += text.length;

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

          // Update activity tracking
          gosling.lastOutputTime = new Date();
          gosling.outputSize += text.length;

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
   * Get activity status of a gosling
   *
   * @param id The ID of the gosling process
   * @param idleThresholdMs Time in milliseconds with no output to consider a gosling idle (default: 2000ms)
   * @returns Activity status information or undefined if gosling not found
   */
  getGoslingActivityStatus(id: string, idleThresholdMs: number = 2000): {
    status: ActivityStatus;
    idleTimeMs?: number;
  } | undefined {
    const gosling = this.goslings.get(id);
    if (!gosling) {
      return undefined;
    }

    // If the gosling is not running, it's considered idle
    if (gosling.status !== "running") {
      return { status: ActivityStatus.IDLE };
    }

    // Check if there has been any output recently
    const now = new Date();
    const timeSinceLastOutput = now.getTime() - gosling.lastOutputTime.getTime();

    // If we've received output within the threshold, the gosling is considered working
    if (timeSinceLastOutput < idleThresholdMs) {
      return { status: ActivityStatus.WORKING };
    }

    // Otherwise, it's considered idle with an idle time
    return {
      status: ActivityStatus.IDLE,
      idleTimeMs: timeSinceLastOutput
    };
  }

  /**
   * Get status reports for all goslings or a specific gosling
   *
   * @param specificId Optional ID of a specific gosling to check
   * @param idleThresholdMs Time in milliseconds with no output to consider a gosling idle (default: 2000ms)
   * @returns Status report for all goslings or the specific gosling
   */
  getGoslingStatus(specificId?: string, idleThresholdMs: number = 2000): {
    allGoslings?: {
      total: number;
      working: number;
      idle: number;
      completed: number;
      error: number;
      goslings: Array<{
        id: string;
        activity: ActivityStatus;
        status: string;
        idleTimeMs?: number;
        prompt: string;
        lastPrompt?: string;
        outputSize: number;
        outputLines: number;
      }>;
    };
    specificGosling?: {
      id: string;
      activity: ActivityStatus;
      status: string;
      idleTimeMs?: number;
      prompt: string;
      lastPrompt?: string;
      promptCount: number;
      outputSize: number;
      outputLines: number;
      runtime: string;
      sessionName: string;
    };
  } {
    // If a specific gosling ID is provided, just return information about that gosling
    if (specificId) {
      const gosling = this.goslings.get(specificId);
      if (!gosling) {
        return {
          specificGosling: {
            id: specificId,
            activity: ActivityStatus.IDLE,
            status: "not_found",
            prompt: "",
            promptCount: 0,
            outputSize: 0,
            outputLines: 0,
            runtime: "0s",
            sessionName: ""
          }
        };
      }

      const activityStatus = this.getGoslingActivityStatus(specificId, idleThresholdMs);
      const lastPrompt = gosling.promptHistory.length > 1
        ? gosling.promptHistory[gosling.promptHistory.length - 1].prompt
        : undefined;

      return {
        specificGosling: {
          id: gosling.id,
          activity: activityStatus?.status || ActivityStatus.IDLE,
          status: gosling.status,
          idleTimeMs: activityStatus?.idleTimeMs,
          prompt: gosling.prompt,
          lastPrompt,
          promptCount: gosling.promptHistory.length,
          outputSize: gosling.outputSize,
          outputLines: gosling.outputLineCount,
          runtime: formatDuration(gosling.startTime, gosling.endTime || new Date()),
          sessionName: gosling.sessionName
        }
      };
    }

    // Otherwise, return a summary of all goslings
    const goslings = this.getAllGoslings();

    // Count goslings by status
    let workingCount = 0;
    let idleCount = 0;
    let completedCount = 0;
    let errorCount = 0;

    // Build the status report for each gosling
    const statusReports = goslings.map(gosling => {
      const activityStatus = this.getGoslingActivityStatus(gosling.id, idleThresholdMs);

      // Count by status
      if (gosling.status === "completed") {
        completedCount++;
      } else if (gosling.status === "error") {
        errorCount++;
      } else if (activityStatus?.status === ActivityStatus.WORKING) {
        workingCount++;
      } else {
        idleCount++;
      }

      // Get the last prompt if there's more than one
      const lastPrompt = gosling.promptHistory.length > 1
        ? gosling.promptHistory[gosling.promptHistory.length - 1].prompt
        : undefined;

      return {
        id: gosling.id,
        activity: activityStatus?.status || ActivityStatus.IDLE,
        status: gosling.status,
        idleTimeMs: activityStatus?.idleTimeMs,
        prompt: gosling.prompt,
        lastPrompt,
        outputSize: gosling.outputSize,
        outputLines: gosling.outputLineCount
      };
    });

    return {
      allGoslings: {
        total: goslings.length,
        working: workingCount,
        idle: idleCount,
        completed: completedCount,
        error: errorCount,
        goslings: statusReports
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
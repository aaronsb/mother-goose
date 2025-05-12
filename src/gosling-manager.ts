/**
 * Gosling Manager for handling Goose processes
 */
import { spawn, ChildProcess } from "child_process";
import { randomUUID } from "crypto";

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
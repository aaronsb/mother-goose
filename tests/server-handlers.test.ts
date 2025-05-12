/**
 * Tests for MCP server request handlers
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  CallToolRequestSchema,
  ListResourcesRequestSchema, 
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode
} from "@modelcontextprotocol/sdk/types.js";
import { GoslingManager } from '../src/gosling-manager.js';
import { EventEmitter } from 'events';

// Mock GoslingManager
jest.mock('../src/gosling-manager.js');

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      setRequestHandler: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

// Mock console.error to not clutter test output
console.error = jest.fn();

// Import the handlers from index.ts
// Note: We'll need to refactor the index.ts file to export these handlers
// for proper testing. This is a placeholder for the test structure.
import { 
  handleListResources,
  handleListResourceTemplates,
  handleReadResource,
  handleListTools,
  handleCallTool
} from '../src/handlers.js';

describe('Server Request Handlers', () => {
  let mockGoslingManager: jest.Mocked<GoslingManager>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock implementation for GoslingManager
    mockGoslingManager = new GoslingManager() as jest.Mocked<GoslingManager>;
    mockGoslingManager.getAllGoslings.mockReturnValue([]);
    mockGoslingManager.getGosling.mockReturnValue(undefined);
    mockGoslingManager.runGoose.mockResolvedValue({
      id: 'test-uuid',
      prompt: 'test prompt',
      options: [],
      process: new EventEmitter() as any,
      status: 'running',
      output: '',
      error: '',
      startTime: new Date()
    });
    mockGoslingManager.terminateGosling.mockReturnValue(false);
  });
  
  describe('handleListResources', () => {
    it('should return a list with goslings://list resource when no goslings exist', async () => {
      const result = await handleListResources(mockGoslingManager);
      
      expect(result).toEqual({
        resources: [
          {
            uri: 'goslings://list',
            mimeType: 'application/json',
            name: 'List of all gosling processes',
            description: 'Information about all running and completed Goose processes'
          }
        ]
      });
    });
    
    it('should include resources for each gosling process', async () => {
      mockGoslingManager.getAllGoslings.mockReturnValue([
        {
          id: 'test-uuid-1',
          prompt: 'test prompt 1',
          options: [],
          process: {} as any,
          status: 'running',
          output: '',
          error: '',
          startTime: new Date()
        },
        {
          id: 'test-uuid-2',
          prompt: 'test prompt 2',
          options: [],
          process: {} as any,
          status: 'completed',
          output: 'output',
          error: '',
          startTime: new Date(),
          endTime: new Date()
        }
      ]);
      
      const result = await handleListResources(mockGoslingManager);
      
      expect(result.resources.length).toBe(3); // base resource + 2 goslings
      expect(result.resources[1].uri).toBe('goslings://test-uuid-1');
      expect(result.resources[2].uri).toBe('goslings://test-uuid-2');
    });
  });
  
  describe('handleListResourceTemplates', () => {
    it('should return the resource templates', async () => {
      const result = await handleListResourceTemplates();
      
      expect(result).toEqual({
        resourceTemplates: [
          {
            uriTemplate: 'goslings://{process_id}',
            name: 'Gosling process details',
            mimeType: 'application/json',
            description: 'Details about a specific Goose process'
          },
          {
            uriTemplate: 'goslings://{process_id}/output',
            name: 'Gosling process output',
            mimeType: 'text/plain',
            description: 'Output from a specific Goose process'
          }
        ]
      });
    });
  });
  
  describe('handleReadResource', () => {
    it('should return list of goslings for goslings://list', async () => {
      mockGoslingManager.getAllGoslings.mockReturnValue([
        {
          id: 'test-uuid',
          prompt: 'test prompt',
          options: [],
          process: {} as any,
          status: 'running',
          output: '',
          error: '',
          startTime: new Date()
        }
      ]);
      
      const result = await handleReadResource(mockGoslingManager, { 
        params: { uri: 'goslings://list' } 
      } as any);
      
      expect(result.contents[0].mimeType).toBe('application/json');
      expect(JSON.parse(result.contents[0].text).length).toBe(1);
      expect(JSON.parse(result.contents[0].text)[0].id).toBe('test-uuid');
    });
    
    it('should return gosling details for goslings://{process_id}', async () => {
      mockGoslingManager.getGosling.mockReturnValue({
        id: 'test-uuid',
        prompt: 'test prompt',
        options: [],
        process: {} as any,
        status: 'running',
        output: 'output data',
        error: '',
        startTime: new Date()
      });
      
      const result = await handleReadResource(mockGoslingManager, { 
        params: { uri: 'goslings://test-uuid' } 
      } as any);
      
      expect(result.contents[0].mimeType).toBe('application/json');
      expect(JSON.parse(result.contents[0].text).id).toBe('test-uuid');
      expect(JSON.parse(result.contents[0].text).outputLength).toBe(11); // 'output data'.length
    });
    
    it('should throw for invalid process id', async () => {
      mockGoslingManager.getGosling.mockReturnValue(undefined);
      
      await expect(handleReadResource(mockGoslingManager, { 
        params: { uri: 'goslings://invalid-id' } 
      } as any)).rejects.toThrow(McpError);
    });
    
    it('should return gosling output for goslings://{process_id}/output', async () => {
      mockGoslingManager.getGosling.mockReturnValue({
        id: 'test-uuid',
        prompt: 'test prompt',
        options: [],
        process: {} as any,
        status: 'completed',
        output: 'output data',
        error: '',
        startTime: new Date(),
        endTime: new Date()
      });
      
      const result = await handleReadResource(mockGoslingManager, { 
        params: { uri: 'goslings://test-uuid/output' } 
      } as any);
      
      expect(result.contents[0].mimeType).toBe('text/plain');
      expect(result.contents[0].text).toBe('output data');
    });
    
    it('should include error in output if present', async () => {
      mockGoslingManager.getGosling.mockReturnValue({
        id: 'test-uuid',
        prompt: 'test prompt',
        options: [],
        process: {} as any,
        status: 'error',
        output: 'output data',
        error: 'error message',
        startTime: new Date(),
        endTime: new Date()
      });
      
      const result = await handleReadResource(mockGoslingManager, { 
        params: { uri: 'goslings://test-uuid/output' } 
      } as any);
      
      expect(result.contents[0].text).toContain('output data');
      expect(result.contents[0].text).toContain('ERROR:');
      expect(result.contents[0].text).toContain('error message');
    });
    
    it('should throw for invalid resource URI', async () => {
      await expect(handleReadResource(mockGoslingManager, { 
        params: { uri: 'invalid://uri' } 
      } as any)).rejects.toThrow(McpError);
    });
  });
  
  describe('handleListTools', () => {
    it('should return the list of tools', async () => {
      const result = await handleListTools();
      
      expect(result.tools.length).toBe(4);
      expect(result.tools[0].name).toBe('run_goose');
      expect(result.tools[1].name).toBe('list_goslings');
      expect(result.tools[2].name).toBe('get_gosling_output');
      expect(result.tools[3].name).toBe('terminate_gosling');
    });
  });
  
  describe('handleCallTool', () => {
    describe('run_goose tool', () => {
      it('should run goose with the given prompt', async () => {
        const result = await handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'run_goose',
            arguments: {
              prompt: 'test prompt'
            }
          } 
        } as any);
        
        expect(mockGoslingManager.runGoose).toHaveBeenCalledWith('test prompt', []);
        expect(result.content[0].text).toContain('Started Goose process with ID: test-uuid');
      });
      
      it('should include options if provided', async () => {
        await handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'run_goose',
            arguments: {
              prompt: 'test prompt',
              options: ['-o', 'option-value']
            }
          } 
        } as any);
        
        expect(mockGoslingManager.runGoose).toHaveBeenCalledWith('test prompt', ['-o', 'option-value']);
      });
      
      it('should throw if prompt is not provided', async () => {
        await expect(handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'run_goose',
            arguments: {}
          } 
        } as any)).rejects.toThrow(McpError);
      });
    });
    
    describe('list_goslings tool', () => {
      it('should list all goslings', async () => {
        mockGoslingManager.getAllGoslings.mockReturnValue([
          {
            id: 'test-uuid',
            prompt: 'test prompt',
            options: [],
            process: {} as any,
            status: 'running',
            output: '',
            error: '',
            startTime: new Date()
          }
        ]);
        
        const result = await handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'list_goslings',
            arguments: {}
          } 
        } as any);
        
        expect(result.content[0].text).toContain('Found 1 gosling processes');
        expect(result.content[0].text).toContain('test-uuid');
      });
      
      it('should filter goslings by status if provided', async () => {
        mockGoslingManager.getAllGoslings.mockReturnValue([
          {
            id: 'test-uuid-1',
            prompt: 'test prompt 1',
            options: [],
            process: {} as any,
            status: 'running',
            output: '',
            error: '',
            startTime: new Date()
          },
          {
            id: 'test-uuid-2',
            prompt: 'test prompt 2',
            options: [],
            process: {} as any,
            status: 'completed',
            output: '',
            error: '',
            startTime: new Date(),
            endTime: new Date()
          }
        ]);
        
        const result = await handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'list_goslings',
            arguments: {
              status: 'running'
            }
          } 
        } as any);
        
        expect(result.content[0].text).toContain('Found 1 gosling processes with status "running"');
        expect(result.content[0].text).toContain('test-uuid-1');
        expect(result.content[0].text).not.toContain('test-uuid-2');
      });
    });
    
    describe('get_gosling_output tool', () => {
      it('should return the output of the specified gosling', async () => {
        mockGoslingManager.getGosling.mockReturnValue({
          id: 'test-uuid',
          prompt: 'test prompt',
          options: [],
          process: {} as any,
          status: 'completed',
          output: 'output data',
          error: '',
          startTime: new Date(),
          endTime: new Date()
        });
        
        const result = await handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'get_gosling_output',
            arguments: {
              process_id: 'test-uuid'
            }
          } 
        } as any);
        
        expect(result.content[0].text).toContain('Output from gosling test-uuid');
        expect(result.content[0].text).toContain('output data');
      });
      
      it('should throw if process_id is not provided', async () => {
        await expect(handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'get_gosling_output',
            arguments: {}
          } 
        } as any)).rejects.toThrow(McpError);
      });
      
      it('should throw if gosling is not found', async () => {
        mockGoslingManager.getGosling.mockReturnValue(undefined);
        
        await expect(handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'get_gosling_output',
            arguments: {
              process_id: 'non-existent-id'
            }
          } 
        } as any)).rejects.toThrow(McpError);
      });
    });
    
    describe('terminate_gosling tool', () => {
      it('should terminate the specified gosling', async () => {
        mockGoslingManager.terminateGosling.mockReturnValue(true);
        
        const result = await handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'terminate_gosling',
            arguments: {
              process_id: 'test-uuid'
            }
          } 
        } as any);
        
        expect(mockGoslingManager.terminateGosling).toHaveBeenCalledWith('test-uuid');
        expect(result.content[0].text).toContain('Successfully terminated gosling process test-uuid');
      });
      
      it('should throw if process_id is not provided', async () => {
        await expect(handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'terminate_gosling',
            arguments: {}
          } 
        } as any)).rejects.toThrow(McpError);
      });
      
      it('should throw if gosling is not found', async () => {
        mockGoslingManager.terminateGosling.mockReturnValue(false);
        
        await expect(handleCallTool(mockGoslingManager, { 
          params: { 
            name: 'terminate_gosling',
            arguments: {
              process_id: 'non-existent-id'
            }
          } 
        } as any)).rejects.toThrow(McpError);
      });
    });
    
    it('should throw for unknown tool', async () => {
      await expect(handleCallTool(mockGoslingManager, { 
        params: { 
          name: 'unknown_tool',
          arguments: {}
        } 
      } as any)).rejects.toThrow(McpError);
    });
  });
});
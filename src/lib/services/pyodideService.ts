type PyodideType = any;

class PyodideService {
  private pyodide: PyodideType | null = null;
  private isLoading: boolean = false;
  private loadPromise: Promise<void> | null = null;

  async loadPyodide(): Promise<void> {
    if (this.pyodide) return;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });

        // @ts-ignore
        this.pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        });

        await this.pyodide.loadPackage([  'numpy',
          'pandas', 
          'matplotlib',
          'scipy',
          'statsmodels',
          'scikit-learn']);
        
        // Configure matplotlib to use non-interactive backend
        await this.pyodide.runPythonAsync(`
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
plt.ioff()  # Turn off interactive mode
        `);
        
        console.log('Pyodide loaded successfully');
      } catch (error) {
        console.error('Failed to load Pyodide:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    })();

    return this.loadPromise;
  }

  async executeCode(code: string): Promise<{
    output?: string;
    error?: string;
    plot?: string;
  }> {
    if (!this.pyodide) {
      await this.loadPyodide();
    }
  
    try {
      // Setup stdout/stderr capture and matplotlib
      await this.pyodide.runPythonAsync(`
  import sys
  import io
  import matplotlib
  matplotlib.use('Agg')
  import matplotlib.pyplot as plt
  plt.ioff()
  
  # Reset stdout/stderr
  sys.stdout = io.StringIO()
  sys.stderr = io.StringIO()
  
  # Close any existing figures
  plt.close('all')
      `);
  
      // Execute user code
      await this.pyodide.runPythonAsync(code);
  
      // Capture outputs
      const stdout = await this.pyodide.runPythonAsync('sys.stdout.getvalue()');
      const stderr = await this.pyodide.runPythonAsync('sys.stderr.getvalue()');
  
      // Check for and capture matplotlib plots
      let plotData: string | undefined;
      const hasFigures = await this.pyodide.runPythonAsync('len(plt.get_fignums()) > 0');
      
      if (hasFigures) {
        try {
          plotData = await this.pyodide.runPythonAsync(`
  import base64
  
  buf = io.BytesIO()
  plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
  buf.seek(0)
  img_str = base64.b64encode(buf.read()).decode('utf-8')
  plt.close('all')
  'data:image/png;base64,' + img_str
          `);
        } catch (e) {
          console.error('Error capturing plot:', e);
          plotData = undefined;
        }
      }
  
      return {
        output: stdout || undefined,
        error: stderr || undefined,
        plot: plotData || undefined,
      };
    } catch (error: any) {
      // Close any figures on error
      try {
        await this.pyodide.runPythonAsync('import matplotlib.pyplot as plt; plt.close("all")');
      } catch (e) {
        // Ignore cleanup errors
      }
      
      return {
        error: error.message || 'Execution failed',
      };
    }
  }

  async writeFile(filename: string, content: string): Promise<void> {
    if (!this.pyodide) {
      await this.loadPyodide();
    }
  
    try {
      // Write file to Pyodide's virtual file system
      this.pyodide.FS.writeFile(filename, content);
      console.log(`File ${filename} written to virtual file system`);
    } catch (error: any) {
      console.error('Error writing file:', error);
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }
  
  async getDatasetSummary(filename: string): Promise<{
    rows: number;
    columns: number;
    columnNames: string[];
    columnTypes: Record<string, string>;
  }> {
    if (!this.pyodide) {
      await this.loadPyodide();
    }
  
    try {
      const summaryJson = await this.pyodide.runPythonAsync(`
  import pandas as pd
  import json
  
  # Read the CSV file
  df = pd.read_csv("${filename}")
  
  # Get summary information
  summary = {
      "rows": len(df),
      "columns": len(df.columns),
      "columnNames": df.columns.tolist(),
      "columnTypes": {col: str(df[col].dtype) for col in df.columns}
  }
  
  json.dumps(summary)
      `);
  
      return JSON.parse(summaryJson);
    } catch (error: any) {
      console.error('Error getting dataset summary:', error);
      throw new Error(`Failed to analyze dataset: ${error.message}`);
    }
  }
  
  async getDatasetVariable(filename: string, variableName: string = 'dataset'): Promise<void> {
    if (!this.pyodide) {
      await this.loadPyodide();
    }
  
    try {
      // Load the dataset into a global variable
      await this.pyodide.runPythonAsync(`
  import pandas as pd
  ${variableName} = pd.read_csv("${filename}")
  print(f"Dataset loaded as '${variableName}'")
  print(f"Shape: {${variableName}.shape}")
      `);
    } catch (error: any) {
      console.error('Error loading dataset variable:', error);
      throw new Error(`Failed to load dataset: ${error.message}`);
    }
  }

  async removeDataset(filename: string, variableName: string = 'dataset'): Promise<void> {
    if (!this.pyodide) {
      return;
    }
  
    try {
      // Remove the file from virtual file system
      try {
        this.pyodide.FS.unlink(filename);
        console.log(`File ${filename} removed from virtual file system`);
      } catch (e) {
        console.warn('File not found in filesystem:', e);
      }
  
      // Delete the global variable
      await this.pyodide.runPythonAsync(`
  try:
      del ${variableName}
      print("Dataset variable '${variableName}' removed from memory")
  except NameError:
      pass  # Variable doesn't exist
      `);
    } catch (error: any) {
      console.error('Error removing dataset:', error);
    }
  }

  async checkVariableExists(variableName: string): Promise<boolean> {
    if (!this.pyodide) {
      return false;
    }
  
    try {
      const exists = await this.pyodide.runPythonAsync(`
  '${variableName}' in dir()
      `);
      return exists;
    } catch (error) {
      return false;
    }
  }

  isReady(): boolean {
    return this.pyodide !== null;
  }
}

export const pyodideService = new PyodideService();
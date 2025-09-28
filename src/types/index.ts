// Basic type exports - we'll expand this
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Project {
    id: string;
    name: string;
    description?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Dataset {
    id: string;
    projectId: string;
    fileName: string;
    fileSize: number;
    columns: string[];
    rowCount: number;
    filePath: string;
    uploadedAt: string;
  }
  
  export interface Hypothesis {
    id: string;
    projectId: string;
    content: string;
    position: number;
    createdAt: string;
    updatedAt: string;
  }
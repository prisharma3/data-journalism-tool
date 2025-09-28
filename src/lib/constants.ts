export const APP_NAME = "Data Journalism Tool";
export const APP_DESCRIPTION = "AI-powered data journalism platform";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login", 
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROJECT: (id: string) => `/project/${id}`,
  NOTEBOOK: (id: string) => `/project/${id}/notebook`,
  WRITING: (id: string) => `/project/${id}/writing`,
  EXPORT: (id: string) => `/project/${id}/export`,
} as const;

export const COLORS = {
  DATASET: "#F5F5F5",
  HYPOTHESIS: "#F3E5F5", 
  ANALYSIS: "#E3F2FD",
  OUTPUT: "#FFFDE7",
  INSIGHT: "#FFF9C4",
} as const;
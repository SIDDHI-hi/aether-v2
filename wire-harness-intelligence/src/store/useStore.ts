import { create } from 'zustand';
import { mockHarnessData } from '../mockData'; // Fallback data
import type { HarnessData } from '../mockData';

interface AppState {
  appState: 'landing' | 'splash' | 'upload' | 'dashboard';
  setAppState: (state: 'landing' | 'splash' | 'upload' | 'dashboard') => void;
  
  viewMode: 'netlist' | 'viewer2d' | 'viewer3d';
  setViewMode: (mode: 'netlist' | 'viewer2d' | 'viewer3d') => void;
  
  selectedItem: any | null;
  setSelectedItem: (item: any | null) => void;
  
  updateNodePosition: (id: string, x: number, y: number) => void;
  updateNodePosition3D: (id: string, x: number, y: number, z: number) => void;
  
  // --- NEW: 3D Asset Management ---
  updateNodeModel: (id: string, modelUrl: string) => void;
  upload3DModel: (file: File, nodeId: string) => Promise<void>;
  
  data: HarnessData | any; 
  setData: (newData: HarnessData | any) => void; 
  
  history: any[];
  saveHistory: () => void;
  undo: () => void;

  projects: any[];
  fetchProjects: () => Promise<void>;
  saveCurrentProject: (name?: string) => Promise<void>;
  resetSession: () => void;

  compareMode: boolean;
  toggleCompareMode: () => void;
  
  faultMode: boolean;
  toggleFaultMode: () => void;

  xRayMode: boolean;
  setXRayMode: (val: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  appState: 'landing',
  setAppState: (state) => set({ appState: state }),
  
  viewMode: 'netlist',
  setViewMode: (mode) => set({ viewMode: mode }),
  
  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),
  
  updateNodePosition: (id, x, y) => set((state) => {
    let newData = { ...state.data };
    if (newData?.connectors) {
      newData.connectors = newData.connectors.map((c: any) => 
        c.id === id ? { ...c, x, y } : c
      );
    }
    if (newData?.nodes) {
      newData.nodes = newData.nodes.map((n: any) => 
        n.id === id ? { ...n, x, y } : n
      );
    }
    return { data: newData };
  }),

  updateNodePosition3D: (id, x, y, z) => set((state) => {
    let newData = { ...state.data };
    
    if (newData?.connectors) {
      newData.connectors = newData.connectors.map((c: any) => 
        c.id === id ? { ...c, x, y, z, coordinates_3d: { x, y, z } } : c
      );
    }
    if (newData?.nodes) {
      newData.nodes = newData.nodes.map((n: any) => 
        n.id === id ? { ...n, x, y, z, coordinates_3d: { x, y, z } } : n
      );
    }
    
    return { data: newData };
  }),

  // --- NEW: Attach 3D Model URL to a specific component ---
  updateNodeModel: (id, modelUrl) => set((state) => {
    let newData = { ...state.data };
    
    if (newData?.connectors) {
      newData.connectors = newData.connectors.map((c: any) => 
        c.id === id ? { ...c, modelUrl } : c
      );
    }
    if (newData?.nodes) {
      newData.nodes = newData.nodes.map((n: any) => 
        n.id === id ? { ...n, modelUrl } : n
      );
    }
    
    // Also update the selected item if it's the one we just modified
    const currentSelected = state.selectedItem;
    if (currentSelected && currentSelected.id === id) {
      set({ selectedItem: { ...currentSelected, modelUrl } });
    }
    
    return { data: newData };
  }),

  // --- NEW: Upload to Backend and trigger state update ---
  upload3DModel: async (file, nodeId) => {
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch('http://localhost:8000/api/upload-model', {
        method: 'POST',
        body: formData,
      });
      
      const result = await res.json();
      
      if (result.url) {
        get().saveHistory(); // Snapshot before applying the model
        get().updateNodeModel(nodeId, result.url);
      } else {
        console.error("Upload failed:", result.error);
        alert(result.error);
      }
    } catch (err) {
      console.error("Network error during upload:", err);
      alert("CONNECTION_ERROR: Make sure the Python backend is running.");
    }
  },

  data: mockHarnessData, 
  setData: (newData) => set({ data: newData }),

  history: [],
  saveHistory: () => {
    const { data, history } = get();
    if (data) {
      const newHistory = [...history, JSON.parse(JSON.stringify(data))].slice(-30);
      set({ history: newHistory });
    }
  },
  undo: () => {
    const { history } = get();
    if (history.length > 0) {
      const previousData = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      
      // We also need to clear selected item if we undo, just to be safe
      set({ data: previousData, history: newHistory, selectedItem: null });
    }
  },

  projects: [],
  
  fetchProjects: async () => {
    try {
      const res = await fetch('http://localhost:8000/api/projects');
      const projects = await res.json();
      set({ projects });
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  },

  saveCurrentProject: async (name) => {
    const { data } = get();
    if (!data) return;

    try {
      const res = await fetch('http://localhost:8000/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || `Project_${new Date().getTime()}`,
          data: data
        }),
      });
      if (res.ok) {
        get().fetchProjects();
      }
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  },

  resetSession: () => set({
    appState: 'upload',
    viewMode: 'netlist', 
    data: null,
    selectedItem: null,
    history: [] 
  }),

  compareMode: false,
  toggleCompareMode: () => set((state) => ({ compareMode: !state.compareMode, faultMode: false })),
  
  faultMode: false,
  toggleFaultMode: () => set((state) => ({ faultMode: !state.faultMode, compareMode: false })),

  xRayMode: false,
  setXRayMode: (val: boolean) => set({ xRayMode: val }),
}));
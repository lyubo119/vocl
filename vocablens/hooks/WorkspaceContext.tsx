import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from '../lib/db/schema';
import { getAllWorkspaces, createWorkspace, deleteWorkspace, updateWorkspace } from '../lib/db/queries/workspaces';
import { Workspace } from '../lib/db/schema';
import { getSetting, setSetting, SETTINGS_KEYS } from '../lib/db/queries/settings';

type WorkspaceContextType = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  error: string | null;
  lastWorkspaceId: string | null;
  db: SQLite.SQLiteDatabase | null;
  createNewWorkspace: (name: string, sourceLang: string, targetLang: string) => Promise<Workspace>;
  setWorkspace: (workspaceId: string) => void;
  removeWorkspace: (workspaceId: string) => Promise<void>;
  editWorkspace: (workspaceId: string, updates: Partial<Omit<Workspace, 'id' | 'created_at'>>) => Promise<void>;
};

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const database = await initDatabase();
        setDb(database);

        const allWorkspaces = await getAllWorkspaces(database);
        setWorkspaces(allWorkspaces);

        // Check for last-opened workspace
        const savedWorkspaceId = await getSetting(database, SETTINGS_KEYS.LAST_WORKSPACE_ID);
        if (savedWorkspaceId) {
          setLastWorkspaceId(savedWorkspaceId);
          const lastWs = allWorkspaces.find(w => w.id === savedWorkspaceId);
          if (lastWs) {
            setActiveWorkspace(lastWs);
          } else if (allWorkspaces.length > 0) {
            setActiveWorkspace(allWorkspaces[0]);
          }
        } else if (allWorkspaces.length > 0) {
          setActiveWorkspace(allWorkspaces[0]);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const createNewWorkspace = async (name: string, sourceLang: string, targetLang: string): Promise<Workspace> => {
    if (!db) throw new Error('Database not initialized');

    const newWorkspace = await createWorkspace(db, { name, source_lang: sourceLang, target_lang: targetLang });
    setWorkspaces(prev => [...prev, newWorkspace]);
    setActiveWorkspace(newWorkspace);

    // Persist as last workspace
    await setSetting(db, SETTINGS_KEYS.LAST_WORKSPACE_ID, newWorkspace.id);
    setLastWorkspaceId(newWorkspace.id);

    return newWorkspace;
  };

  const setWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setActiveWorkspace(workspace);
      // Persist as last workspace
      if (db) {
        setSetting(db, SETTINGS_KEYS.LAST_WORKSPACE_ID, workspaceId);
        setLastWorkspaceId(workspaceId);
      }
    }
  };

  const removeWorkspace = async (workspaceId: string) => {
    if (!db) throw new Error('Database not initialized');
    await deleteWorkspace(db, workspaceId);
    setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
    if (activeWorkspace?.id === workspaceId) {
      const remaining = workspaces.filter(w => w.id !== workspaceId);
      setActiveWorkspace(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const editWorkspace = async (workspaceId: string, updates: Partial<Omit<Workspace, 'id' | 'created_at'>>) => {
    if (!db) throw new Error('Database not initialized');
    const updated = await updateWorkspace(db, workspaceId, updates);
    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? updated : w));
    if (activeWorkspace?.id === workspaceId) {
      setActiveWorkspace(updated);
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspace,
      loading,
      error,
      lastWorkspaceId,
      db,
      createNewWorkspace,
      setWorkspace,
      removeWorkspace,
      editWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
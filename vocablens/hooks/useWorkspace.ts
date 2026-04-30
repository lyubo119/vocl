import { useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from '../lib/db/schema';
import { getAllWorkspaces, createWorkspace } from '../lib/db/queries/workspaces';
import { Workspace } from '../lib/db/schema';

export const useWorkspace = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const database = await initDatabase();
        setDb(database);

        const allWorkspaces = await getAllWorkspaces(database);
        setWorkspaces(allWorkspaces);

        if (allWorkspaces.length > 0) {
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
    return newWorkspace;
  };

  const setWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setActiveWorkspace(workspace);
    }
  };

  return {
    workspaces,
    activeWorkspace,
    loading,
    error,
    createNewWorkspace,
    setWorkspace
  };
};
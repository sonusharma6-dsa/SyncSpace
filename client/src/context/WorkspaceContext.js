import React, { createContext, useContext, useState } from 'react';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);

  return (
    <WorkspaceContext.Provider value={{
      currentWorkspace, setCurrentWorkspace,
      workspaces, setWorkspaces,
      documents, setDocuments,
      tasks, setTasks,
      activeDocument, setActiveDocument,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);

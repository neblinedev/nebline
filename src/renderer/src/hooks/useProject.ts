import { useContext } from 'react'
import { ProjectContext, ProjectContextData } from '../contexts/ProjectContextDefinition' // Import from definition file

export const useProject = (): ProjectContextData => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

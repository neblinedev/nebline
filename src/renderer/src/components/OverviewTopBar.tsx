import ZoomControls from '@renderer/components/ZoomControls'
import React from 'react'
import TopBarTab from './TopBarTab'
import YearProgress from './YearProgress'

export type TabType = 'document' | 'insights'

interface OverviewTopBarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  onGenerateInsights: () => void
  isGeneratingInsights: boolean
}

const OverviewTopBar: React.FC<OverviewTopBarProps> = ({
  activeTab,
  setActiveTab,
  onGenerateInsights,
  isGeneratingInsights
}) => {
  return (
    <div className="flex justify-between items-center flex-shrink-0 px-2 py-1">
      {/* Left Tabs */}
      <div className="flex">
        <TopBarTab
          label="Document"
          tabId="document"
          isActive={activeTab === 'document'}
          onClick={setActiveTab}
        />
        <TopBarTab
          label="Insights"
          tabId="insights"
          isActive={activeTab === 'insights'}
          onClick={setActiveTab}
        />
      </div>
      <div className="flex items-center space-x-3">
        <ZoomControls />
        <YearProgress />
        <button
          onClick={onGenerateInsights}
          disabled={isGeneratingInsights}
          className={`py-1 px-3 text-sm font-medium rounded ${
            isGeneratingInsights
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-primary-base hover:bg-primary-hover'
          }`}
        >
          {isGeneratingInsights ? 'Generating...' : 'Generate Insights'}
        </button>
      </div>
    </div>
  )
}

export default OverviewTopBar

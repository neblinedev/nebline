import ZoomControls from '@renderer/components/ZoomControls'
import React from 'react'
import TopBarTab from './TopBarTab'
import YearProgress from './YearProgress' // Import the new component

interface TopBarProps {
  activeTab: 'journal' | 'insights'
  setActiveTab: (tab: 'journal' | 'insights') => void
  onGenerateInsights: () => void // Callback for the new button
  isGeneratingInsights: boolean // To disable button while generating
}

const TopBar: React.FC<TopBarProps> = ({
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
          label="Journal"
          tabId="journal"
          isActive={activeTab === 'journal'}
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

export default TopBar

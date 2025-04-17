import React from 'react'
import classNames from 'classnames'

export type TabType = 'document' | 'insights'

interface TopBarTabProps {
  label: string
  tabId: TabType
  isActive: boolean
  onClick: (tab: TabType) => void
}

const TopBarTab: React.FC<TopBarTabProps> = ({ label, tabId, isActive, onClick }) => {
  return (
    <button
      onClick={() => onClick(tabId)}
      className={classNames('py-2 px-4 text-sm font-medium', {
        'text-text-primary': isActive,
        'text-text-secondary hover:text-primary': !isActive
      })}
    >
      {label}
    </button>
  )
}

export default TopBarTab

import { Fragment, ReactNode } from 'react'
import { Popover, Transition } from '@headlessui/react'

interface PopoverMenuProps {
  children: ReactNode
  menuItems: ReactNode
}

export default function PopoverMenu({ children, menuItems }: PopoverMenuProps): JSX.Element {
  return (
    <Popover className="relative inline-block text-left">
      <Popover.Button className="focus:outline-none">{children}</Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute z-10 mt-2 w-48 right-0 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">{menuItems}</div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}

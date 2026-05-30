import { Accessor } from 'solid-js'
import { ChevronLeft, ChevronRight } from 'lucide-solid'
import TranslucentPanel from '../generics/TranslucentPanel'

// prop definitions
interface NavButtonsProps {
  leftEnabled: Accessor<boolean>
  rightEnabled: Accessor<boolean>
  onLeftClick: (e: any) => void
  onRightClick: (e: any) => void
}

export default function NavButtons({
  leftEnabled,
  rightEnabled,
  onLeftClick,
  onRightClick,
}: NavButtonsProps) {
  return (
    <>
      <button
        class='absolute top-3 bottom-3 left-0 pl-3 pr-20 
      active:outline-none flex justify-center items-center transition-opacity opacity-0 hover:opacity-100 hover:disabled:opacity-20'
        disabled={!leftEnabled()}
        onClick={onLeftClick}
      >
        <TranslucentPanel class='p-1'>
          <ChevronLeft strokeWidth={1.5} />
        </TranslucentPanel>
      </button>

      <button
        class='absolute top-3 bottom-3 right-0 pr-3 pl-20 hover:disabled:opacity-20 active:outline-none 
        transition-opacity flex justify-center items-center hover:opacity-100 opacity-0'
        onClick={onRightClick}
        disabled={!rightEnabled()}
      >
        <TranslucentPanel class='p-1'>
          <ChevronRight strokeWidth={1.5} />
        </TranslucentPanel>
      </button>
    </>
  )
}

import { VolumeX } from 'lucide-solid'
import TranslucentPanel from '../generics/TranslucentPanel'
import './MuteIndicator.css'
import { Accessor } from 'solid-js'

interface MuteIndicatorProps {
  muted: Accessor<boolean>
  show: Accessor<boolean>
}

export default function MuteIndicator(props: MuteIndicatorProps) {
  //if (!show) return null

  return (
    <>
      <div
        class={`fixed bottom-4 right-4 transition-opacity duration-300 
        ${props.muted() ? 'opacity-100' : 'opacity-0'} ${
          !props.show() && props.muted() ? 'pop-up-animation' : ''
        }`}
      >
        <TranslucentPanel class='p-3 rounded-full'>
          <VolumeX class='size-5' />
        </TranslucentPanel>
      </div>
    </>
  )
}

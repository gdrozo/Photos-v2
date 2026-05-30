import { Accessor } from 'solid-js'

const VIDEO_SERVER_URL = 'http://127.0.0.1:3001/media?path='

export default function BackgroundVideoBlur({
  mediaSrc,
}: {
  mediaSrc: Accessor<string>
}) {
  if (!mediaSrc()) return null
  return (
    <>
      <video
        class='absolute inset-0 object-center object-cover left-0 right-0 
            top-0 bottom-0 blur-xl  -z-10 max-w-none max-h-none min-h-0 min-w-0 h-dvh w-dvw'
        src={
          mediaSrc()
            ? `${VIDEO_SERVER_URL}${encodeURIComponent(mediaSrc())}`
            : ''
        }
      />
      <div class='absolute inset-0 left-0 right-0 top-0 bottom-0 -z-10 bg-black/50'></div>
    </>
  )
}

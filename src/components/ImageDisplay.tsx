import { Accessor } from 'solid-js'

const VIDEO_SERVER_URL = 'http://127.0.0.1:3001/media?path='

// prop definitions
interface ImageDisplayProps {
  imgRef: (el: HTMLImageElement) => void
  translate: Accessor<{ x: number; y: number }>
  scale: Accessor<number>
  mediaSrc: Accessor<string>
}

export default function ImageDisplay({
  imgRef,
  translate,
  scale,
  mediaSrc,
}: ImageDisplayProps) {
  return (
    <img
      ref={imgRef}
      draggable={false}
      class='h-full object-contain will-change-transform focus-visible:outline-none'
      style={
        {
          transformOrigin: '0 0',
          transform: `translate(${translate().x}px, ${
            translate().y
          }px) scale(${scale()})`,
          userSelect: 'none',
          WebkitUserDrag: 'none',
        } as any
      }
      src={
        mediaSrc() ? `${VIDEO_SERVER_URL}${encodeURIComponent(mediaSrc())}` : ''
      }
      alt='Displayed image'
    />
  )
}

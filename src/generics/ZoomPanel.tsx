import { Accessor, createEffect, createSignal, JSX } from 'solid-js'

// prop definitions
interface ZoomPanelProps {
  scale: Accessor<number>
  setScale: (scale: number | ((prev: number) => number)) => void
  translate: Accessor<{ x: number; y: number }>
  setTranslate: (
    translate:
      | { x: number; y: number }
      | ((prev: { x: number; y: number }) => { x: number; y: number }),
  ) => void
  children?: JSX.Element
  onClick?: () => void
  mediaSrc: Accessor<string | undefined>
  containerRef: HTMLDivElement | null
}

function ZoomPanel(props: ZoomPanelProps) {
  //Image zoom
  let container: HTMLDivElement | undefined
  let lastClickTime: number | undefined = undefined

  //const [scale, setScale] = useState(1)
  //const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = createSignal(false)

  const lastPan = { x: 0, y: 0 }

  const MIN_SCALE = 1
  const MAX_SCALE = 8

  createEffect(() => {
    if (container) container.style.cursor = ''
    props.mediaSrc()
  })

  const onWheel = (e: WheelEvent) => {
    //e.preventDefault()
    const c = props.containerRef

    if (!c) return

    const rect = c.getBoundingClientRect()
    const cursorX = e.clientX - rect.left // coords inside container
    const cursorY = e.clientY - rect.top

    const prevScale = props.scale()
    // Smooth zoom: use exponential so that deltaY scales nicely
    const zoomFactor = Math.exp(-e.deltaY * 0.0015)
    let newScale = prevScale * zoomFactor
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))

    // transform-origin is top-left (0,0). When scaling around top-left,
    // the image point at container coords (cursorX, cursorY) moves.
    // We adjust translate so that the image point under the cursor stays put.
    const dx = cursorX - props.translate().x
    const dy = cursorY - props.translate().y

    const ratio = newScale / prevScale
    const newTranslateX = cursorX - dx * ratio
    const newTranslateY = cursorY - dy * ratio

    props.setScale(newScale)

    if (newScale === 1) {
      c.style.cursor = ''
      props.setTranslate({ x: 0, y: 0 })
    } else {
      c.style.cursor = 'grab'
      props.setTranslate({ x: newTranslateX, y: newTranslateY })
    }
  }

  const onPointerDown = (e: PointerEvent) => {
    lastClickTime = Date.now()

    const c = container
    if (!c || !e.target) return
    //e.target.setPointerCapture(e.pointerId)
    setIsPanning(true)
    lastPan.x = e.clientX
    lastPan.y = e.clientY
  }

  const onPointerMove = (e: PointerEvent) => {
    lastClickTime = -1

    if (!isPanning()) return

    const dx = e.clientX - lastPan.x
    const dy = e.clientY - lastPan.y
    lastPan.x = e.clientX
    lastPan.y = e.clientY
    props.setTranslate(t => ({ x: t.x + dx, y: t.y + dy }))
  }

  const onPointerUp = (e: PointerEvent) => {
    setIsPanning(false)

    if (lastClickTime === undefined || lastClickTime === -1) return
    if (Date.now() - lastClickTime < 300) {
      lastClickTime = -1
    }
  }

  function onDoubleClick() {
    props.setScale(1)
    props.setTranslate({ x: 0, y: 0 })
  }

  return (
    <div
      ref={el => (container = el)}
      class='h-dvh w-dvw overflow-hidden flex justify-center relative bg-transparent'
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      ondblclick={onDoubleClick}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  )
}

export default ZoomPanel

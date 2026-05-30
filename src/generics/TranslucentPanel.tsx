import { JSX, ParentProps } from 'solid-js'

type TranslucentPanelProps = ParentProps<
  JSX.HTMLAttributes<HTMLDivElement> & {
    class?: string
    transparency?: number
    ref?: HTMLDivElement | ((el: HTMLDivElement) => void)
    style?: JSX.CSSProperties
  }
>

function TranslucentPanel(props: TranslucentPanelProps) {
  let transparency = props.transparency

  if (transparency === undefined) transparency = 60

  const bgColor: JSX.CSSProperties = {
    'background-color': `color-mix(in oklab, var(--color-black) /* #000 = #000000 */ ${transparency}%, transparent)`,
  }

  let style = props.style
  if (style) {
    style['background-color'] = bgColor['background-color']
  } else {
    style = bgColor
  }

  let className = props.class
  if (className) className += ' backdrop-blur rounded-2xl'
  else className = ' backdrop-blur rounded-2xl'

  return (
    <div {...props} ref={props.ref} style={style} class={className}>
      {props.children}
    </div>
  )
}

export default TranslucentPanel

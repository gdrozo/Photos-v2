import { Accessor, createEffect, createSignal, Setter } from 'solid-js'

export default function useConfiguration(
  id: string,
  onChange: (newValue: string) => void = () => {},
  defaultValue?: string
) {
  const [configState, setConfig] = createSignal<string>()

  const config = localStorage.getItem(id)
  if (config !== null) {
    setConfig(config)
  } else {
    setConfiguration(defaultValue || '')
  }

  createEffect(() => {
    const config = localStorage.getItem(id)
    if (config !== null && config !== configState()) {
      setConfig(config)
    }
  })

  function setConfiguration(value: string) {
    localStorage.setItem(id, value)

    if (value === configState()) return

    setConfig(value)
    if (onChange) onChange(value)
  }

  return [configState, setConfiguration] as [Accessor<string>, Setter<string>]
}

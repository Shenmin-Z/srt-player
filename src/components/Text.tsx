import { FC, useState, useEffect, useRef } from 'react'
import styles from './Text.module.less'

interface TextProps {
  width: number
  height: number
  text: string
  onClick?: () => void
}

export const Text: FC<TextProps> = ({ width, height, text, onClick = () => {} }) => {
  const [size, setSize] = useState({ width: -1, height: -1 })
  const textRef = useRef<SVGTextElement>(null)

  useEffect(() => {
    const svgText = textRef.current
    if (svgText) {
      const { width, height } = svgText.getBoundingClientRect()
      setSize({ width, height })
    }
  }, [text])

  let viewBox: string | undefined = undefined
  if (size.width > width) {
    viewBox = `0 0 ${size.width} ${size.height}`
  }

  return (
    <>
      <svg className={styles['off-screen']} width={width} height={height}>
        <text ref={textRef}>{text + '~'}</text>
      </svg>
      <svg width={width} height={height} viewBox={viewBox}>
        {size.width === -1 ? null : (
          <text y="50%" dominantBaseline="middle" onClick={onClick}>
            {text}
          </text>
        )}
      </svg>
    </>
  )
}

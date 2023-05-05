// time: second
export function formatTime(t: number, fractionDigits?: number, paddingZerosForHour?: boolean) {
  const h = t / 3600
  const m = (t % 3600) / 60
  const s = padding(t % 60, fractionDigits)
  if (h > 1 || paddingZerosForHour) {
    return `${padding(h)}:${padding(m)}:${s}`
  } else {
    return `${padding(m)}:${s}`
  }
}

function padding(t: number, fractionDigits?: number) {
  const integer = Math.trunc(t)
  const decimal = t % 1
  const paddedInteger = `${integer < 10 ? '0' : ''}${integer}`
  return fractionDigits ? `${paddedInteger}.${decimal.toFixed(fractionDigits).split('.')[1]}` : paddedInteger
}

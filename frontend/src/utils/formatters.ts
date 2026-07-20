import dayjs from 'dayjs'

export const formatHours = (hours: number) =>
  `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`

export const formatMiles = (miles: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(miles)

export const formatEventTime = (isoTime: string) =>
  dayjs(isoTime).format('MMM D, YYYY · h:mm A')

export const formatLogDate = (date: string) =>
  dayjs(date).format('dddd, MMM D')

export const formatDurationMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours === 0) return `${remainingMinutes} min`
  if (remainingMinutes === 0) return `${hours} hr`
  return `${hours} hr ${remainingMinutes} min`
}

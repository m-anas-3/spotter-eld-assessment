import dayjs from 'dayjs'

export const formatHours = (hours: number) =>
  `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`

export const formatMiles = (miles: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(miles)

export const formatEventTime = (isoTime: string) =>
  dayjs(isoTime).format('MMM D, h:mm A')

export const formatLogDate = (date: string) =>
  dayjs(date).format('dddd, MMM D')

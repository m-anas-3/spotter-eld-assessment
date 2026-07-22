import { Alert, Box, Divider, Paper, Stack, Typography } from '@mui/material'
import type { DailyEldEvent, DailyEldLog } from '../../types/trip'
import {
  ELD_STATUS_ROWS,
  getOrderedDailyEvents,
  isExactDailyTotal,
  readableDutyStatus,
} from '../../utils/eld'
import { formatLogDate, formatMiles } from '../../utils/formatters'
import { EldDutyGraph } from './EldDutyGraph'

interface EldLogSheetProps {
  log: DailyEldLog
  idPrefix?: string
}

export function EldLogSheet({ log, idPrefix = 'eld' }: EldLogSheetProps) {
  const events = getOrderedDailyEvents(log.events)
  const hasValidTotal = isExactDailyTotal(log.status_totals.total_minutes)
  const titleId = `${idPrefix}-eld-title-${log.date}`
  const descriptionId = `${idPrefix}-eld-description-${log.date}`
  const suppliedMetadata = [
    { label: 'Driver', value: joinMetadata(log.log_metadata.driver_name, log.log_metadata.driver_id) },
    {
      label: 'Carrier / main office',
      value: joinMetadata(log.log_metadata.carrier_name, log.log_metadata.main_office_address),
    },
    {
      label: 'Power unit / trailer',
      value: joinMetadata(log.log_metadata.tractor_number, log.log_metadata.trailer_number),
    },
    { label: 'Shipping document', value: log.log_metadata.shipping_document_number },
    {
      label: 'Shipper / commodity',
      value: joinMetadata(log.log_metadata.shipper_name, log.log_metadata.commodity),
    },
  ].filter((item): item is { label: string; value: string } => item.value !== null)

  return (
    <Paper
      component="article"
      variant="outlined"
      className="eld-document"
      aria-labelledby={titleId}
      sx={{ overflow: 'hidden', borderRadius: 0.75, bgcolor: 'background.paper' }}
    >
      <Stack
        className="eld-document-header"
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.75,
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography id={titleId} component="h4" variant="h3">
            {formatLogDate(log.date)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Projected record · not driver-certified
          </Typography>
        </Box>
        <Box sx={{ textAlign: { sm: 'right' } }}>
          <Typography
            variant="body2"
            color={hasValidTotal ? 'text.primary' : 'warning.main'}
            sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {hasValidTotal ? '24 total hours' : `${log.status_totals.total_hours} total hours`}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {log.log_metadata.period_start}–24:00 {log.log_metadata.time_zone}
          </Typography>
        </Box>
      </Stack>

      <Box
        className="eld-log-metadata"
        component="dl"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          m: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <MetadataItem label="Daily distance" value={`${formatMiles(log.total_driving_miles)} mi`} />
        <MetadataItem label="Co-driver" value={log.log_metadata.co_driver_name ?? 'N/A'} />
        {suppliedMetadata.map((item) => (
          <MetadataItem key={item.label} label={item.label} value={item.value} />
        ))}
        {suppliedMetadata.length === 0 && (
          <MetadataItem
            label="Trip record"
            value="Driver, carrier, vehicle, and shipment details were not supplied"
            wide
          />
        )}
      </Box>

      {!hasValidTotal && (
        <Alert severity="warning" sx={{ m: 2 }}>
          This log totals {log.status_totals.total_minutes} minutes instead of 1,440 minutes.
        </Alert>
      )}

      <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 1.75, pb: 0.75 }}>
        <Typography component="h5" variant="body2" sx={{ fontWeight: 600 }}>
          Driver duty graph
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Duty changes are plotted across the full 24-hour period.
        </Typography>
      </Box>

      <EldDutyGraph
        dateLabel={formatLogDate(log.date)}
        events={events}
        statusTotals={log.status_totals}
        titleId={titleId}
        descriptionId={descriptionId}
      />

      <Box className="eld-document-details" sx={{ px: { xs: 2, sm: 2.5 }, pb: 2.5 }}>
        <Typography component="h5" variant="body2" sx={{ mb: 0.75, fontWeight: 600 }}>
          Duty-status totals
        </Typography>
        <Box
          className="eld-totals"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(6, minmax(0, 1fr))' },
            borderTop: '1px solid',
            borderLeft: '1px solid',
            borderColor: 'divider',
          }}
        >
          {ELD_STATUS_ROWS.map((row) => (
            <TotalCell
              key={row.status}
              label={row.label}
              value={formatTotal(log.status_totals[row.totalKey])}
            />
          ))}
          <TotalCell
            label="On-duty total"
            value={formatTotal(log.status_totals.total_on_duty_hours)}
            emphasized
          />
          <TotalCell label="Total" value={formatTotal(log.status_totals.total_hours)} emphasized />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography component="h5" variant="body2" sx={{ mb: 0.75, fontWeight: 600 }}>
          Remarks and activity
        </Typography>
        <Box
          component="ol"
          className="eld-remarks"
          aria-label={`ELD event remarks for ${formatLogDate(log.date)}`}
          sx={{ listStyle: 'none', p: 0, m: 0 }}
        >
          {events.map((event, index) => (
            <Box
              component="li"
              className="eld-remarks-row"
              key={`${event.type}-remark-${event.start_minute}-${index}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '120px 170px 170px minmax(0, 1fr)' },
                gap: { xs: 0.35, md: 1.5 },
                py: 1.1,
                borderTop: index === 0 ? 'none' : '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {event.start_time}–{event.end_time}
              </Typography>
              <Typography variant="body2">{readableEventType(event)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {readableDutyStatus(event.status)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {[event.description, event.location].filter(Boolean).join(' · ') || 'No remarks'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  )
}

interface TotalCellProps {
  label: string
  value: string
  emphasized?: boolean
}

interface MetadataItemProps {
  label: string
  value: string
  wide?: boolean
}

function MetadataItem({ label, value, wide = false }: MetadataItemProps) {
  return (
    <Box
      sx={{
        minWidth: 0,
        px: 1.5,
        py: 1,
        borderRight: '1px solid',
        borderColor: 'divider',
        gridColumn: wide ? { xs: '1 / -1', md: 'span 2' } : 'auto',
      }}
    >
      <Typography component="dt" variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.15, fontWeight: 500, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  )
}

function TotalCell({ label, value, emphasized = false }: TotalCellProps) {
  return (
    <Box sx={{ p: 1, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, fontWeight: emphasized ? 600 : 500 }}>
        {value}
      </Typography>
    </Box>
  )
}

function formatTotal(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(2)} hr`
}

function joinMetadata(...values: Array<string | null>): string | null {
  const available = values.filter((value): value is string => Boolean(value))
  return available.length ? available.join(' · ') : null
}

function readableEventType(event: DailyEldEvent): string {
  return event.type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

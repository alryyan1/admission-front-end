import { Box, Typography } from '@mui/material'

interface DetailGridItem {
  key: string
  label: string
  value: React.ReactNode
}

interface DetailGridProps {
  items: DetailGridItem[]
  columns?: number
}

/** MUI replacement for antd's `Descriptions`: a labeled grid of read/edit fields. */
export function DetailGrid({ items, columns = 2 }: DetailGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: `repeat(${columns}, 1fr)` },
        columnGap: 3,
        rowGap: 2,
      }}
    >
      {items.map((item) => (
        <Box key={item.key} sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            component="div"
            sx={{ fontWeight: 600, mb: 0.5 }}
          >
            {item.label}
          </Typography>
          <Typography variant="body2" component="div" sx={{ wordBreak: 'break-word' }}>
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

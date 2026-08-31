import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

/** Application timezone — all dates are displayed and entered in this zone regardless of the browser's local zone. */
export const APP_TIMEZONE = 'Africa/Khartoum'

dayjs.tz.setDefault(APP_TIMEZONE)

export default dayjs

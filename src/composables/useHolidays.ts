import { ref, computed } from 'vue'

export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
  isCustom?: boolean
}

interface NagerHoliday {
  date: string
  localName: string
  name: string
  types: string[]
}

function getChunJieDate(_year: number, nagerHolidays: Holiday[]): string | null {
  const chunJie = nagerHolidays.find((h) => h.name === 'Chinese New Year (Spring Festival)')
  if (!chunJie) return null
  const d = new Date(chunJie.date)
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildYearHolidays(year: number, nagerHolidays: Holiday[]): Holiday[] {
  const holidays = [...nagerHolidays]

  // 除夕 = 春节前一天
  const chunJieEve = getChunJieDate(year, nagerHolidays)
  if (chunJieEve) {
    holidays.push({ date: chunJieEve, name: '除夕', isCustom: true })
  }

  // 高考固定在6月7日
  holidays.push({ date: `${year}-06-07`, name: '高考', isCustom: true })

  // 按日期排序
  holidays.sort((a, b) => a.date.localeCompare(b.date))
  return holidays
}

function calcDiffDays(from: Date, toDateStr: string): number {
  const [y, m, d] = toDateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  // Reset time part for pure day diff
  const now = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function calcDiffHours(from: Date, toDateStr: string): number {
  const [y, m, d] = toDateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  return Math.ceil((target.getTime() - from.getTime()) / (1000 * 60 * 60))
}

function getGreeting(holidayName: string): string {
  const greetings: Record<string, string> = {
    '元旦': '新年快乐！🎉',
    '除夕': '阖家团圆，幸福安康！🏮',
    '春节': '新春大吉，万事如意！🧨',
    '劳动节': '劳动节快乐！💪',
    '端午节': '端午安康！🐉',
    '中秋节': '中秋快乐，月圆人团圆！🥮',
    '国庆节': '国庆快乐！🇨🇳',
    '高考': '金榜题名，前程似锦！📚',
  }
  return greetings[holidayName] || '节日快乐！'
}

export function useHolidays(now: () => Date) {
  const holidays = ref<Holiday[]>([])
  const loaded = ref(false)
  const error = ref(false)

  const fetchHolidays = async () => {
    if (loaded.value) return
    try {
      const year = now().getFullYear()
      const res = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/CN`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as NagerHoliday[]
      const nagerHolidays: Holiday[] = data
        .filter((h) => h.types.includes('Public'))
        .map((h) => ({
          date: h.date,
          name: h.localName,
        }))
      holidays.value = buildYearHolidays(year, nagerHolidays)
      loaded.value = true
    } catch {
      error.value = true
    }
  }

  const nextHoliday = computed(() => {
    const current = now()
    const currentDateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`

    for (const h of holidays.value) {
      if (h.date >= currentDateStr) {
        const days = calcDiffDays(current, h.date)
        return { ...h, days }
      }
    }
    return null
  })

  const countdown = computed(() => {
    const nh = nextHoliday.value
    if (!nh) return null

    const current = now()

    if (nh.days === 0) {
      return {
        holiday: nh,
        isToday: true,
        hoursLeft: 0,
        greeting: getGreeting(nh.name),
      }
    }

    if (nh.days === 1) {
      const hoursLeft = calcDiffHours(current, nh.date)
      return {
        holiday: nh,
        isToday: false,
        hoursLeft: hoursLeft > 0 ? hoursLeft : 0,
        greeting: getGreeting(nh.name),
      }
    }

    return {
      holiday: nh,
      isToday: false,
      hoursLeft: 0,
      daysLeft: nh.days,
      greeting: getGreeting(nh.name),
    }
  })

  return {
    holidays,
    loaded,
    error,
    fetchHolidays,
    nextHoliday,
    countdown,
  }
}

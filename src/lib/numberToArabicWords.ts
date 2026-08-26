const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة']
const TEENS = [
  'عشرة',
  'أحد عشر',
  'اثنا عشر',
  'ثلاثة عشر',
  'أربعة عشر',
  'خمسة عشر',
  'ستة عشر',
  'سبعة عشر',
  'ثمانية عشر',
  'تسعة عشر',
]
const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
const HUNDREDS = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة']

interface Scale {
  singular: string
  dual: string
  plural: string
}

const SCALES: Scale[] = [
  { singular: '', dual: '', plural: '' },
  { singular: 'ألف', dual: 'ألفان', plural: 'آلاف' },
  { singular: 'مليون', dual: 'مليونان', plural: 'ملايين' },
  { singular: 'مليار', dual: 'ملياران', plural: 'مليارات' },
  { singular: 'تريليون', dual: 'تريليونان', plural: 'تريليونات' },
]

function convertUnder100(n: number): string {
  if (n < 10) return ONES[n]
  if (n < 20) return TEENS[n - 10]
  const tens = Math.floor(n / 10)
  const ones = n % 10
  if (ones === 0) return TENS[tens]
  return `${ONES[ones]} و${TENS[tens]}`
}

function convertUnder1000(n: number): string {
  if (n === 0) return ''
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const parts: string[] = []
  if (hundreds > 0) parts.push(HUNDREDS[hundreds])
  if (rest > 0) parts.push(convertUnder100(rest))
  return parts.join(' و')
}

function convertGroup(n: number, scale: Scale): string {
  if (n === 1) return scale.singular
  if (n === 2) return scale.dual
  if (n >= 3 && n <= 10) return `${convertUnder1000(n)} ${scale.plural}`
  return `${convertUnder1000(n)} ${scale.singular}`
}

/** Converts a non-negative integer to Arabic cardinal words, e.g. 3000 -> "ثلاثة آلاف". */
export function integerToArabicWords(value: number): string {
  const n = Math.max(0, Math.floor(value))
  if (n === 0) return 'صفر'

  const groups: number[] = []
  let remaining = n
  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }

  const parts: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]
    if (g === 0) continue
    parts.push(i === 0 ? convertUnder1000(g) : convertGroup(g, SCALES[i]))
  }
  return parts.join(' و')
}

/**
 * Converts a monetary amount to an Arabic words phrase, e.g. 3000 -> "ثلاثة آلاف جنيه فقط لا غير".
 * The fractional part (if any) is expressed in قرش (piastres).
 */
export function amountToArabicWords(value: number, currency = 'جنيه', subCurrency = 'قرش'): string {
  const rounded = Math.round(Math.abs(value) * 100) / 100
  const integerPart = Math.floor(rounded)
  const fractionPart = Math.round((rounded - integerPart) * 100)

  let result = `${integerToArabicWords(integerPart)} ${currency}`
  if (fractionPart > 0) {
    result += ` و${integerToArabicWords(fractionPart)} ${subCurrency}`
  }
  return `${result} فقط لا غير`
}

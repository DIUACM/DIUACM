import type { AdminIncentiveApplication, IncentiveCourse } from '@/api/types'

export type IncentiveExportFormat = 'xlsx' | 'csv'

type ExportCell = string | number | Date | null

const HEADERS = [
  'Application ID',
  'Full Name',
  'Student ID',
  'Batch',
  'Email',
  'Current Semester',
  'Phone Number',
  'Account Username',
  'Account Name',
  'Account ID',
  'Course Number',
  'Course Name',
  'Course Code',
  'Section',
  'Teacher Name',
  'Teacher Initial',
  'Teacher Email',
  'Teacher Phone',
  'Submitted At (UTC)',
  'Updated At (UTC)',
] as const

const COLUMN_WIDTHS = [15, 24, 18, 14, 28, 18, 17, 20, 24, 12, 14, 25, 15, 11, 24, 16, 28, 17, 22, 22]

function dateFromEpochSeconds(value: number): Date {
  return new Date(value * 1_000)
}

function rowForCourse(
  application: AdminIncentiveApplication,
  course: IncentiveCourse | null,
  courseIndex: number,
): ExportCell[] {
  return [
    application.id,
    application.fullName,
    application.studentId,
    application.batch,
    application.email,
    application.currentSemester,
    application.phoneNumber,
    application.applicant?.username ?? '',
    application.applicant?.name ?? '',
    application.applicant?.id ?? null,
    course ? courseIndex + 1 : null,
    course?.courseName ?? '',
    course?.courseCode ?? '',
    course?.section ?? '',
    course?.teacherName ?? '',
    course?.teacherInitial ?? '',
    course?.teacherEmail ?? '',
    course?.teacherPhone ?? '',
    dateFromEpochSeconds(application.createdAt),
    dateFromEpochSeconds(application.updatedAt),
  ]
}

export function buildIncentiveExportRows(
  applications: AdminIncentiveApplication[],
): ExportCell[][] {
  return applications.flatMap((application) => {
    const courses: (IncentiveCourse | null)[] =
      application.courses.length > 0 ? application.courses : [null]
    return courses.map((course, index) => rowForCourse(application, course, index))
  })
}

function csvValue(value: ExportCell): string {
  if (value === null) return ''
  if (typeof value === 'number') return String(value)

  const text =
    value instanceof Date
      ? value.toISOString().replace('T', ' ').replace('.000Z', ' UTC')
      : value
  // Spreadsheet programs may execute cells beginning with these characters as
  // formulas. Prefix user-entered text so opening the CSV cannot run a payload.
  const safeText = /^(?:[=+\-@\t\r]|\s+[=+\-@])/.test(text) ? `'${text}` : text
  return /[",\r\n]/.test(safeText) ? `"${safeText.replaceAll('"', '""')}"` : safeText
}

export function createIncentiveCsv(applications: AdminIncentiveApplication[]): Blob {
  const rows = [HEADERS, ...buildIncentiveExportRows(applications)]
  const csv = rows.map((row) => row.map(csvValue).join(',')).join('\r\n')
  return new Blob([`\uFEFF${csv}\r\n`], { type: 'text/csv;charset=utf-8' })
}

function xmlEscape(value: string): string {
  let xmlSafeValue = ''
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0
    const isAllowed =
      codePoint === 0x09 ||
      codePoint === 0x0a ||
      codePoint === 0x0d ||
      (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
      (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
      (codePoint >= 0x10000 && codePoint <= 0x10ffff)
    if (isAllowed) xmlSafeValue += character
  }

  return xmlSafeValue
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function columnName(index: number): string {
  let result = ''
  for (let current = index + 1; current > 0; current = Math.floor((current - 1) / 26)) {
    result = String.fromCharCode(65 + ((current - 1) % 26)) + result
  }
  return result
}

function worksheetCell(value: ExportCell, reference: string, header = false): string {
  if (value === null) return `<c r="${reference}"/>`
  if (value instanceof Date) {
    const excelSerial = value.getTime() / 86_400_000 + 25_569
    return `<c r="${reference}" s="3"><v>${excelSerial}</v></c>`
  }
  if (typeof value === 'number') {
    return `<c r="${reference}" s="2"><v>${value}</v></c>`
  }

  return `<c r="${reference}" t="inlineStr"${header ? ' s="1"' : ''}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`
}

function worksheetXml(rows: ExportCell[][]): string {
  const allRows: readonly (readonly ExportCell[])[] = [HEADERS, ...rows]
  const lastRow = allRows.length
  const lastColumn = columnName(HEADERS.length - 1)
  const columns = COLUMN_WIDTHS.map(
    (width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
  ).join('')
  const sheetRows = allRows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1
      const cells = row
        .map((value, columnIndex) =>
          worksheetCell(value, `${columnName(columnIndex)}${rowNumber}`, rowIndex === 0),
        )
        .join('')
      return `<row r="${rowNumber}"${rowIndex === 0 ? ' ht="24" customHeight="1"' : ''}>${cells}</row>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${columns}</cols>
  <sheetData>${sheetRows}</sheetData>
  <autoFilter ref="A1:${lastColumn}${lastRow}"/>
</worksheet>`
}

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`

const WORKBOOK_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Incentive Applications" sheetId="1" r:id="rId1"/></sheets>
</workbook>`

const WORKBOOK_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm &quot;UTC&quot;"/></numFmts>
  <fonts count="2">
    <font><sz val="11"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos Display"/><family val="2"/></font>
  </fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF166534"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FF14532D"/></bottom><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`

const APP_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>DIUACM Admin</Application></Properties>`

const CORE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Incentive Applications</dc:title><dc:creator>DIUACM Admin</dc:creator></cp:coreProperties>`

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0)
  return value >>> 0
})

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}

function joinBytes(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

function zipStored(files: { name: string; content: string }[]): Uint8Array {
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let localOffset = 0

  for (const file of files) {
    const name = encoder.encode(file.name)
    const data = encoder.encode(file.content)
    const checksum = crc32(data)
    const localHeader = new Uint8Array(30 + name.length)
    const localView = new DataView(localHeader.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0x0800, true)
    localView.setUint32(14, checksum, true)
    localView.setUint32(18, data.length, true)
    localView.setUint32(22, data.length, true)
    localView.setUint16(26, name.length, true)
    localHeader.set(name, 30)
    localParts.push(localHeader, data)

    const centralHeader = new Uint8Array(46 + name.length)
    const centralView = new DataView(centralHeader.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(8, 0x0800, true)
    centralView.setUint32(16, checksum, true)
    centralView.setUint32(20, data.length, true)
    centralView.setUint32(24, data.length, true)
    centralView.setUint16(28, name.length, true)
    centralView.setUint32(42, localOffset, true)
    centralHeader.set(name, 46)
    centralParts.push(centralHeader)
    localOffset += localHeader.length + data.length
  }

  const centralDirectory = joinBytes(centralParts)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(8, files.length, true)
  endView.setUint16(10, files.length, true)
  endView.setUint32(12, centralDirectory.length, true)
  endView.setUint32(16, localOffset, true)
  return joinBytes([...localParts, centralDirectory, end])
}

export function createIncentiveWorkbook(applications: AdminIncentiveApplication[]): Blob {
  const files = [
    { name: '[Content_Types].xml', content: CONTENT_TYPES_XML },
    { name: '_rels/.rels', content: ROOT_RELS_XML },
    { name: 'docProps/app.xml', content: APP_XML },
    { name: 'docProps/core.xml', content: CORE_XML },
    { name: 'xl/workbook.xml', content: WORKBOOK_XML },
    { name: 'xl/_rels/workbook.xml.rels', content: WORKBOOK_RELS_XML },
    { name: 'xl/styles.xml', content: STYLES_XML },
    { name: 'xl/worksheets/sheet1.xml', content: worksheetXml(buildIncentiveExportRows(applications)) },
  ]
  const bytes = zipStored(files)
  return new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function localDateStamp(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function downloadIncentiveExport(
  applications: AdminIncentiveApplication[],
  format: IncentiveExportFormat,
): void {
  const blob =
    format === 'xlsx'
      ? createIncentiveWorkbook(applications)
      : createIncentiveCsv(applications)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `incentive-applications-${localDateStamp()}.${format}`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

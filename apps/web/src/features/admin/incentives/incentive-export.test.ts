import { describe, expect, it } from 'vitest'
import type { AdminIncentiveApplication } from '@/api/types'
import {
  buildIncentiveExportRows,
  createIncentiveCsv,
  createIncentiveWorkbook,
} from './incentive-export'

const application: AdminIncentiveApplication = {
  id: 42,
  userId: 7,
  fullName: '  =Potential formula',
  studentId: '201-15-1000',
  batch: 'CSE 65',
  email: 'student@example.com',
  currentSemester: 'Spring 2026',
  phoneNumber: '01800000000',
  courses: [
    {
      courseName: 'Algorithms, Advanced',
      courseCode: 'CSE221',
      teacherName: 'Jane Doe',
      teacherInitial: 'JD',
      section: 'A',
      teacherEmail: 'jane@example.com',
      teacherPhone: '01700000000',
    },
    {
      courseName: 'Databases',
      courseCode: 'CSE315',
      teacherName: 'John Roe',
      teacherInitial: 'JR',
      section: 'B',
      teacherEmail: 'john@example.com',
      teacherPhone: '01900000000',
    },
  ],
  createdAt: 1_700_000_000,
  updatedAt: 1_700_003_600,
  applicant: {
    id: 7,
    name: 'Account Name',
    username: 'student7',
    image: null,
    isBanned: false,
    banReason: null,
  },
  handles: {
    codeforces: [{ id: 1, handle: 'student_cf' }],
    vjudge: [
      { id: 2, handle: 'student_vj_1' },
      { id: 3, handle: 'student_vj_2' },
    ],
    atcoder: [{ id: 4, handle: 'student_ac' }],
  },
}

describe('incentive application exports', () => {
  it('creates one complete export row per claimed course', () => {
    const rows = buildIncentiveExportRows([application])

    expect(rows).toHaveLength(2)
    expect(rows[0]).toContain('Algorithms, Advanced')
    expect(rows[1]).toContain('Databases')
    expect(rows[0]).toContain('student7')
    expect(rows[0]).toContain('student_cf')
    expect(rows[0]).toContain('student_vj_1; student_vj_2')
    expect(rows[0]).toContain('student_ac')
  })

  it('creates an Excel-friendly UTF-8 CSV and neutralizes formulas', async () => {
    const csv = createIncentiveCsv([application])
    const bytes = new Uint8Array(await csv.arrayBuffer())
    const text = await csv.text()

    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(text.startsWith('Application ID,Full Name')).toBe(true)
    expect(text).toContain("'  =Potential formula")
    expect(text).toContain('"Algorithms, Advanced"')
    expect(text.split('\r\n')).toHaveLength(4)
  })

  it('creates a real XLSX package with formatting and every course', async () => {
    const bytes = new Uint8Array(await createIncentiveWorkbook([application]).arrayBuffer())
    const packageText = new TextDecoder().decode(bytes)

    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04])
    expect(packageText).toContain('[Content_Types].xml')
    expect(packageText).toContain('Incentive Applications')
    expect(packageText).toContain('Algorithms, Advanced')
    expect(packageText).toContain('Databases')
    expect(packageText).toContain('Codeforces Handle')
    expect(packageText).toContain('student_vj_1; student_vj_2')
    expect(packageText).toContain('<autoFilter ref="A1:W3"/>')
    expect(packageText).toContain('state="frozen"')
  })
})

import { TeacherRecord } from '../types/student';

export const TEACHERS_ROSTER: TeacherRecord[] = [
  { id: 'STAFF-01', serialNo: '01', teacherId: 'DHAC/STAFF/01', name: 'SHAFI MM HUDAWI', username: 'STAFF.SHAFI' },
  { id: 'STAFF-02', serialNo: '02', teacherId: 'DHAC/STAFF/02', name: 'SUHAIL HUDAWI', username: 'STAFF.SUHAIL' },
  { id: 'STAFF-03', serialNo: '03', teacherId: 'DHAC/STAFF/03', name: 'FAREED KHAN HUDAWI', username: 'STAFF.FAREED' },
  { id: 'STAFF-04', serialNo: '04', teacherId: 'DHAC/STAFF/04', name: 'THAMEEM HUDAWI', username: 'STAFF.THAMEEM' },
  { id: 'STAFF-05', serialNo: '05', teacherId: 'DHAC/STAFF/05', name: 'FAISAL HUDAWI', username: 'STAFF.FAISAL' },
  { id: 'STAFF-06', serialNo: '06', teacherId: 'DHAC/STAFF/06', name: 'AFTHAB HUDAWI', username: 'STAFF.AFTHAB' },
  { id: 'STAFF-07', serialNo: '07', teacherId: 'DHAC/STAFF/07', name: 'SHAIKH ALI HUDAWI', username: 'STAFF.SHAIKH' },
  { id: 'STAFF-08', serialNo: '08', teacherId: 'DHAC/STAFF/08', name: 'MOHIYUDHEEN HUDAWI', username: 'STAFF.MOHIYUDHEEN' },
  { id: 'STAFF-09', serialNo: '09', teacherId: 'DHAC/STAFF/09', name: 'FIROZ BABU KT HUDAWI', username: 'STAFF.FIROZ' },
  { id: 'STAFF-10', serialNo: '10', teacherId: 'DHAC/STAFF/10', name: 'MOHAMED ABDU RAHIM HUDAWI', username: 'STAFF.MOHAMED' },
  { id: 'STAFF-11', serialNo: '11', teacherId: 'DHAC/STAFF/11', name: 'NASIM AKHTHAR HUDAWI', username: 'STAFF.NASIM' },
  { id: 'STAFF-12', serialNo: '12', teacherId: 'DHAC/STAFF/12', name: 'MUHAMMED HASSAN HUDAWI', username: 'STAFF.MUHAMMED' },
  { id: 'STAFF-13', serialNo: '13', teacherId: 'DHAC/STAFF/13', name: 'MOHAMED SHIBIL HUDAWI', username: 'STAFF.SHIBIL' },
  { id: 'STAFF-14', serialNo: '14', teacherId: 'DHAC/STAFF/14', name: 'SHUAIB A HUDAWI', username: 'STAFF.SHUAIB' },
  { id: 'STAFF-15', serialNo: '15', teacherId: 'DHAC/STAFF/15', name: 'RUHUL AMIN HUDAWI', username: 'STAFF.RUHUL' },
  { id: 'STAFF-16', serialNo: '16', teacherId: 'DHAC/STAFF/16', name: 'MD FARIDUL ISLAM HUDAWI', username: 'STAFF.FARIDUL' },
  { id: 'STAFF-17', serialNo: '17', teacherId: 'DHAC/STAFF/17', name: 'MOHAMMED MURSHID A HUDAWI', username: 'STAFF.MURSHID' },
  { id: 'STAFF-18', serialNo: '18', teacherId: 'DHAC/STAFF/18', name: 'SHARAFATH MS HUDAWI', username: 'STAFF.SHARAFATH' },
  { id: 'STAFF-19', serialNo: '19', teacherId: 'DHAC/STAFF/19', name: 'FARIDUL ISLAM HUDAWI', username: 'STAFF.FARIDUL_S1A' },
  { id: 'STAFF-20', serialNo: '20', teacherId: 'DHAC/STAFF/20', name: 'HALIMUZ ZAMAN HUDAWI', username: 'STAFF.HALIMUZ' },
];

export function getMentorDocId(teacher: Pick<TeacherRecord, 'id' | 'serialNo' | 'teacherId'>): string {
  if (teacher.id && /^[a-zA-Z0-9_-]+$/.test(teacher.id)) {
    return teacher.id;
  }
  const cleanSerial = (teacher.serialNo || teacher.teacherId.split('/').pop() || '01').replace(/[^a-zA-Z0-9_-]/g, '');
  return `STAFF-${cleanSerial.padStart(2, '0')}`;
}

export function findTeacherByMentorName(mentorName: string): TeacherRecord | undefined {
  return TEACHERS_ROSTER.find(t => t.name === mentorName);
}

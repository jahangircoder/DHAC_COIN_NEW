import { StudentRecord, UnionDefinition, UnionStats } from '../types/student';

export const BATCH_NAMES: Record<string, string> = {
  'S1A': '13th Batch',
  'S1B': '13th Batch',
  'S2A': 'SAWRA',
  'S2B': 'SAWRA',
  'S3A': 'QUDWA',
  'S3B': 'QUDWA',
  'S4': 'HIKMA',
  'S5': 'IKHWA',
  'HS1': 'USRA',
  'HS2': 'IMAD',
  'D1': 'TAIBAH',
  'D2': 'MIDAD',
};

export const DEFAULT_UNIONS: UnionDefinition[] = [
  {
    id: 'union-13th',
    unionName: '13th Batch (No Union Created)',
    classes: ['S1A', 'S1B'],
    category: 'Secondary',
    isNoUnionBatch: true,
  },
  {
    id: 'union-sawra',
    unionName: 'SAWRA',
    classes: ['S2A', 'S2B'],
    category: 'Secondary',
  },
  {
    id: 'union-qudwa',
    unionName: 'QUDWA',
    classes: ['S3A', 'S3B'],
    category: 'Secondary',
  },
  {
    id: 'union-hikma',
    unionName: 'HIKMA',
    classes: ['S4'],
    category: 'Secondary',
  },
  {
    id: 'union-ikhwa',
    unionName: 'IKHWA',
    classes: ['S5'],
    category: 'Secondary',
  },
  {
    id: 'union-usra',
    unionName: 'USRA',
    classes: ['HS1'],
    category: 'Higher Secondary',
  },
  {
    id: 'union-imad',
    unionName: 'IMAD',
    classes: ['HS2'],
    category: 'Higher Secondary',
  },
  {
    id: 'union-taibah',
    unionName: 'TAIBAH',
    classes: ['D1'],
    category: 'Degree',
  },
  {
    id: 'union-midad',
    unionName: 'MIDAD',
    classes: ['D2'],
    category: 'Degree',
  },
];

export function getBatchName(className: string): string {
  return BATCH_NAMES[className] || className;
}

export function getClassWithBatch(className: string): string {
  const batch = BATCH_NAMES[className];
  return batch ? `${className} (${batch})` : className;
}

export function getUnionForClass(className: string, customUnions?: UnionDefinition[]): UnionDefinition | undefined {
  const list = customUnions && customUnions.length > 0 ? customUnions : DEFAULT_UNIONS;
  return list.find(u => u.classes.includes(className));
}

export function computeUnionStats(
  students: StudentRecord[],
  classAwards: Record<string, number> = {},
  customUnions?: UnionDefinition[]
): UnionStats[] {
  const list = customUnions && customUnions.length > 0 ? customUnions : DEFAULT_UNIONS;
  const result: UnionStats[] = [];

  for (const u of list) {
    const memberStudents = students.filter(s => u.classes.includes(s.className));
    const studentCoins = memberStudents.reduce((sum, s) => sum + s.totalCoins, 0);
    
    // Sum class batch awards of all member classes
    const classAwardCoins = u.classes.reduce((sum, cls) => sum + (classAwards[cls] || 0), 0);
    const totalCoins = studentCoins + classAwardCoins;
    const activeStudents = memberStudents.filter(s => s.totalCoins > 0).length;
    const zeroCoinStudents = memberStudents.filter(s => s.totalCoins === 0).length;
    const averageCoins = memberStudents.length ? Math.round((totalCoins / memberStudents.length) * 10) / 10 : 0;

    const sortedStudents = [...memberStudents].sort(
      (a, b) => b.totalCoins - a.totalCoins || a.campusRankNum - b.campusRankNum
    );
    const topStudent = sortedStudents[0] || null;

    result.push({
      id: u.id,
      unionName: u.unionName,
      classes: u.classes,
      category: u.category || 'Secondary',
      studentCount: memberStudents.length,
      studentCoins,
      classAwardCoins,
      totalCoins,
      averageCoins,
      activeStudents,
      zeroCoinStudents,
      topStudent,
      rank: 0,
    });
  }

  // Competition rank by totalCoins descending, then averageCoins
  result.sort((a, b) => b.totalCoins - a.totalCoins || b.averageCoins - a.averageCoins);
  result.forEach((u, idx) => {
    u.rank = idx + 1;
  });

  return result;
}

import { StudentRecord, MentorStats, ClassStats } from '../types/student';
import { getBatchName } from './batchNames';

/**
 * PARSE CSV LINE WITH DOUBLE QUOTE PROTECTION
 * Accurately extracts values while preventing string segmentation on commas within quotes.
 */
export function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let c = 0; c < line.length; c++) {
    const char = line[c];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values.map(v => v.replace(/^"|"$/g, '').trim());
}

/**
 * PARSE REGISTRY DATA COHORT
 * Processes the raw file database lines into standardized relational records.
 */
export function parseCSV(csvText: string): StudentRecord[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];
  
  const records: StudentRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length >= 15) {
      const studentId = values[0];
      const adNo = values[1];
      const adFlag = (values[2] as StudentRecord['adFlag']) || 'VALID';
      const name = values[3];
      const className = values[4];
      const mentorName = values[5];
      const totalCoins = parseInt(values[6], 10) || 0;
      const coinStatus = (values[7] as StudentRecord['coinStatus']) || 'ZERO';
      const mentorRankNum = parseInt(values[8], 10) || 1;
      const mentorGroupSize = parseInt(values[9], 10) || 1;
      const classRankNum = parseInt(values[10], 10) || 1;
      const classSize = parseInt(values[11], 10) || 1;
      const campusRankNum = parseInt(values[12], 10) || 1;
      const campusTotalStudents = parseInt(values[13], 10) || 290;
      const rankStatus = (values[14] as StudentRecord['rankStatus']) || 'OFFICIAL';
      const notes = values[15] || '';
      
      let tier: StudentRecord['tier'] = 'Zero';
      if (totalCoins >= 60) tier = 'Diamond';
      else if (totalCoins >= 30) tier = 'Gold';
      else if (totalCoins >= 15) tier = 'Silver';
      else if (totalCoins > 0) tier = 'Bronze';

      records.push({
        id: studentId,
        studentId,
        officialId: `DHAC/ST/2026/${className}/${adNo}`,
        adNo,
        adFlag,
        name,
        className,
        batchName: getBatchName(className),
        mentorName,
        totalCoins,
        coinStatus,
        mentorGroupRank: `#${mentorRankNum}/${mentorGroupSize}`,
        mentorRankNum,
        mentorGroupSize,
        classRank: `#${classRankNum}`,
        classRankNum,
        classSize,
        campusRank: `#${campusRankNum}`,
        campusRankNum,
        campusTotalStudents,
        rankStatus,
        notes,
        tier,
      });
    }
  }
  return records;
}

/**
 * HIGH-PERFORMANCE MENTOR COHORT AGGREGATOR
 * Computes pastoral analytics across groups using pre-indexed linear indexing structures.
 */
export function computeMentorStats(students: StudentRecord[]): MentorStats[] {
  const mentorMap = new Map<string, StudentRecord[]>();
  
  // Linear allocation traversal pass
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    let group = mentorMap.get(s.mentorName);
    if (!group) {
      group = [];
      mentorMap.set(s.mentorName, group);
    }
    group.push(s);
  }

  const output: MentorStats[] = [];
  
  // Extract mathematical calculations using direct array indices
  for (const [mentorName, group] of mentorMap.entries()) {
    let sum = 0, active = 0, zero = 0;
    let top: StudentRecord | null = null;
    
    for (let j = 0; j < group.length; j++) {
      const item = group[j];
      sum += item.totalCoins;
      if (item.totalCoins > 0) active++; else zero++;
      if (!top || item.totalCoins > top.totalCoins) top = item;
    }
    
    output.push({
      mentorName,
      studentCount: group.length,
      totalCoins: sum,
      averageCoins: group.length ? Math.round((sum / group.length) * 10) / 10 : 0,
      activeStudents: active,
      zeroCoinStudents: zero,
      topStudent: top,
      rank: 0
    });
  }
  
  // Return sorted mentor roster mapping arrays
  return output.sort((a, b) => b.totalCoins - a.totalCoins);
}

/**
 * HIGH-PERFORMANCE BATCH COMPUTE ACCUMULATOR
 * Leverages single-pass accumulators to compile statistics for all 12 educational cohorts.
 */
export function computeClassStats(students: StudentRecord[], classAwards: Record<string, number> = {}): ClassStats[] {
  const classMap = new Map<string, StudentRecord[]>();
  
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    let group = classMap.get(s.className);
    if (!group) {
      group = [];
      classMap.set(s.className, group);
    }
    group.push(s);
  }

  const output: ClassStats[] = [];
  
  for (const [className, group] of classMap.entries()) {
    let studentCoins = 0, active = 0, zero = 0;
    let top: StudentRecord | null = null;

    for (let j = 0; j < group.length; j++) {
      const item = group[j];
      studentCoins += item.totalCoins;
      if (item.totalCoins > 0) active++; else zero++;
      if (!top || item.totalCoins > top.totalCoins) top = item;
    }

    const awardCoins = classAwards[className] || 0;
    const aggregated = studentCoins + awardCoins;

    output.push({
      className,
      batchName: getBatchName(className),
      category: className.startsWith('D') ? 'Degree' : className.startsWith('HS') ? 'Higher Secondary' : 'Secondary',
      studentCount: group.length,
      studentCoins,
      classAwardCoins: awardCoins,
      totalCoins: aggregated,
      averageCoins: group.length ? Math.round((aggregated / group.length) * 10) / 10 : 0,
      activeStudents: active,
      zeroCoinStudents: zero,
      topStudent: top,
      rank: 0
    });
  }
  return output.sort((a, b) => b.totalCoins - a.totalCoins);
}

/**
 * RECALCULATE COMPETITION RANKS & TIERS ACROSS REGISTRY (1224 RULE)
 */
export function recalculateAllRanks(records: StudentRecord[]): void {
  if (!Array.isArray(records) || records.length === 0) return;

  // 1. Campus competition ranks
  records.sort((a, b) => b.totalCoins - a.totalCoins);
  let currentCampusRank = 1;
  for (let i = 0; i < records.length; i++) {
    if (i > 0 && records[i].totalCoins < records[i - 1].totalCoins) {
      currentCampusRank = i + 1;
    }
    records[i].campusRankNum = currentCampusRank;
    records[i].campusRank = `#${currentCampusRank}`;
    records[i].campusTotalStudents = records.length;

    const score = records[i].totalCoins;
    if (score >= 60) records[i].tier = 'Diamond';
    else if (score >= 30) records[i].tier = 'Gold';
    else if (score >= 15) records[i].tier = 'Silver';
    else if (score > 0) records[i].tier = 'Bronze';
    else records[i].tier = 'Zero';
  }

  // 2. Class ranks
  const classGroups = new Map<string, StudentRecord[]>();
  records.forEach(s => {
    if (!classGroups.has(s.className)) classGroups.set(s.className, []);
    classGroups.get(s.className)!.push(s);
  });
  for (const [, classList] of classGroups.entries()) {
    classList.sort((a, b) => b.totalCoins - a.totalCoins);
    let currentClassRank = 1;
    for (let i = 0; i < classList.length; i++) {
      if (i > 0 && classList[i].totalCoins < classList[i - 1].totalCoins) {
        currentClassRank = i + 1;
      }
      classList[i].classRankNum = currentClassRank;
      classList[i].classRank = `#${currentClassRank}`;
      classList[i].classSize = classList.length;
    }
  }

  // 3. Mentor ranks
  const mentorGroups = new Map<string, StudentRecord[]>();
  records.forEach(s => {
    if (!mentorGroups.has(s.mentorName)) mentorGroups.set(s.mentorName, []);
    mentorGroups.get(s.mentorName)!.push(s);
  });
  for (const [, mentorList] of mentorGroups.entries()) {
    mentorList.sort((a, b) => b.totalCoins - a.totalCoins);
    let currentMentorRank = 1;
    for (let i = 0; i < mentorList.length; i++) {
      if (i > 0 && mentorList[i].totalCoins < mentorList[i - 1].totalCoins) {
        currentMentorRank = i + 1;
      }
      mentorList[i].mentorRankNum = currentMentorRank;
      mentorList[i].mentorGroupSize = mentorList.length;
      mentorList[i].mentorGroupRank = `#${currentMentorRank}/${mentorList.length}`;
    }
  }
}

/**
 * EXPORT 16-COLUMN STANDARDIZED CSV
 */
export function exportToCleanedCSV(students: StudentRecord[]): string {
  const headers = [
    'Student_ID',
    'AD No',
    'AD_Flag',
    'Student Name',
    'Class',
    'Mentor Name',
    'Total Coins',
    'Coin_Status',
    'Mentor Group Rank',
    'Mentor_Group_Size',
    'Class Rank',
    'Class_Size',
    'Campus Rank',
    'Campus_Total_Students',
    'Rank_Status',
    'Notes',
  ];
  const sorted = [...students].sort((a, b) => a.campusRankNum - b.campusRankNum);
  const rows = sorted.map(s => [
    `"${s.studentId}"`,
    `"${s.adNo}"`,
    `"${s.adFlag}"`,
    `"${s.name}"`,
    `"${s.className}"`,
    `"${s.mentorName}"`,
    `"${s.totalCoins}"`,
    `"${s.coinStatus}"`,
    `"${s.mentorRankNum}"`,
    `"${s.mentorGroupSize}"`,
    `"${s.classRankNum}"`,
    `"${s.classSize}"`,
    `"${s.campusRankNum}"`,
    `"${s.campusTotalStudents}"`,
    `"${s.rankStatus}"`,
    `"${s.notes || ''}"`,
  ]);
  return [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
}


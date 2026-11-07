export interface CoinActivityRule {
  id: string;
  name: string;
  coins: number | 'custom';
  forClassOnly?: boolean;
  notes?: string;
}

export interface CoinCategory {
  id: string;
  categoryName: string;
  description?: string;
  activities: CoinActivityRule[];
}

export const COIN_RULES_TABLE: CoinCategory[] = [
  {
    id: 'publication',
    categoryName: 'PUBLICATION',
    activities: [
      { id: 'pub-essay', name: 'Essay & Article', coins: 10 },
      { id: 'pub-story', name: 'Story', coins: 8 },
      { id: 'pub-poem', name: 'Poem', coins: 7 },
      { id: 'pub-art', name: 'Picture / Painting', coins: 8 },
      { id: 'pub-class-mag', name: 'Class Magazine', coins: 20, forClassOnly: true, notes: 'Awarded to entire class' },
      { id: 'pub-class-news', name: 'Newspaper (Class)', coins: 15, forClassOnly: true, notes: 'Awarded to entire class' },
      { id: 'pub-letter-news', name: 'Letter to Newspaper', coins: 10 },
      { id: 'pub-ind-mag', name: 'Book / Magazine (Individual)', coins: 30 },
      { id: 'pub-ind-news', name: 'Newspaper (Individual)', coins: 25 },
    ],
  },
  {
    id: 'outer-activities',
    categoryName: 'OUTER ACTIVITIES',
    activities: [
      { id: 'outer-paper', name: 'Paper Presentation', coins: 15 },
      { id: 'outer-speech', name: 'Public Speech', coins: 10 },
    ],
  },
  {
    id: 'inner-campus-contest',
    categoryName: 'INNER CAMPUS CONTEST',
    activities: [
      { id: 'contest-pams', name: 'PAMS Scholarship', coins: 15 },
      { id: 'contest-1st', name: 'Contest - 1st Place', coins: 7 },
      { id: 'contest-2nd', name: 'Contest - 2nd Place', coins: 5 },
      { id: 'contest-3rd', name: 'Contest - 3rd Place', coins: 3 },
    ],
  },
  {
    id: 'campus-union',
    categoryName: 'CAMPUS UNION',
    activities: [
      { id: 'union-1st', name: 'Campus Union - 1st Place', coins: 7 },
      { id: 'union-2nd', name: 'Campus Union - 2nd Place', coins: 5 },
      { id: 'union-3rd', name: 'Campus Union - 3rd Place', coins: 3 },
    ],
  },
  {
    id: 'class-union',
    categoryName: 'CLASS UNION',
    activities: [
      { id: 'cl-union-1st', name: 'Class Union - 1st Place', coins: 5 },
      { id: 'cl-union-2nd', name: 'Class Union - 2nd Place', coins: 3 },
      { id: 'cl-union-3rd', name: 'Class Union - 3rd Place', coins: 1 },
    ],
  },
  {
    id: 'class-teacher-program',
    categoryName: 'CLASS TEACHER PROGRAM',
    activities: [
      { id: 'ctp-1st', name: 'Class Teacher Program - 1st Place', coins: 6 },
      { id: 'ctp-2nd', name: 'Class Teacher Program - 2nd Place', coins: 4 },
      { id: 'ctp-3rd', name: 'Class Teacher Program - 3rd Place', coins: 2 },
    ],
  },
  {
    id: 'exam-semester',
    categoryName: 'EXAMINATION: Semester Examination',
    activities: [
      { id: 'exam-sem-95', name: 'Semester Exam 95%+', coins: 20 },
      { id: 'exam-sem-90', name: 'Semester Exam 90%+', coins: 18 },
      { id: 'exam-sem-85', name: 'Semester Exam 85%+', coins: 16 },
      { id: 'exam-sem-80', name: 'Semester Exam 80%+', coins: 14 },
      { id: 'exam-sem-75', name: 'Semester Exam 75%+', coins: 12 },
      { id: 'exam-sem-70', name: 'Semester Exam 70%+', coins: 10 },
      { id: 'exam-sem-65', name: 'Semester Exam 65%+', coins: 8 },
      { id: 'exam-sem-60', name: 'Semester Exam 60%+', coins: 6 },
      { id: 'exam-sem-55', name: 'Semester Exam 55%+', coins: 4 },
      { id: 'exam-sem-50', name: 'Semester Exam 50%+', coins: 2 },
    ],
  },
  {
    id: 'exam-cce',
    categoryName: 'EXAMINATION: CCE Assessment (1st, 2nd & 3rd)',
    activities: [
      { id: 'exam-cce-95', name: 'CCE Assessment 95%+', coins: 10 },
      { id: 'exam-cce-90', name: 'CCE Assessment 90%+', coins: 9 },
      { id: 'exam-cce-85', name: 'CCE Assessment 85%+', coins: 8 },
      { id: 'exam-cce-80', name: 'CCE Assessment 80%+', coins: 7 },
      { id: 'exam-cce-75', name: 'CCE Assessment 75%+', coins: 6 },
      { id: 'exam-cce-70', name: 'CCE Assessment 70%+', coins: 5 },
      { id: 'exam-cce-65', name: 'CCE Assessment 65%+', coins: 4 },
      { id: 'exam-cce-60', name: 'CCE Assessment 60%+', coins: 3 },
      { id: 'exam-cce-55', name: 'CCE Assessment 55%+', coins: 2 },
      { id: 'exam-cce-50', name: 'CCE Assessment 50%+', coins: 1 },
    ],
  },
  {
    id: 'ibadath',
    categoryName: 'IBADATH',
    activities: [
      { id: 'iba-imam', name: 'Al-Imam', coins: 5 },
      { id: 'iba-haddad', name: 'Haddad Leading', coins: 10 },
      { id: 'iba-ziyarat', name: 'Ziyarat / Dua', coins: 3 },
      { id: 'iba-azan', name: 'Azan', coins: 3 },
    ],
  },
  {
    id: 'special-appreciation',
    categoryName: 'SPECIAL APPRECIATION',
    activities: [
      { id: 'spec-teacher', name: 'Class Teacher Appreciation', coins: 'custom', notes: 'Custom amount decided by admin' },
      { id: 'spec-principal', name: 'Principal Appreciation', coins: 'custom', notes: 'Custom amount decided by admin' },
    ],
  },
  {
    id: 'self-improvements',
    categoryName: 'SELF IMPROVEMENTS',
    activities: [
      { id: 'self-70', name: 'Improvement > 70%', coins: 15 },
      { id: 'self-65', name: 'Improvement 65%', coins: 13 },
      { id: 'self-50', name: 'Improvement 50%', coins: 11 },
      { id: 'self-40', name: 'Improvement 40%', coins: 9 },
      { id: 'self-30', name: 'Improvement 30%', coins: 7 },
      { id: 'self-20', name: 'Improvement 20%', coins: 5 },
      { id: 'self-10', name: 'Improvement 10%', coins: 3 },
      { id: 'self-5', name: 'Improvement 5%', coins: 1 },
    ],
  },
  {
    id: 'special-programs',
    categoryName: 'SPECIAL PROGRAMS (Kulliya, Qawalli, etc.)',
    activities: [
      { id: 'sp-part', name: 'Group / Kulliya (e.g. Qawalli) - Participation', coins: 5 },
      { id: 'sp-1st', name: 'Group / Kulliya (e.g. Qawalli) - 1st Place', coins: 15 },
      { id: 'sp-2nd', name: 'Group / Kulliya (e.g. Qawalli) - 2nd Place', coins: 12 },
      { id: 'sp-3rd', name: 'Group / Kulliya (e.g. Qawalli) - 3rd Place', coins: 7 },
    ],
  },
  {
    id: 'arts-fest-sibaq',
    categoryName: 'ARTS FEST & SIBAQ, 2026',
    activities: [
      { id: 'arts-1st-a', name: 'First (A Grade)', coins: 10 },
      { id: 'arts-2nd-a', name: 'Second (A Grade)', coins: 8 },
      { id: 'arts-3rd-a', name: 'Third (A Grade)', coins: 6 },
      { id: 'arts-1st-b', name: 'First (B Grade)', coins: 8 },
      { id: 'arts-2nd-b', name: 'Second (B Grade)', coins: 6 },
      { id: 'arts-3rd-b', name: 'Third (B Grade)', coins: 4 },
      { id: 'arts-1st-gen', name: 'First (- Grade)', coins: 5 },
      { id: 'arts-2nd-gen', name: 'Second (- Grade)', coins: 3 },
      { id: 'arts-3rd-gen', name: 'Third (- Grade)', coins: 1 },
    ],
  },
  {
    id: 'more-achievement',
    categoryName: 'MORE ACHIEVEMENT, 2026',
    activities: [
      { id: 'ach-nat-1st', name: 'National & International (1st Place)', coins: 20 },
      { id: 'ach-nat-2nd', name: 'National & International (2nd Place)', coins: 15 },
      { id: 'ach-nat-3rd', name: 'National & International (3rd Place)', coins: 10 },
      { id: 'ach-state-1st', name: 'State & District Level (1st Place)', coins: 15 },
      { id: 'ach-state-2nd', name: 'State & District Level (2nd Place)', coins: 10 },
      { id: 'ach-state-3rd', name: 'State & District Level (3rd Place)', coins: 5 },
      { id: 'ach-campus-1st', name: 'Class & Campus (1st Place)', coins: 12 },
      { id: 'ach-campus-2nd', name: 'Class & Campus (2nd Place)', coins: 7 },
      { id: 'ach-campus-3rd', name: 'Class & Campus (3rd Place)', coins: 5 },
    ],
  },
  {
    id: 'service',
    categoryName: 'SERVICE',
    activities: [
      { id: 'serv-admin', name: 'Service (As per work performed)', coins: 'custom', notes: 'Coin amount determined by admin' },
    ],
  },
];

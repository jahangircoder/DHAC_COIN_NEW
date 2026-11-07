import blueprint from '../../firebase-blueprint.json';

const studentProps = blueprint.entities.StudentRecord.properties;
const mentorProps = blueprint.entities.MentorRecord.properties;
const claimProps = blueprint.entities.CoinClaimDoc.properties;
const txProps = blueprint.entities.CoinTransactionDoc.properties;
const userProps = blueprint.entities.UserProfile.properties;
const unionProps = blueprint.entities.UnionDoc.properties;
const categoryProps = blueprint.entities.CoinCategoryDoc.properties;

export const VALIDATION_LIMITS = {
  idPattern: new RegExp(studentProps.id.pattern!),
  student: {
    idMax: studentProps.id.maxLength!,
    officialIdMax: studentProps.officialId.maxLength!,
    adNoMax: studentProps.adNo.maxLength!,
    nameMax: studentProps.name.maxLength!,
    classNameMax: studentProps.className.maxLength!,
    batchNameMax: studentProps.batchName.maxLength!,
    mentorNameMax: studentProps.mentorName.maxLength!,
    mentorGroupRankMax: studentProps.mentorGroupRank.maxLength!,
    classRankMax: studentProps.classRank.maxLength!,
    campusRankMax: studentProps.campusRank.maxLength!,
    notesMax: studentProps.notes.maxLength!,
    photoUrlMax: studentProps.photoUrl.maxLength!,
    emailMax: studentProps.studentEmail.maxLength!,
    adFlags: studentProps.adFlag.enum as readonly string[],
    coinStatuses: studentProps.coinStatus.enum as readonly string[],
    rankStatuses: studentProps.rankStatus.enum as readonly string[],
    tiers: studentProps.tier.enum as readonly string[],
  },
  mentor: {
    idMax: mentorProps.id.maxLength!,
    serialNoMax: mentorProps.serialNo.maxLength!,
    teacherIdMax: mentorProps.teacherId.maxLength!,
    nameMax: mentorProps.name.maxLength!,
    usernameMax: mentorProps.username.maxLength!,
    emailMax: mentorProps.assignedEmail.maxLength!,
  },
  claim: {
    idMax: claimProps.id.maxLength!,
    categoryMax: claimProps.category.maxLength!,
    activityNameMax: claimProps.activityName.maxLength!,
    proofNotesMax: claimProps.proofNotes.maxLength!,
    submittedAtMax: claimProps.submittedAt.maxLength!,
    reviewedByMax: claimProps.reviewedBy.maxLength!,
    reviewedAtMax: claimProps.reviewedAt.maxLength!,
    rejectionReasonMax: claimProps.rejectionReason.maxLength!,
    auditDocIdMax: claimProps.auditDocId.maxLength!,
    minCoins: 1,
    maxCoins: 500,
  },
  tx: {
    idMax: txProps.id.maxLength!,
    timestampMax: txProps.timestamp.maxLength!,
    awardedByMax: txProps.awardedBy.maxLength!,
    notesMax: txProps.notes.maxLength!,
    auditDocIdMax: txProps.auditDocId.maxLength!,
    minCoins: 1,
    maxCoins: 500,
  },
  user: {
    uidMax: userProps.uid.maxLength!,
    displayNameMax: userProps.displayName.maxLength!,
    usernameMax: userProps.username.maxLength!,
    photoUrlMax: userProps.photoUrl.maxLength!,
    roles: userProps.role.enum as readonly string[],
  },
  union: {
    idMax: unionProps.id.maxLength!,
    unionNameMax: unionProps.unionName.maxLength!,
    maxClasses: 12,
  },
  category: {
    idMax: categoryProps.id.maxLength!,
    categoryNameMax: categoryProps.categoryName.maxLength!,
    descriptionMax: categoryProps.description.maxLength!,
    maxActivities: 50,
  },
  queue: {
    maxItems: 100,
  },
  audit: {
    idMax: blueprint.entities.AuditLogDoc.properties.id.maxLength!,
    actionMax: blueprint.entities.AuditLogDoc.properties.action.maxLength!,
    actorNameMax: blueprint.entities.AuditLogDoc.properties.actorName.maxLength!,
    targetPathMax: blueprint.entities.AuditLogDoc.properties.targetPath.maxLength!,
    summaryMax: blueprint.entities.AuditLogDoc.properties.summary.maxLength!,
  },
} as const;

export function isValidFirestoreId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && id.length <= 128 && VALIDATION_LIMITS.idPattern.test(id);
}

export function sanitizeIdSegment(raw: string, fallbackPrefix = 'DOC'): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!cleaned) {
    return `${fallbackPrefix}-${Date.now()}`;
  }
  return cleaned.slice(0, 64);
}

export function boundString(value: unknown, maxLen: number, fallback = ''): string {
  const str = typeof value === 'string' ? value : value == null ? fallback : String(value);
  return str.slice(0, maxLen);
}

export function boundNonEmptyString(value: unknown, maxLen: number, fallback: string): string {
  const str = typeof value === 'string' ? value.trim() : '';
  const resolved = str.length > 0 ? str : fallback;
  return resolved.slice(0, maxLen);
}

export function boundOptionalString(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

export function boundInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === 'number' ? Math.round(value) : parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function computeTierForCoins(coins: number): 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Zero' {
  if (coins >= 60) return 'Diamond';
  if (coins >= 30) return 'Gold';
  if (coins >= 15) return 'Silver';
  if (coins > 0) return 'Bronze';
  return 'Zero';
}

export async function compressImageToCompactDataUrl(
  rawDataUrl: string,
  maxCharLength = VALIDATION_LIMITS.student.photoUrlMax
): Promise<string> {
  if (!rawDataUrl || !rawDataUrl.startsWith('data:image/')) {
    return boundString(rawDataUrl, maxCharLength);
  }
  if (rawDataUrl.length <= Math.min(20000, maxCharLength)) {
    return rawDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const targetSize = 160;
        const scale = Math.min(targetSize / img.width, targetSize / img.height, 1);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl.slice(0, maxCharLength));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.78);
        resolve(compressed.length <= maxCharLength ? compressed : compressed.slice(0, maxCharLength));
      } catch {
        resolve(rawDataUrl.slice(0, maxCharLength));
      }
    };
    img.onerror = () => resolve(rawDataUrl.slice(0, maxCharLength));
    img.src = rawDataUrl;
  });
}

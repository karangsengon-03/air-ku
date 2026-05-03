/**
 * log.ts — Tipe data activity log
 */
import type { FirestoreTs } from "./common";

export type { FirestoreTs, FirestoreTimestampLike } from "./common";

export interface ActivityLog {
  id?: string;
  action: string;
  detail: string;
  /** Timestamp Firestore — bisa berupa Timestamp object atau plain object dengan `seconds` */
  ts: FirestoreTs;
  user: string;
  role: string;
}

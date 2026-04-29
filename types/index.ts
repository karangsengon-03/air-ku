/**
 * types/index.ts — Barrel re-export untuk backward compatibility
 *
 * Semua import lama "@/types" tetap berfungsi tanpa perubahan.
 * Untuk import baru, preferensikan import langsung dari domain file:
 *   import type { Member } from '@/types/member'
 *   import type { Tagihan } from '@/types/tagihan'
 */

export type { Role, MemberStatus, TagihanStatus, ModeTunggakan } from './common';
export type { BlokTarif, AppSettings, HargaHistory }             from './settings';
export {      defaultSettings }                                   from './settings';
export type { Member }                                            from './member';
export type { BlokSnapshot, Tagihan }                            from './tagihan';
export type { Operasional }                                       from './operasional';
export type { ActivityLog }                                       from './log';
export type { UserRole }                                          from './auth';

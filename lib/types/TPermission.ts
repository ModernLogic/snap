//
//  TPermission.ts
//  Modern Logic
//
//  Created by Modern Logic on 2025-10-09
//  Copyright © 2025 Modern Logic, LLC. All Rights Reserved.

export const PermissionKey = {
  Location: 'location'
} as const

export type Permission = typeof PermissionKey[keyof typeof PermissionKey]

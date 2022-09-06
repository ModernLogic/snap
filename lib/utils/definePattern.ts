//
//  definePattern.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-06
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

export function definePattern (storybookPage?: string): { pattern: null | string, continueForward: boolean } {
  if (storybookPage === undefined || storybookPage.length <= 6) {
    return {
      pattern: null,
      continueForward: true
    }
  }
  const continueForward = storybookPage.slice(-1) === '+'
  if (continueForward) {
    return {
      pattern: storybookPage.slice(6, -1),
      continueForward: true
    }
  }
  return {
    pattern: storybookPage?.slice(6),
    continueForward: false
  }
}

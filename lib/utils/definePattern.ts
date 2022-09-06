
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

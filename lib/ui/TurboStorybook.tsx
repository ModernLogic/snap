//
//  TurboStorybook.tsx
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-06
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import React from 'react'
import { TurboStorybookContainer } from '../hooks'
import { TStory, TStorybookProps } from '../types'
import { TurboStorybookInner } from './TurboStorybookInner'

export const TurboStorybook: React.FC<TStorybookProps & { Stories: TStory[] }> = (props) => {
  return (
    <TurboStorybookContainer.Provider initialState={props}>
      <TurboStorybookInner />
    </TurboStorybookContainer.Provider>
  )
}

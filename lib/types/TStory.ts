//
//  TStory.tx
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-06
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.
import type { StackNavigationOptions } from '@react-navigation/stack'

export interface TSubStory {
  name: string
  component: React.FC
  screenOptions: {
    initialParams?: Record<string, any>
    options?: StackNavigationOptions
  }
  skipSnapshotTest?: boolean
}

export interface TStory {
  name: string
  substories: TSubStory[]
}

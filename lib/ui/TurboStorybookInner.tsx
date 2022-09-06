//
//  TurboStorybookInner.tsx
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-06
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { StatusBar, StyleSheet, Text, View } from 'react-native'
import { TurboStorybookContainer } from '../hooks'
import { TSubStory } from '../types'
import { StorybookScreen } from './StorybookScreen'

export const Stack = createStackNavigator()

export const TurboStorybookInner: React.FC = () => {
  const { pages } = TurboStorybookContainer.useContainer()
  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar hidden />

      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
        {pages.map(({ story, substory }, index) => {
          return (
            <Stack.Screen key={`${index}`} name={`${story.name}_${substory.name}`} {...getProps(substory, story.name)}>
              {(_props) => <StorybookScreen story={story} substory={substory} />}
            </Stack.Screen>
          )
        })}
        <Stack.Screen name={'XXX-END-XXX'}>
          {(_params) => (
            <View style={StyleSheet.absoluteFill}>
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { alignContent: 'center', alignItems: 'center', justifyContent: 'center' }
                ]}
                accessibilityLabel={`XXX-${pages.length}-XXX`}
              >
                <Text>XXX-END-XXX</Text>
              </View>
            </View>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </View>
  )
  function getProps (substory: TSubStory, storyName: string): TSubStory['screenOptions'] {
    const withTitle = ((substory.screenOptions?.options?.header) != null) ? {} : { headerTitle: `${storyName} ${substory.name}` }

    return {
      ...substory.screenOptions,
      options: { ...substory.screenOptions.options, ...withTitle }
    }
  }
}


import React from 'react'
import { StyleSheet, View } from 'react-native'
import { TurboStorybookContainer } from '../hooks'
import { TStory, TSubStory } from '../types'
import { ErrorBoundary } from './ErrorBoundary'

export const StorybookScreen: React.FC<{
  story: TStory
  substory: TSubStory
}> = ({ story, substory }) => {
  const C = substory.component
  const { doSnapshot } = TurboStorybookContainer.useContainer()
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { alignContent: 'stretch', alignItems: 'stretch', justifyContent: 'space-around' }
      ]}
      onLayout={doSnapshot}
    >
      <ErrorBoundary screenName={`${story.name}_${substory.name}`}>
        <C />
      </ErrorBoundary>
    </View>
  )
}

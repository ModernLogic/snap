//
//  ErrorBoundary.tsx
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-06
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import React from 'react'
import { Text, View } from 'react-native'

export class ErrorBoundary extends React.Component<{ screenName: string, children?: any }> {
  state = { error: false }

  static getDerivedStateFromError (): { error: boolean } {
    return { error: true }
  }

  componentDidCatch (error: any): void {
    console.log('component errored', error?.message)
  }

  render (): React.ReactNode {
    if (!this.state.error) {
      return this.props.children
    }
    return (
      <View>
        <Text>Error: {this.props.screenName}</Text>
      </View>
    )
  }
}

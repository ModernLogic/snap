import { CommonActions, useNavigation } from '@react-navigation/native'
import { useCallback, useMemo, useState } from 'react'

import { LogBox } from 'react-native'
import { TStory, TStorybookProps, TSubStory } from '../types'
import { definePattern } from '../utils'

export interface TUseTurboStorybookResult {
  pages: Array<{ story: TStory, substory: TSubStory }>
  doSnapshot: () => void
}
export function useTurboStorybook (props?: TStorybookProps & { Stories: TStory[] }): TUseTurboStorybookResult {
  const { storybookPage, snapPort, Stories } = props ?? { snapPort: '8082' }
  LogBox.ignoreAllLogs()
  const { pattern, continueForward } = definePattern(storybookPage)
  let isTakingSnapshot = false

  const pages = useMemo((): Array<{ story: TStory, substory: TSubStory }> => {
    const flattened = (Stories ?? [])
      .flatMap((story) =>
        story.substories.map((substory) => ({
          story,
          substory
        }))
      )
      .filter((info) => !(info.substory.skipSnapshotTest ?? false))
    if (pattern != null) {
      console.log('Filtering to story', pattern)
      if (!continueForward) {
        return flattened.filter((story) => story.substory.name === pattern)
      } else {
        return flattened.reduce(
          (result, story) => {
            if (result.found || story.substory.name === pattern) {
              return {
                stories: [...result.stories, story],
                found: true
              }
            }
            return result
          },
          {
            stories: [] as typeof flattened,
            found: false
          }
        ).stories
      }
    }
    console.log(`There are ${flattened.length} snapshot tests`)
    return flattened
  }, [pattern])
  const { dispatch } = useNavigation()
  const [pageNumber, setPageNumberInternal] = useState(0)
  const setPageNumber = useCallback((pageNumber: number) => {
    setPageNumberInternal(pageNumber)
    const page = pages[pageNumber]
    if (page !== undefined) {
      const { story, substory } = page
      const nextPageName = `${story.name}_${substory.name}`
      console.log(`Next page #${pageNumber}: ${nextPageName}`)
      const action = CommonActions.reset({
        index: 0,
        routes: [{ name: nextPageName as any }]
      })
      dispatch(action)
    } else {
      const action = CommonActions.reset({
        index: 0,
        routes: [{ name: 'XXX-END-XXX' as any }]
      })
      dispatch(action)
    }
  }, [])

  const doSnapshot = useCallback(() => {
    const doIt = async (): Promise<undefined | 'locked'> => {
      if (isTakingSnapshot) {
        return 'locked'
      }
      isTakingSnapshot = true
      try {
        const page = pages[pageNumber]
        if (page === undefined || snapPort === undefined) {
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
        const { story, substory } = page
        const nextPageName = `${story.name}_${substory.name}`

        const nextPage = pageNumber + 1
        let tries = 1
        while (true) {
          const result = await fetch(`http://localhost:${snapPort}`, {
            method: 'POST',
            body: JSON.stringify({
              command: 'snapshot',
              headers: {
                'Content-Type': 'application/json'
              // 'Content-Type': 'application/x-www-form-urlencoded',
              },
              screenName: nextPageName
            })
          })
          const json = await result.json()
          if ((json.success === true) || tries > 5) {
            await fetch(`http://localhost:${snapPort}`, {
              method: 'POST',
              body: JSON.stringify({
                command: 'testResult',
                headers: {
                  'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
                },
                pass: json.success
              })
            })

            break
          }
          console.log(`Retrying diff after ${tries * 100} ms...`)
          const time = tries * 100
          await new Promise((resolve) => setTimeout(resolve, time))
          tries = tries + 1
        }

        if (nextPage >= pages.length) {
          await fetch(`http://localhost:${snapPort}`, {
            method: 'POST',
            body: JSON.stringify({
              command: 'quit',
              headers: {
                'Content-Type': 'application/json'
              // 'Content-Type': 'application/x-www-form-urlencoded',
              },
              args: []
            })
          })
        } else {
          setPageNumber(pageNumber + 1)
        }
      } catch (e) {
        if (typeof e === 'object' && e !== null && e instanceof Error) {
          console.warn('Failed to do snapshot because', e.message)
        } else {
          console.warn('FAILED: UNKNOWN REASON')
        }
      }
    }
    doIt()
      .catch(e => { console.warn('Error running snapshots') })
      .then((result) => {
        if (result !== 'locked') {
          isTakingSnapshot = false
        }
      })
      .catch((e) => console.error('THIS IS IMPOSSIBLE'))
  }, [pageNumber, pages])

  return {
    pages,
    doSnapshot
  }
}

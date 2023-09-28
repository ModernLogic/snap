[![Typescript](https://github.com/ModernLogic/snap/actions/workflows/typescript.yml/badge.svg)](https://github.com/ModernLogic/snap/actions/workflows/typescript.yml)

# snap

A simple cli that facilitates rapid snapshot testing

https://github.com/ModernLogic/snap

move runsnaps.sh into the script.

## In Xcode

Copy logic in `AppDelegate` around snapPort

```javascript
const char * snapPortC = getenv("snapPort");
if (snapPortC) {
    initialProperties[@"snapPort"] = [NSString stringWithUTF8String: snapPortC];
}
```

## In React Native App

Create `.snaprc.json` file in the root directory changing the `bundleIdentifier` value

```javascript
{
    "ios": {

        "bundleIdentifier": "com.soundstrue.soundstrueone",
        "simulator": "iPhone 13",
        "appName": "Wunder.app"
    }
}
```

Copy the file `snap_0.0.4.tgz` into `vendor/@modernlogic` directory.

Add `"@modernlogic/snap": "./vendor/@modernlogic/snap_0.0.4.tgz"` in `package.json` file

Run

```sh
yarn install
```

Add in the `.gitignore` file

```javascript
.snap/snapshots/diff
.snap/snapshots/latest
```

Modify `src/ui/App.tsx` file to add the snapPort value

```javascript
<StorybookUIRoot storybookPage={p.storybookPage} snapPort={p.snapPort} />
```

The new library already includes `TStorybookProps`, `TStory` and `TSubStory`, so you will need to use them in `src/storybook/stories/index.tsx` and `src/storybook/index.tsx` files.

In addition, open `src/storybook/index.tsx`, look for `StorybookAddRedux` function and add before to the return statement.

```javascript
if (storybookPage?.match(/^turbo/)) {
    return (
        <Provider store={store}>
        <TurboStorybook storybookPage={storybookPage} snapPort={snapPort} Stories={Stories} />
        </Provider>
    )
}
```

Modify `.gitattributes` to ensure new files added in `.snap` are added via `lfs`

```javascript
.snap/snapshots/reference/ios/* filter=lfs diff=lfs merge=lfs -text
```

Modify `metro.config.js` either like this

```javascript
  resolver.blockList = [
    ...(Array.isArray(resolver.blockList) ? resolver.blockList : resolver.blockList ? [resolver.blockList] : []),
    /^[.]snap[/]/,
  ];
```

or like this:

```javascript
module.exports = {
  resolver: {
    ...defaultResolver,
    ...,
    blockList: [/^[.]snap[/]/],
  }
}
```

## Generating snaps

Run

```sh
yarn snap test -u
```

This should write results in to `.snap/` directory

## Running tests

To test

```sh
yarn snap test
```

This should run against existing match files

Copy CI script, especially the test area

```javascript
      - name: run tests
        run: |
          yarn snap citest
        env:
          NPM_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: store test results as artifact
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: xcuitest-results
          path: |
            .snap/snapshots/diff/
            .snap/snapshots/latest/
          if-no-files-found: ignore
```

## Debugging

For debugging from xcode, if necessary

To test: add these to the Scheme Environment Variables

```
snapPort=8881
storybookPage=turbo
```

## Tips

- If you have more than one simulator in Xcode with the same name as the simulator specified in your `.snaprc.json`, snap will only connect to the simulator with the most recent iOS version. For example, if you have two “iPhone 13”, one iOS 16.1 and one iOS 15.5, snap will only connect to iOS 16.1. Delete any simulators with a newer iOS version to fix this issue.

# Developing

Here's Andy's quick and dirty guide to developing snap.

- Code up some new changes in this repo
- run `yarn tar` to generate a temporary .tgz file called `package.tgz` in this directory
- Clear the yarn cache `rm ~/.yarn/berry/cache/@modernlogic-*`
- From the iOS app directory:
  - Copy the package.tgz into your project, e.g. `cp ../@modernlogic/snap/package.tgz ./vendor/@modernlogic/snap_0.0.9.tgz`
  - remove, and then reinstall the package: `yarn remove @modernlogic/snap` and then `yarn add ./vendor/@modernlogic/snap_0.0.9.tgz`
- now you can run `yarn snap test` or other commands and see if it works better with your new changes.
- Be sure to delete package.tgz -- it doesn't need to be added to source control.

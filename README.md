# snap

A simple cli that facilitates rapid snapshot testing

https://github.com/ModernLogic/snap

move runsnaps.sh  into the script.

## In Xcode

Copy logic in `AppDelegate` around snapPort

```javascript
const char * snapPortC = getenv("snapPort");
if (snapPortC) {
    initialProperties[@"snapPort"] = [NSString stringWithUTF8String: snapPortC];
}
```

## In React Native App

Create `scripts/run-snaps.sh` file in the root directory.

```javascript
#!/bin/zsh

echo "RUNNING TESTS"

DEVICE="iPhone 13"
BUNDLE_ID="com.soundstrue.soundstrueone" // Very important to change this information,
APP_NAME="Sounds True"                   // and also this.

echo "Terminating currently running process (if any)"
(xcrun simctl terminate "$DEVICE" "$BUNDLE_ID" || echo "App wasn't running")
sleep 3

echo "Shutting down simulator '$DEVICE' (if booted)"
(xcrun simctl shutdown "$DEVICE" || echo "Simulator wasn't booted")

# wait for simulator to shutdown
# fixme it'd be nice to know how long this really takes
sleep 3

echo "Booting $DEVICE"
xcrun simctl boot "$DEVICE"

# wait for simulator to boot
sleep 6

echo "Uninstall app..."
xcrun simctl uninstall "$DEVICE" "$BUNDLE_ID" || echo "Could not uninstall"

# wait for simulator to uninstall app
sleep 6

echo "Installing app..."
xcrun simctl install "$DEVICE" "ios/output/Build/Products/Debug-iphonesimulator/$APP_NAME"

# wait for app to install
sleep 3

export RCT_METRO_PORT=`python3 -c 'import socket; s=socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()'`

yarn start --port $RCT_METRO_PORT &!

METRO_PID=$!

# let metro get comfortable...
sleep 15

yarn snap test

RESULT=$?

xcrun simctl io "$DEVICE" screenshot .snap/snapshots/latest/END.png

echo "Stopping metro"
kill $METRO_PID
echo $?

sleep 3

exit $RESULT
```

Create `.snaprc.json` file in the root directory changing the `bundleIdentifier` value
```javascript
{
    "ios": {

        "bundleIdentifier": "com.soundstrue.soundstrueone",
        "simulator": "iPhone 13"
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
          ./scripts/run-snaps.sh

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

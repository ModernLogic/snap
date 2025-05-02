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

        "bundleIdentifier": "com.example.example",
        "simulator": "iPhone 13",
        "appName": "Example.app"
    }
}
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

## Android

Create an xml file in `android/app/src/main/res/xml/network_security_config.xml`

```
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

and reference it in the ApplicationManifest.xml:

```
<application
    android:networkSecurityConfig="@xml/network_security_config"
>
```

also in that file add an intent to the main activity:

```
  <intent-filter>
    <action android:name="io.modernlogic.snap.test" />
    <category android:name="io.modernlogic.snap" />
    <data android:mimeType="text/plain" />
  </intent-filter>
```

To the MainActivity kotlin file, add a dynamic property to the class:

```
  val isMoLoSnap: Boolean
    get() {
      val intentAction = intent.action
      return "io.modernlogic.snap" == intentAction
    }
```

if a custom animation for splash screen is installed, make it conditional, e.g. in onCreate:

```
    if (!isMoLoSnap) {
      SplashScreenModule.show(this)
    }
```

Implement createReactActivityDelegate like so:

```
override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle {
          val initialProps = Bundle()
          if (isMoLoSnap) {
            intent.getStringExtra("snapPort")?.let { initialProps.putString("snapPort", it) }
            intent.getStringExtra("storybookPage")?.let { initialProps.putString("storybookPage", it) }
          }
          return initialProps
        }
      }
    )
  }
```

## Generating snaps

Run

```sh
npm run snap test -u
```

This should write results in to `.snap/` directory

## Running tests

To test

```sh
npm run snap test
```

This should run against existing match files

Copy CI script, especially the test area

```javascript
      - name: run tests
        run: |
          npm run snap citest
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

- If you have more than one simulator in Xcode with the same name as the simulator specified in your `.snaprc.json`, snap will only connect to the simulator with the most recent iOS version. For example, if you have two "iPhone 13", one iOS 16.1 and one iOS 15.5, snap will only connect to iOS 16.1. Delete any simulators with a newer iOS version to fix this issue.

# Developing

Here's Andy's quick and dirty guide to developing snap.

- Code up some new changes in this repo
- run `npm run tar` to generate a temporary .tgz file called `package.tgz` in this directory
- From the iOS app directory:
  - Copy the package.tgz into your project, e.g. `cp ../@modernlogic/snap/package.tgz ./vendor/@modernlogic/snap_0.0.9.tgz`
  - remove, and then reinstall the package: `npm remove @modernlogic/snap` and then `npm add ./vendor/@modernlogic/snap_0.0.9.tgz`
- now you can run `npm snap test` or other commands and see if it works better with your new changes.
- Be sure to delete package.tgz -- it doesn't need to be added to source control.

_An alternate_

You can also just do

```
npm run dev:try ../../<project_dir_name>
```

To do the same sequence of steps.

# Releasing

In order to release a new version:

1. Make sure all your changes are committed and pushed
2. Clean the `dist` folder via `rm -rf dist`
3. Prepare via `npm run prepare` this invokes builder bob.
4. Run `npm run release`. This will:
   - Bump the version number based on your commits (using conventional commits)
   - Create a git tag
   - Push the changes to GitHub
   - Create a GitHub release
   - Publish to npm

The release process uses conventional commits to determine the version bump:

- `feat:` commits trigger a minor version bump
- `fix:` commits trigger a patch version bump
- `BREAKING CHANGE:` in commit messages trigger a major version bump

Make sure your commit messages follow the conventional commit format for proper version management.

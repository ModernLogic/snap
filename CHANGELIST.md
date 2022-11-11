# v0.0.12

The simulator status bar is now set to an override so it always looks the same.

Clean up now kills the app so that it's not left in a strange "zombie" state when you want to return to developing your app.

# v0.0.11

Kill off all of metro node child processes when exiting.

# v0.0.10

Introducing new command

```
yarn citest
```

Now github actions can run snap tests with all the extra steps (installing in simulator, relaunching simulator, etc...) without a helper script.

# v0.0.8

Running `snap` no longer turns of 'hot-reload'. However, it is now required that react-native apps add

```
    blockList: [/^[.]snap[/]/],
```

to the `resolver` section of the `metro.config.js` exports. Otherwise hot-reload will be triggered by the snapshotting and will greatly slow down runtime, and possibly result in false errors due to the blue hot-reload banner.

- Old diff files will be cleared away when starting a new run. Similarly, tests that initially fail but after a delay pass will no longer leave the diff file behind.

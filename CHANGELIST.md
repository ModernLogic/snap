# v0.0.8

Running `snap` no longer turns of 'hot-reload'. However, it is now required that react-native apps add

```
    blockList: [/^[.]snap[/]/],
```

to the `resolver` section of the `metro.config.js` exports. Otherwise hot-reload will be triggered by the snapshotting and will greatly slow down runtime, and possibly result in false errors due to the blue hot-reload banner.

- Old diff files will be cleared away when starting a new run. Similarly, tests that initially fail but after a delay pass will no longer leave the diff file behind.

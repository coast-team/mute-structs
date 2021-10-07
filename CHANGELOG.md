# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.4](https://github.com/coast-team/mute-structs/compare/v2.0.3...v2.0.4) (2021-10-07)

### [2.0.3](https://github.com/coast-team/mute-structs/compare/v2.0.2...v2.0.3) (2021-10-07)


### Bug Fixes

* **reverserenameid:** handle missing cases when lastId < newLastId ([34f8cea](https://github.com/coast-team/mute-structs/commit/34f8cea167cc7a20d04499abfded64ade1ce303e))

### [2.0.2](https://github.com/coast-team/mute-structs/compare/v2.0.1...v2.0.2) (2020-08-17)

### [2.0.1](https://github.com/coast-team/mute-structs/compare/v2.0.0...v2.0.1) (2020-08-11)


### Features

* **epochstore:** add compareEpochFullIds() ([1d2de9e](https://github.com/coast-team/mute-structs/commit/1d2de9e1bdf9aa435caecacaf4269b08d3100ae0))


### Bug Fixes

* **renamablereplicablelist:** fix priority order between epochs ([d59c8d1](https://github.com/coast-team/mute-structs/commit/d59c8d12622e38c98d1e6aeea39343112f59f526))

## [2.0.0](https://github.com/coast-team/mute-structs/compare/v2.0.0-11...v2.0.0) (2020-07-31)


### Bug Fixes

* **logootsropes:** merge fix on append/prepend from master branch ([fee69ff](https://github.com/coast-team/mute-structs/commit/fee69ff6728ca64b546825f1242c82141e5831f6))

## [1.1.0](https://github.com/coast-team/mute-structs/compare/v2.0.0-1...v1.1.0) (2019-03-04)


### Features

* **ropesnodes:** add max getter to retrieve max id from a subtree ([ee779a7](https://github.com/coast-team/mute-structs/commit/ee779a7d3662cbe2952381c7b2a7fee9ce1ac52b))
* **ropesnodes:** add min getter to retrieve min id from a subtree ([ee2da24](https://github.com/coast-team/mute-structs/commit/ee2da24fccdc80a8c4d447ca4412627f8254fd94))


### Bug Fixes

* **logootsropes:** fix checks before appending/prepending ([91f24b5](https://github.com/coast-team/mute-structs/commit/91f24b52a2a5a7fb695b92baf087cd5e4b8ce8b9))

## [2.0.0-11](https://github.com/coast-team/mute-structs/compare/v2.0.0-10...v2.0.0-11) (2020-07-10)


### Bug Fixes

* **idfactory:** edit createBetweenPosition() to prevent overflow ([a328b00](https://github.com/coast-team/mute-structs/commit/a328b0081402ae1a02c90861e2cc4d68a497c105))

## [2.0.0-10](https://github.com/coast-team/mute-structs/compare/v2.0.0-9...v2.0.0-10) (2020-07-10)


### Bug Fixes

* **idfactory:** fix createBetweenPosition() to pass added test case ([439ad1c](https://github.com/coast-team/mute-structs/commit/439ad1ca773cec1008c6d366b445c059ceb65863))

## [2.0.0-9](https://github.com/coast-team/mute-structs/compare/v2.0.0-8...v2.0.0-9) (2020-07-09)


### Bug Fixes

* **renamable-list:** use renameId() instead of renameIdInterval() ([22ba09a](https://github.com/coast-team/mute-structs/commit/22ba09ace073d2d9e4244cb7dc462a42c169f1f4))

## [2.0.0-8](https://github.com/coast-team/mute-structs/compare/v2.0.0-7...v2.0.0-8) (2020-06-16)


### Features

* **renameid:** handle properly some ids causally inserted to rename op ([3f019a3](https://github.com/coast-team/mute-structs/commit/3f019a3b5bcceb0576c22bb6d7566edb00f34ed1))
* **renameid:** handle properly some ids causally inserted to rename op ([d59c1d5](https://github.com/coast-team/mute-structs/commit/d59c1d58f1ff58933a8e7e33f271a2a04e746a0b))
* **renameid:** handle properly some ids causally inserted to rename op ([141a0e0](https://github.com/coast-team/mute-structs/commit/141a0e0e7027fca4dc3ee80551bb289e04c5f780))
* **renameid:** handle properly some ids causally inserted to rename op ([c1058cc](https://github.com/coast-team/mute-structs/commit/c1058ccd60618e833ffe449227c1899aab53b2bc))


### Bug Fixes

* **idfactory:** fix createBetweenPosition() ([5b0eaa0](https://github.com/coast-team/mute-structs/commit/5b0eaa0938239e689e589753e9bea2ea3c11b20f))
* **renamingmap:** edit createBetweenPosition() to fix failing test case ([a8ca694](https://github.com/coast-team/mute-structs/commit/a8ca6943dd2362a65cfb7449611f4cf40afe0293))
* **renamingmap:** fix reverseRenameId() ([3fe88fe](https://github.com/coast-team/mute-structs/commit/3fe88fe42ea3608b4fcc43ada6a250c9916d475a))
* **test:** fix initial settings of a test case ([2a18504](https://github.com/coast-team/mute-structs/commit/2a1850429870af90863554513463d0ef82754b47))

## [2.0.0-7](https://github.com/coast-team/mute-structs/compare/v2.0.0-6...v2.0.0-7) (2019-11-21)

<a name="2.0.0-6"></a>
# [2.0.0-6](https://github.com/coast-team/mute-structs/compare/v2.0.0-5...v2.0.0-6) (2019-11-21)



<a name="2.0.0-5"></a>
# [2.0.0-5](https://github.com/coast-team/mute-structs/compare/v2.0.0-4...v2.0.0-5) (2019-11-21)


### Performance Improvements

* **flat:** use flatMap(...) instead of map(...) + reduce(flatten) ([87b8108](https://github.com/coast-team/mute-structs/commit/87b8108))



<a name="2.0.0-1"></a>
# [2.0.0-1](https://github.com/coast-team/mute-structs/compare/v2.0.0-0...v2.0.0-1) (2019-01-28)


### Code Refactoring

* **renamablereplicablelist:** impose usage of a factory ([04ab821](https://github.com/coast-team/mute-structs/commit/04ab821))


### Features

* export several new types ([593c96e](https://github.com/coast-team/mute-structs/commit/593c96e))
* **data-validation:** add isArrayFromMap() ([50b5345](https://github.com/coast-team/mute-structs/commit/50b5345))
* **epoch:** add fromPlain() ([1afa238](https://github.com/coast-team/mute-structs/commit/1afa238))
* **epochid:** add fromPlain() ([f038ff9](https://github.com/coast-team/mute-structs/commit/f038ff9))
* **epochstore:** add fromPlain() ([00aa21c](https://github.com/coast-team/mute-structs/commit/00aa21c))
* **logootsropes:** change signature of fromPlain() ([391becf](https://github.com/coast-team/mute-structs/commit/391becf))
* **renamablereplicablelist:** add fromPlain() ([ce47db0](https://github.com/coast-team/mute-structs/commit/ce47db0))
* **renamingmap:** add fromPlain() ([4b7b961](https://github.com/coast-team/mute-structs/commit/4b7b961))
* **renamingmapstore:** add fromPlain() ([b3ca2df](https://github.com/coast-team/mute-structs/commit/b3ca2df))


### BREAKING CHANGES

* **renamablereplicablelist:** the constructor is now private
* **logootsropes:** remove parameters replicaNumber and clock



<a name="2.0.0-0"></a>
# [2.0.0-0](https://github.com/coast-team/mute-structs/compare/v1.0.0...v2.0.0-0) (2019-01-22)


### Bug Fixes

* **epoch:** Fix assertion on parentId ([d5fa2d0](https://github.com/coast-team/mute-structs/commit/d5fa2d0))
* **epoch:** Remove import of SafeAny ([ae59b6b](https://github.com/coast-team/mute-structs/commit/ae59b6b))
* **epochstore:** Use equals() instead of === to compare epochs ([3099e11](https://github.com/coast-team/mute-structs/commit/3099e11))
* **extendedrenamingmap:** Support new cases and add corresponding tests ([3025e06](https://github.com/coast-team/mute-structs/commit/3025e06))
* **helpers:** Fix findPredecessor() ([14bd97d](https://github.com/coast-team/mute-structs/commit/14bd97d))
* **renamingmap:** Fix reverseRenameId() in the scenario highlighted in 461e0eb ([fa859b7](https://github.com/coast-team/mute-structs/commit/fa859b7))
* **renamingmap:** Fix reverseRenameId() of concurrently inserted id such as newFirstId < id < firstId ([c734de0](https://github.com/coast-team/mute-structs/commit/c734de0))


### Features

* **epoch:** Add equals() ([cd9f8c6](https://github.com/coast-team/mute-structs/commit/cd9f8c6))
* **epochstore:** Add getEpochPath() to retrieve the full path of an epoch ([e722283](https://github.com/coast-team/mute-structs/commit/e722283))
* **epochstore:** Add getPathBetweenEpochs() to retrieve the path between two given epochs ([e74c589](https://github.com/coast-team/mute-structs/commit/e74c589))
* **extendedrenamingmap:** Handle additional tricky cases in renameId() and reverseRenameId() ([1a7b53d](https://github.com/coast-team/mute-structs/commit/1a7b53d))
* **extendedrenamingmap:** Implement reverseRenameId() ([20888cc](https://github.com/coast-team/mute-structs/commit/20888cc))
* **helpers:** Add findPredecessor() ([445ead5](https://github.com/coast-team/mute-structs/commit/445ead5))
* **helpers:** Add flatten() ([ef11bad](https://github.com/coast-team/mute-structs/commit/ef11bad))
* **helpers:** Add isSorted() ([04f4e94](https://github.com/coast-team/mute-structs/commit/04f4e94))
* **identifier:** Add concat() ([12bb1e0](https://github.com/coast-team/mute-structs/commit/12bb1e0))
* **identifierinterval:** Add mergeIdsIntoIntervals() ([90e3138](https://github.com/coast-team/mute-structs/commit/90e3138))
* **identifierinterval:** Add toIds() ([5ae27dd](https://github.com/coast-team/mute-structs/commit/5ae27dd))
* **idfactory:** Add createAtPosition() ([9c4a61a](https://github.com/coast-team/mute-structs/commit/9c4a61a))
* **idfactory:** Retain INT32_BOTTOM/TOP for renaming purpose, introduce INT32_BOTTOM/TOP_USER ([492328c](https://github.com/coast-team/mute-structs/commit/492328c))
* **logootsadd:** Add insertedIds() ([31cc63f](https://github.com/coast-team/mute-structs/commit/31cc63f))
* **logootsropes:** Remove ability to prepend using insertLocal() ([979170b](https://github.com/coast-team/mute-structs/commit/979170b))
* **renamablereplicablelist:** Add delLocal() and corresponding RenamableLogootSDel ([7584deb](https://github.com/coast-team/mute-structs/commit/7584deb))
* **renamablereplicablelist:** Add insertLocal() and corresponding RenamableLogootSAdd ([e52521c](https://github.com/coast-team/mute-structs/commit/e52521c))
* **renamablereplicablelist:** Add insertRemote() ([fc6b9d8](https://github.com/coast-team/mute-structs/commit/fc6b9d8))
* **renamablereplicablelist:** Implement delRemote() ([a7acacc](https://github.com/coast-team/mute-structs/commit/a7acacc))
* **renamablereplicablelist:** Implement renameRemote() ([0d0c537](https://github.com/coast-team/mute-structs/commit/0d0c537))
* **renamablereplicablelist:** Implement renameRemote() to revert and apply correct renaming operations ([6ddf0ae](https://github.com/coast-team/mute-structs/commit/6ddf0ae))
* **renamablereplicablelist:** Store observed renamingMaps ([ed217d6](https://github.com/coast-team/mute-structs/commit/ed217d6))
* **renamablereplicablelist:** Use renameIdsFromEpochToCurrent() to properly rename deleted ids if needed ([73ce5b3](https://github.com/coast-team/mute-structs/commit/73ce5b3))
* **renamablereplicablelist:** Use renameIdsFromEpochToCurrent() to properly rename new ids if needed ([747ffef](https://github.com/coast-team/mute-structs/commit/747ffef))
* Add Epoch ([9523bbc](https://github.com/coast-team/mute-structs/commit/9523bbc))
* Add EpochId ([3a4757d](https://github.com/coast-team/mute-structs/commit/3a4757d))
* Add EpochStore ([63dd210](https://github.com/coast-team/mute-structs/commit/63dd210))
* Add RenamableListOperation ([58e78fd](https://github.com/coast-team/mute-structs/commit/58e78fd))
* Add RenamableLogootSOperation ([44c8b7e](https://github.com/coast-team/mute-structs/commit/44c8b7e))
* Add RenamableReplicableList ([33c71cb](https://github.com/coast-team/mute-structs/commit/33c71cb))
* Add renaming operation LogootSRename ([30eb882](https://github.com/coast-team/mute-structs/commit/30eb882))
* Add RenamingMap ([14ef3c8](https://github.com/coast-team/mute-structs/commit/14ef3c8))
* Add RenamingMap ([8ea767d](https://github.com/coast-team/mute-structs/commit/8ea767d))
* Add RenamingMapStore ([6b72596](https://github.com/coast-team/mute-structs/commit/6b72596))
* **ropesnodes:** Add mkNodeAt() ([fb203a4](https://github.com/coast-team/mute-structs/commit/fb203a4))


<a name="1.1.0"></a>
# [1.1.0](https://github.com/coast-team/mute-structs/compare/v1.0.0...v1.1.0) (2019-03-04)


### Bug Fixes

* **logootsropes:** fix checks before appending/prepending ([91f24b5](https://github.com/coast-team/mute-structs/commit/91f24b5))


### Features

* **ropesnodes:** add max getter to retrieve max id from a subtree ([ee779a7](https://github.com/coast-team/mute-structs/commit/ee779a7))
* **ropesnodes:** add min getter to retrieve min id from a subtree ([ee2da24](https://github.com/coast-team/mute-structs/commit/ee2da24))


<a name="1.0.0"></a>
# [1.0.0](https://github.com/coast-team/mute-structs/compare/v0.5.8...v1.0.0) (2019-01-21)



<a name="0.5.8"></a>
## [0.5.8](https://github.com/coast-team/mute-structs/compare/v0.5.7...v0.5.8) (2019-01-21)



<a name="0.5.7"></a>
## [0.5.7](https://github.com/coast-team/mute-structs/compare/v0.5.6...v0.5.7) (2019-01-21)



<a name="0.5.6"></a>
## [0.5.6](https://github.com/coast-team/mute-structs/compare/v0.5.5...v0.5.6) (2019-01-21)



<a name="0.5.5"></a>
## [0.5.5](https://github.com/coast-team/mute-structs/compare/v0.5.4...v0.5.5) (2019-01-21)

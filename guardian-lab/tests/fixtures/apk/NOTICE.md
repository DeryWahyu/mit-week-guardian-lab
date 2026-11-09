# APK test fixtures

Fixtures are used only by automated tests. They are not website presets and must never be installed or executed during testing.

- `hello.apk` is the existing `test/fixt/app-debug-unaligned.apk` test artifact from DeviceFarmer/adbkit-apkreader, commit `8deeaf4cd8bccc5152d403b039fbd78a57ae0b51`.
- Source: <https://github.com/DeviceFarmer/adbkit-apkreader/blob/8deeaf4cd8bccc5152d403b039fbd78a57ae0b51/test/fixt/app-debug-unaligned.apk>
- SHA-256: `6d9f0b0c88093c5af2e97457181cfb2f397592b6e35a42c86e23ad0cf145d2e5`.
- The artifact identifies itself as `com.example.hello.helloapp.app`, version `1.0`, SDK 7/19, label `HelloApp`. Tests inspect its binary manifest and DEX without running Android code.
- `resources-only.apk` is a test derivative containing only the original `AndroidManifest.xml` and `resources.arsc`, repackaged into ZIP. It is intentionally incomplete and unsigned. It exercises resource/manifest extraction, not installability or a malware verdict.
- Derivative SHA-256: `b291fbb0a4cd83cd2ded1f0742daefaa1496e10fb414a42747909028b004070e`.

Upstream notice:

Copyright 2013 CyberAgent, Inc.
Copyright 2016 The OpenSTF Project.

Licensed under the Apache License, Version 2.0. See [LICENSE.txt](./LICENSE.txt) and the upstream [license](https://github.com/DeviceFarmer/adbkit-apkreader/blob/8deeaf4cd8bccc5152d403b039fbd78a57ae0b51/LICENSE). The APK retains its embedded upstream resources and metadata. The derivative is a test-only modification made for Guardian Lab.

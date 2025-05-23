# Permissionless Spark Interface by cp0x

An open-source, permissionless interface for the Spark protocol, designed to be fully permissionless and enable direct, unrestricted interaction with smart contracts.

## Application Links
- Website: [pi.cp0x.com](https://pi.cp0x.com/)
- Interface: [spark.cp0x.com](https://spark.cp0x.com)
- Twitter: [@cp0xdotcom](https://x.com/cp0xdotcom)
- Telegram: [@cp0xdotcom](https://t.me/cp0xdotcom)

# App

## Development

```sh
pnpm install
pnpm run dev # runs application in dev mode
pnpm run storybook # runs storybook in dev mode
```

### pnpm version

Exact pnpm version `9.14.2` is required. Install with:

```sh
curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=9.14.2 sh -
```

To enforce Vercel build to use exact pnpm version, add environment variable at Vercel project settings. This way Vercel will use exact pnpm version specified in root package.json.
```sh
ENABLE_EXPERIMENTAL_COREPACK=1
```

## Feature flags

Feature flags need to be verified by using `import.meta.env.VITE_FEATURE_X` (and not some helper functions). Only then
dead code elimination for production builds work and disabled features will be entirely deleted in production build.

Control feature flags via `.env` files:

```
VITE_FEATURE_X=1
```

All feature flags are listed in `.env.example` file.

## Testing

### Integration tests

Integration tests focus on testing integration between different components within the app and don't hit real (or
forked) blockchain node. We mock networking on viem's transport layer.

```sh
pnpm test
pnpm run test
```

### E2E tests

E2E tests utilize Tenderly forks (because local nodes like anvil are too slow) to test real interactions with
blockchain.

```sh
pnpm test-e2e
CI=true pnpm test-e2e # to check locally if E2E tests pass, it's fully parallel, will record trace and retry failed tests (we do the same on CI)
pnpm test-e2e:ui # to inspect in Playwright UI and debug in ephemeral chrome window
```

To control, from E2E test, the way application loads web3 wallets we inject wallet info via global object. To enable
this mechanism you need to start the app with: `pnpm run dev --mode playwright`.

Forks are by default removed after tests, to persist it set `TENDERLY_PERSIST_FORK` env variable to `1`.

To enable tracing for better CI debugging, set `PLAYWRIGHT_TRACE` env variable to `1`. You will able to download
playwright report with traces. The easiest way to explore it is to unpack the contents of `playwright-report` artifact
into the local folder `packages/app/playwright-report`, go to the folder `packages/app` and run

```sh
pnpx playwright show-report
```

#### Deterministic Time in E2E Tests

To ensure deterministic outcomes in e2e tests, we utilize a hardcoded future `simulationDate`, in both the browser
environment and on the forked blockchain. This approach is vital for accurately testing time-sensitive features, such as
LTV checks or fluctuating aToken values. We've chosen an arbitrary future date due to the current lack of more dynamic
time control methods on tenderly forks with idea that in near future we'll refactor to more robust solution.

#### Mocking external HTTP requests in E2E tests

Savings page E2E tests require mocking requests to LiFi API. To do so, we use `overrideLiFiRouteWithHAR` utility function
that leverages playwright's HAR recording feature. To create new or modify existing E2E tests that require mocking LiFi API,
follow these steps:
- Get the latest block number on the appropriate network (e.g. mainnet, gnosis).
- Set test's tenderly fork block number to the fetched block number. This is necessary because LiFi supports only requests
to the current block, not to the past blocks. It is generally safe to have a small discrepancy between the block number set in
tests and block number that LiFi request is recorded for, although be aware that this might be a potential source of issues.
- In `overrideLiFiRouteWithHAR` utility function, set `update` parameter to `true`. This will record requests to LiFi API and
save them to HAR file. When `update` is set to `true`, the network requests are always carried out even if the HAR file is present.
If you want to add a new test, pass a new unique key to the `overrideLiFiRouteWithHAR` function. The key should be descriptive
of the request that is being mocked.
- Ensure that the test user address is fixed - pass `privateKey` option in the account options object to the `setup` function in the test file.
We follow the convention to pass `LIFI_TEST_USER_PRIVATE_KEY` constant.
- Run the test. The test might fail some assertions, but the requests will still be recorded.
- Now we can make the data used in the test fixed. Set `update` parameter to `false` in `overrideLiFiRouteWithHAR` utility function.
This will stop recording requests and use the HAR file instead.
- You can now run the test again and potentially fix assertions that failed in the previous run.
- If necessary, you can modify the HAR file manually. This might be useful when you need to test rare edge cases.

### Injecting rpc through url

In development and staging environments, there is an option to inject custom `rpc` with `chainId` via url. It can be used for instrumenting the app to test fork environments etc.
This functionality is guarded by the feature flag `VITE_FEATURE_RPC_INJECTION_VIA_URL`. Injected network details will be lost after the app is reloaded.
```
https://spark-app-staging.vercel.app/?rpc=https://rpc.example.com&chainId=1
```


### Visual regression

Storybook and e2e tests are visually tested. Every story is automatically tested. In E2E tests screenshots are made
explicitly.

### i18n

Read the [Lingui guide](https://lingui.dev/tutorials/setup-react) to understand how we translate the app.

Note: right now we extract the strings right before building the app to ensure that production build works fine. Read
[this](https://github.com/lingui/js-lingui/issues/1803) issue to learn more.

### Static assets

Images that are used in `img` tags should be put into directory `packages/app/src/ui/assets` and exported in the `assetts` object. Other static assets, for instance the ones that are used as background images, should be put into `packages/app/public` directory and the path to them should be hardcoded in the code.

## Monorepo setup learnings

* ESM builds are problematic because the import paths have to have explicit "js" file extensions. Do not use bundling like tsup as a workaround but rather manually add `.js` extensions to files (there is a linter to enforce this).
* Use multiple entry points to packages using package.json `exports` field.
  * `typesVersions` is useful to make package more generic. [Read more](https://github.com/sveltejs/kit/issues/9007#issuecomment-1426900538)

---

_The IP in this repository was assigned to Mars SPC Limited in respect of the MarsOne SP_

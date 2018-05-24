// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  hxlProxy: 'https://beta.proxy.hxlstandard.org/data.json',
  hxlProxyValidate: 'https://beta.proxy.hxlstandard.org/actions/validate',
  hxlCheck: 'http://www.mocky.io/v2/59e0f52f0f00003405effd4c', // succesful hxl check
  // hxlCheck: 'http://www.mocky.io/v2/59ec7fc03100009601d24e0e', // failing hxl check
  hxlPreview: 'https://tools.humdata.org/quickcharts/app',
  snapService: 'http://localhost:8080',
  googleAnalyticsKey: 'UA-48221887-3',
  prodMixpanelKey: '99035923ee0a67880e6c05ab92b6cbc0', // actually hdx-server project not prod
  testMixpanelKey: '875bfe50f9cb981f4e2817832c83c165',
  prodHostname: 'tools.humdata.org' // used by analytics code to decide which key to use
};

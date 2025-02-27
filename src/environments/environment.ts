/*
 * Polkascan Explorer GUI
 *
 * Copyright 2018-2020 openAware BV (NL).
 * This file is part of Polkascan.
 *
 * Polkascan is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Polkascan is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Polkascan. If not, see <http://www.gnu.org/licenses/>.
 *
 * environment.ts
 */

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// see also: getBuilderConfiguration

// export const environment = {
//   production: false,
//   jsonApiDiscoveryRootUrl: 'https://discovery-32.polkascan.io',
//   jsonApiRootUrl: null,
//   network: {
//     name: null,
//     networkId: null,
//     networkType: null,
//     chainType: null,
//     tokenSymbol: null,
//     tokenDecimals: null,
//     colorCode: null
//   }
// };

export const environment = {
  production: true,
  jsonApiDiscoveryRootUrl: null,
  jsonApiRootUrl: 'https://aresscan.aresprotocol.io/odyssey/api/v1',
  // jsonApiRootUrl: 'http://45.77.30.9:8080/api/v1',
  network: {
    name: 'Odyssey',
    networkId: 'odyssey',
    networkType: 'pre',
    chainType: 'relay',
    tokenSymbol: 'ARES',
    tokenDecimals: 12,
    colorCode: '1096f1'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

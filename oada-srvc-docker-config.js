/* Copyright 2014 Open Ag Data Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var path = require('path');
var fs = require('fs');

module.exports = {

  // By default, this checks for NODE_ENV===production 
  // to determine if is production.  
  // set to true to use the production database name
  // and prevent init.cleanup() from being called.
  isProduction: (process.env.NODE_ENV === 'production'),

  arangodb: {
    connectionString: 'http://arangodb:8529',
    database: 'oada',
    collections: {
           users: { name: 'users',      indexes: [ 'username' ], defaults: './libs/exampledocs/users'      },
         clients: { name: 'clients',    indexes: [ 'clientId' ], defaults: './libs/exampledocs/clients'    },
          tokens: { name: 'tokens',     indexes: [ 'token'    ], defaults: './libs/exampledocs/tokens'     },
           codes: { name: 'codes',      indexes: [ 'code'     ], defaults: './libs/exampledocs/codes'      },
       resources: { name: 'resources',  indexes: [            ], defaults: './libs/exampledocs/resources'  },
      graphNodes: { name: 'graphNodes', indexes: [            ], defaults: './libs/exampledocs/graphNodes' },
           edges: { name: 'edges',      indexes: [ { name: 'name', unique: false } ], defaults: './libs/exampledocs/edges',
                    edgeCollection: true },
    },
    init: {
      // NOTE: passwordSalt HAS to match the one in auth
      passwordSalt: '$2a$10$l64QftVz6.7KR5BXNc29IO',
    }
  },
	kafka: {
    topics: {
      tokenRequest: 'token_request',
      graphRequest: 'graph_request',
      writeRequest: 'write_request',
      httpResponse: 'http_response',
    },
  },
  zookeeper: {
    host: 'zookeeper:2181',
  },
  auth: {
    endpointsPrefix: '/oadaauth',
    server: {
      // Replace these in production with things that are actually secret...
      sessionSecret: "2jp901p3#2#(!)kd9",
      passwordSalt: "$2a$06$xbh/gQcEgAX5eapjlCgMYO",
      port: 80,
      mode: "http",
      domain: "localhost", // in docker it's port 80 localhost
      publicUri: "https://localhost" // but to nginx proxy, it's https://localhost in dev
    },
    endpointsPrefix: '/oadaauth',
    // Prefix should match nginx proxy's prefix for the auth service
    //endpointsPrefix: "/oadaauth",
    keys: {
      signPems: path.join(__dirname,"sign/"),
    },
    datastoresDriver: 'arango',
    hint: {
      username: "frank",
      password: "test"
    },
  },
  wellKnown: {
    server: {
      port: 443,
      mode: 'https',
      domain: 'localhost',
    },
    mergeSubServices: [
      { resource:   'oada-configuration', base: 'http://auth', },
      { resource: 'openid-configuration', base: 'http://auth', },
    ],
    "oada-configuration": {
      well_known_version: '1.0.0',
      oada_base_uri: 'https://localhost:443',
      scopes_supported: [
        {
          name: 'oada.all.1', // can do anything the user can do
          /* pattern: /oada\..*\.1/  */
          'read+write': true, // can read/write anything the user can read/write
        }
      ],
    },
    "openid-configuration": { },
  },

};
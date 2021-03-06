'use strict'

/*
  Note: This test requires monitoring over Docker containers, so it is not
  isolated in the tests container; Please run it on the host machine or using
  the admin container with Docker instead.

  Testing script 0:
    - Check that all the components needed are running as Docker containers.

 */

describe('Required Docker containers', () => {
  const config = require('../config')
  // config.set('isTest', true);
  const path = require('path')

  const debug = require('debug')
  const trace = debug('tests:trace')
  const info = debug('tests:info')
  const error = debug('tests:error')
  const debugMark = ' => '

  const expect = require('chai').expect
  const axios = require('axios')
  const Promise = require('bluebird')
  const validator = require('validator')

  const exec = require('node-exec-promise').exec

  const REQUIRED_CONTAINER_NAMES = [
    'arangodb',
    'auth',
    'graph-lookup',
    'http-handler',
    'hitman',
    'proxy',
    'rev-graph-update',
    'startup',
    'token-lookup',
    'well-known',
    'write-handler'
  ]

  let containersAreRunning = Array.apply(
    null,
    Array(REQUIRED_CONTAINER_NAMES.length)
  ).map(Boolean, false)

  before(done => {
    Promise.each(REQUIRED_CONTAINER_NAMES, (containerName, idx) => {
      info('  ' + containerName)
      return exec(
        "docker inspect -f '{{.State.Running}} ' " + containerName
      ).then(execResult => {
        trace(
          '  execResult for ' +
            containerName +
            ': ' +
            JSON.stringify(execResult)
        )
        let isRunning = execResult.stdout.includes('true')
        trace('      isRunning: ' + isRunning)
        containersAreRunning[idx] = isRunning
      })
    })
      .catch(err => error(err))
      .asCallback(() => {
        trace('    containersAreRunning: ' + containersAreRunning)
        done()
      })
  })

  // Tests.
  describe('containersAreRunning', () => {
    trace('    containersAreRunning: ' + containersAreRunning)
    REQUIRED_CONTAINER_NAMES.forEach((containerName, idx) => {
      describe(containerName, () => {
        it('should be running', () => {
          expect(containersAreRunning[idx]).to.be.a('Boolean').equals.true
        })
      })
    })
  })
})

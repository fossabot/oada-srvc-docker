'use strict';

const Promise = require('bluebird');
const expect = require('chai').expect;
const kf = require('node-rdkafka');
const uuid = require('uuid');
const info = require('debug')('oada-lib-kafka:tests:info');
const error = require('debug')('oada-lib-kafka:tests:error');

const config = require('../config');

const Responder = require('../').Responder;
const Requester = require('../').Requester;

const REQ_TOPIC = 'test_requests';
const RES_TOPIC = 'test_responses';
const GROUP = 'test_group';

describe('Responder', () => {
    let res;
    beforeEach(function createResponder() {
        res = new Responder(REQ_TOPIC, RES_TOPIC, GROUP);
        res.on('error', error);
    });

    afterEach(function destroyResponder(done) {
        info('start destroy responder');
        res.producer.flush(null, () => {
            res.disconnect().finally(() => {
                info('finish destroy responder');
                done();
            });
        });
    });

    let prod;
    before(function makeTestProd(done) {
        //this.timeout(10000);

        prod = new kf.Producer({
            'metadata.broker.list': config.get('kafka:broker')
        });

        prod.on('error', error);
        prod.on('event.error', error);

        prod.connect();

        return prod.on('ready', () => done());
    });
    after(function killTestProd(done) {
        prod.flush(null, () => {
            prod.disconnect();
        });
        prod.on('disconnected', () => done());
    });

    let cons;
    before(function makeTestCons(done) {
        //this.timeout(10000);

        cons = new kf.KafkaConsumer({
            'metadata.broker.list': config.get('kafka:broker'),
            'group.id': GROUP,
            'auto.offset.reset': 'latest'
        });

        cons.on('error', error);
        cons.on('event.error', error);

        cons.connect();

        return cons.on('ready', () => {
            cons.subscribe([RES_TOPIC]);
            cons.consume();
            done();
        });
    });
    after(function killTestCons(done) {
        cons.disconnect();
        cons.on('disconnected', () => done());
    });

    it('should become ready', done => {
        info('start');
        res.on('ready', () => {
            info('ready');
            done();
        });
    });

    it('should receive a request', () => {
        info('start');
        let obj = {'foo': 'baz'};
        let mesg = new Buffer(JSON.stringify(obj));

        let p = Promise.fromCallback(done => {
            res.on('request', req => {
                info('request');
                done(null, req);
            });
        }).then(req => {
            expect(req).to.deep.equal(obj);
        });

        prod.produce(REQ_TOPIC, null, mesg);
        return p;
    });

    it('should not receive timed-out requests', () => {
        info('start');
        let id1 = uuid();
        let id2 = uuid();
        let mesg1 = new Buffer(JSON.stringify({
            id: id1,
            time: Date.now() - 365 * 24 * 60 * 60 * 1000 // 1 year from now
        }));
        let mesg2 = new Buffer(JSON.stringify({
            id: id2,
            time: Date.now()
        }));

        res.on('ready', () => info('ready'));

        let p = Promise.fromCallback(done => {
            let reqs = [];
            res.on('request', req => {
                info('request');
                reqs.push(req);

                console.log(req.id);

                if (req.id === id2) {
                    done(null, reqs);
                }
            });
        }).each(req => {
            // Make sure we didn't recieve the "old" request
            expect(req.id).to.not.equal(id1);
        });

        prod.produce(REQ_TOPIC, null, mesg1);
        prod.produce(REQ_TOPIC, null, mesg2);
        return p;
    });

    it('should respond to a request', () => {
        info('start');
        let id = 'DEADBEEF';
        let obj = {'foo': 'bar', 'connection_id': id};
        let mesg = new Buffer(JSON.stringify(obj));

        res.on('ready', () => info('ready'));

        let robj = {'a': 'c'};
        res.on('request', req => {
            info('request');
            return Object.assign(req, robj);
        });

        let p = Promise.fromCallback(done => {
            cons.on('data', data => {
                info('data');
                let resp = JSON.parse(data.value);
                if (resp['connection_id'] === id) {
                    done(null, resp);
                }
            });
        }).then(resp => {
            delete resp.time;
            expect(resp).to.deep.equal(Object.assign(obj, robj));
        });

        prod.produce(REQ_TOPIC, null, mesg);
        return p;
    });
});

describe('Requester', () => {
    xit('should work', () => {
        var req = new Requester();
    })
});
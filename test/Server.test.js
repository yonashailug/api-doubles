const expect = require('chai').expect
const { baseDouble, postBaseDouble, badUrlDouble, base301Double, sameUrl301BaseDouble, noRequestDouble,
    noResponseDouble
} = require('./testDoubles')

const Server = require('../src/Server')
const client = require("axios");

describe('Server', () => {
    let server
    beforeEach(() => {
        server = new Server
    })


    it('can exist', () => {
        expect(server).to.be.ok
    })

    describe('start()', () => {
        afterEach(() => server.close())

        it('can be started', () => {
            server.start()

            expect(server).to.be.ok

        })

        it('defaults to a port when none is provided', () => {
            server.start()

            return client.get('http://localhost:8001').catch(({response}) => expect(response.status).to.eq(404))
        })

        it('uses a port when provided', () => {
            server.start(8002)

            return client.get('http://localhost:8002').catch(({response}) => expect(response.status).to.eq(404))
        })
    })

    describe('request()', () => {
        it('returns with status as 404 when no double is registered with provided url', () => {
            server.request('get', 'http://localhost:8000/bad-url')

            expect(server.response.status).to.eq(404)
        })

        it('returns a response', () => {
            server.registerDouble(baseDouble)

            expect(server.request('GET', 'http://localhost:8001/some-example')).to.deep.equal({
                status: 200,
                redirectURL: "",
                content: {
                    size: 42,
                    hasStuff: true
                }
            })
        })

        it('returns a response with content', () => {
            server.registerDouble(baseDouble)
            let testDouble = server.request('GET', 'http://localhost:8001/some-example')

            expect(testDouble.hasOwnProperty('content')).to.be.true
        })
    })

    describe('removeAllDoublesWithUri()', () => {
        it('removes all doubles that have the provided uri', () => {
            const uri = 'http://localhost:8000/bad-url'

            server.registerDouble(badUrlDouble)
            server.removeAllDoublesWithUri(uri)

            expect(server.isRegistered(uri)).to.be.false
        })
        it('should set message if no valid url is found', () => {
            const uri = 'http://localhost:8000/bad-url'

            server.registerDouble(baseDouble)
            server.removeAllDoublesWithUri(uri)

            expect(server.isRegistered(baseDouble.request.url)).to.be.true
            expect(server.getMessage()).to.equal('Invalid uri: Not registered')
        })
        it('removes multiple doubles with the same uri', () => {
            const uri = 'http://localhost:8001/some-example'

            server.registerDouble(baseDouble)
            server.registerDouble(postBaseDouble)
            server.removeAllDoublesWithUri(uri)

            expect(server.isRegistered(uri)).to.be.false
        })

        it('only removes double with provided url', () => {
            const someExampleUrl = 'http://localhost:8001/some-example'
            const redirectUrl = 'http://localhost:8001/301-example'

            server.registerDouble(baseDouble)
            server.registerDouble(base301Double)
            server.removeAllDoublesWithUri(someExampleUrl)

            expect(server.isRegistered(someExampleUrl)).to.be.false
            expect(server.isRegistered(redirectUrl)).to.be.true
        })
    })

    describe('registerDouble()', () => {
        it('registers a double', () => {
            server.registerDouble(baseDouble)

            expect(server.allDoubles).contains(baseDouble)
        })

        it('replaces double in allDoubles if double exists', () => {
            server.registerDouble(baseDouble)
            server.registerDouble(sameUrl301BaseDouble)
            let response = server.request('GET', "http://localhost:8001/some-example")

            expect(server.allDoubles.length).equal(1)
            expect(response.status).equal(301)
        })

        it('does not replace double in allDoubles if method is different', () => {
            server.registerDouble(baseDouble)
            server.registerDouble(postBaseDouble)
            let response = server.request('GET', "http://localhost:8001/some-example")

            expect(server.allDoubles.length).equal(2)
            expect(response.status).equal(200)
        })

        it('throws malformed double error if double is missing request', () => {
            expect(() => server.registerDouble(noRequestDouble)).to.throw('Double missing request property.')
        })

        it('throws malformed double error if double missing response', () => {
            expect(() => server.registerDouble(noResponseDouble)).to.throw('Double missing response property.')
        })
    })

    describe('isRegistered()', () => {
        it('returns true if uri is registered', () => {
            const uri = "http://localhost:8001/some-example"

            server.registerDouble(baseDouble)

            expect(server.isRegistered(uri)).to.be.true
        })

        it('returns false if uri is not registered', () => {
            let uri = "http://localhost:8001/some-example";

            expect(server.isRegistered(uri)).to.be.false
        })
    })
})
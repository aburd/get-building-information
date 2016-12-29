'use strict'

const cheerio = require('cheerio')
const Promise = require('bluebird')
const request = Promise.promisifyAll(require('request'))
const fs = require('fs')
const path = require('path')
const url = require('url')

// start timer
console.time('Operation took')

// the website to target
const baseUrl = 'http://www.servcorp.co.jp/ja/locations'

// set up output file to write to
let writable = fs.createWriteStream(path.join(__dirname, 'output', 'results.json'), {defaultEncoding: 'utf8'})

// get all the necessary urls
const allLocations = JSON.parse(fs.readFileSync('./locations.json'))
let locations = [];
Object.keys(allLocations).forEach((city) => {
	allLocations[city].forEach((location) => {
		locations.push(baseUrl + '/' + city + '/' + location.url)
	})
})

// Make sure to use mapSeries so we don't crash the server
let results = []
Promise.mapSeries(locations, (location) => {

	// tell which location we are processing
	const locationPath = url.parse(location).path;
	console.log('Processing:', locationPath)

	// get the information we need
	return request.getAsync(location)
		.then((res) => {
			const $ = cheerio.load(res.body)
			const selector = '.module.generic-two-column .column-container:first-child'
			const text = $(selector).text().replace(/\s+/g, '\n\n').trim();

			// results.push({url: location, result: text})
			return {url: location, result: text}
		})

	}).then((res) => {
		// tell how long
		console.timeEnd('Operation took')
		writable.write(JSON.stringify(res))
	}).catch((err) => {

		console.log('There was an error:')
		console.log(err)

	})
const asyncWrap = require('async-functions-wrap')
const fs = require('fs')
const xml2js = require('xml2js')
const request = require('superagent')
const bluebird = require('bluebird')

asyncWrap(async () => {  
  let parser = new xml2js.Parser()
  let rawdata = fs.readFileSync(__dirname + '/data/temple.xml')

  rawdata = await (new Promise((resolve, reject) => {
    parser.parseString(rawdata, (err, result ) => {
        if (err) return reject(err)
        return resolve(result)
    })
  }))
  
  let temples = rawdata['ArrayOfOpenData_3']['OpenData_3']
  console.log('all temples: ', temples.length)

  // filter
  let filtered = temples.filter(temple => {
    return temple['主祀神祇'] && (temple['主祀神祇'][0] === '福德正神' || temple['主祀神祇'][0] === '土地公') 
  });

  let formated = filtered.map(temple => {
      return {
          name: temple['寺廟名稱'] && temple['寺廟名稱'][0],
          god: temple['主祀神祇'] && temple['主祀神祇'][0],
          area: temple['行政區'] && temple['行政區'][0],
          address: temple['地址'] && temple['地址'][0],
          religion: temple['教別'] && temple['教別'][0],
          buildType: temple['建別'] && temple['建別'][0],
          orgType: temple['組織型態'] && temple['組織型態'][0],
          phone: temple['電話'] && temple['電話'][0],
          name: temple['負責人'] && temple['負責人'][0],
          other: temple['其他'] && temple['其他'][0],
      }
  })
  console.log('All Tudigong: ', formated.length)

  // enrich
  // 'https://maps.googleapis.com/maps/api/geocode/json?parameters'

  let enriched = await bluebird.mapSeries(formated, async (temple, index) => {
    let res
    try {
      console.log('%s, query location: %s', index, temple.address)
      res = await request
        .get('https://maps.googleapis.com/maps/api/geocode/json')
        .query({ address: temple.address })
      console.log('done', index)

      if (res.body.status === 'ZERO_RESULTS') return temple

      //
      temple.location = res.body.results[0].geometry.location
      return temple
    } catch (e) {
      console.error(e, 'index', index, temple, res.body)
      throw e
    }
  })

  // save to file
  await (new Promise((resolve, reject) => {
    fs.writeFile(__dirname + '/data/temple.json', JSON.stringify(enriched), function (err) {
      if (err) return reject(err)
      return resolve()
    });
  }))

  return 'done'
})

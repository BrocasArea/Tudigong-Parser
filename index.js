const asyncWrap = require('async-functions-wrap')
const fs = require('fs')
const xml2js = require('xml2js')

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

  // save to file
  await (new Promise((resolve, reject) => {
    fs.writeFile(__dirname + '/data/temple.json', JSON.stringify(formated), function (err) {
      if (err) return reject(err)
      return resolve()
    });
  }))

  return 'done'
})

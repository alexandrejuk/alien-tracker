const express = require('express')
const bodyParser = require('body-parser')
const { applySpec, prop, props, map } = require('ramda')
const morgan = require('morgan')
const mongoose = require('mongoose')

mongoose.connect('mongodb://mongo:27017/locationDB')
  .then(() => console.log("db connected!"))
  .catch((error) => console.error("error: ", error))
  
const locationSchema = new mongoose.Schema({
  type : { type: String, default: 'Point', required: true },
  coordinates : { type: [Number], required: true, defaul: [] },
  latitude: Number,
  longitude: Number,
  time: Date,
  provider: String,
  tecnico_id: String,
}, { versionKey: false })

const Location = mongoose.model('Location', locationSchema);

const locationSpec = (tecnicoId) => applySpec({
  provider: prop('provider'),
  time: prop('time'),
  latitude: prop('latitude'),
  longitude: prop('longitude'),
  coordinates: props(['longitude', 'latitude']),
  tecnico_id: () => tecnicoId
})

const app = express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))

app.use(morgan('dev'))


app.post('/locations', async (request, response, next) => {
  try {
    const { body: locations } = request
    const tecnicoId = request.header('tecnico-id')

    const formatedLocations = map(locationSpec(tecnicoId), locations)
    const savedLocations  = await Location.insertMany(formatedLocations).then()

    console.log(savedLocations)
    response.status(200).json(savedLocations);
  } catch (error) {
    next(error)
  }
});

app.get('/locations', async (request, response, next) => {
  try {
    const locations = await  Location.aggregate([
      { $sort: { time: 1 } },
      { 
        $group: { 
            _id: '$tecnico_id',
            lastId: { $last: '$_id' },
            latitude: { $last: '$longitude' }, 
            longitude: { $last:'$longitude' },
            coordinates: { $last:'$coordinates' },
            time: { $last:'$time' },
        }
      },
      {
          $project: {
              _id: '$lastId',
              tecnico_id: '$_id',
              latitude: 1, 
              longitude: 1,
              coordinates: 1,
              time: 1,
          }
      }
    ])
    response.status(200).json(locations);
  } catch (error) {
    next(error)
  }
});

app.listen(3000, () => console.log('oi'));
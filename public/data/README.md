
# Vasaloppet Race Data

This folder contains JSON data files for the Vasaloppet Analytics application.

## Required Files

The application expects two JSON files:

1. `athletes.json` - Contains data about all athletes
2. `statistics.json` - Contains overall race statistics

## File Formats

### athletes.json

This file should contain an array of athlete objects with the following structure:

```json
[
  {
    "id": 1,
    "bibNumber": 101,
    "name": "Erik Johansson",
    "club": "IFK Stockholm",
    "nationality": "SWE",
    "finishTime": "04:23:12",
    "finishTimeSeconds": 15792,
    "position": 1,
    "gender": "M",
    "category": "Men 1",
    "year": 2023,
    "checkpoints": [
      {
        "name": "Start (Sälen)",
        "distance": 0,
        "time": "00:00:00",
        "timeSeconds": 0,
        "position": 1,
        "relativeToBest": 0,
        "relativeToAverage": 0
      },
      {
        "name": "Smågan",
        "distance": 11,
        "time": "00:32:45",
        "timeSeconds": 1965,
        "position": 2,
        "relativeToBest": 12,
        "relativeToAverage": -85
      },
      // ... more checkpoints
    ]
  },
  // ... more athletes
]
```

### statistics.json

This file should contain overall race statistics with the following structure:

```json
{
  "finishTimes": {
    "min": 15792,
    "max": 32400,
    "avg": 24300
  },
  "paces": {
    "min": 175,
    "max": 360,
    "avg": 270
  },
  "totalFinishers": 200,
  "dnfCount": 20,
  "checkpointStats": {
    "Smågan": {
      "min": 1953,
      "max": 3600,
      "avg": 2400
    },
    "Mångsbodarna": {
      "min": 4320,
      "max": 7200,
      "avg": 5400
    },
    // ... more checkpoints
  }
}
```

## Example Data

The application includes sample JSON files based on the mock data. These files can be used as templates for your actual race data.

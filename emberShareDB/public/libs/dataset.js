class Dataset {

  constructor(docId) {
    this.recordingRound = 0;
    this.temp = [];
    this.DATASET_KEY = "dataset";
    this.REC_KEY = "recordingRound";
    this.store = localforage.createInstance({name: docId});
    this.store.getItem(this.DATASET_KEY).then((dataset)=> {
      if(!dataset)
      {
        console.log("making new entry for dataset");
        this.store.setItem(this.DATASET_KEY,[]);
        this.store.setItem(this.REC_KEY, 0);
      }
      else
      {
        this.store.getItem(this.REC_KEY).then((rec)=> {
          this.recordingRound = rec;
        });
        console.log("dataset exists of size " + dataset.length);
      }
    });
  }

  clear() {
    this.store.setItem(this.DATASET_KEY,[]);
  }

  print() {
    this.store.getItem(this.DATASET_KEY).then((dataset)=> {
      dataset.forEach((line)=> {
        console.log(line);
      });
    });
  }

  deleteLastRound() {
    this.store.getItem(this.DATASET_KEY).then((dataset)=> {
        let trainingData = [];
        dataset.forEach((line)=> {
          if(line.recordingRound < this.recordingRound - 1)
          {
            trainingData.push({input:line.input, output:line.output});
          }
        });
      	this.recordingRound--;
      	this.store.setItem(this.REC_KEY, this.recordingRound);
        this.store.setItem(this.DATASET_KEY, trainingData);
      });
  }

  addRow(newInputs, newOutputs) {
    this.temp.push({input:newInputs,
                    output:newOutputs,
                    recordingRound:this.recordingRound});
  }

  save() {
    return new Promise((resolve, reject)=> {
      this.store.getItem(this.DATASET_KEY).then((dataset)=> {
        dataset = dataset.concat(this.temp);
        this.temp = [];
        this.store.setItem(this.DATASET_KEY, dataset);
        this.newRecordingRound();
        resolve();
      });
    });
  }

  newRecordingRound() {
  	this.recordingRound++;
    this.store.setItem(this.REC_KEY, this.recordingRound);
  }

  numRows() {
    return new Promise((resolve, reject)=> {
      this.store.getItem(this.DATASET_KEY).then((dataset)=> {
        resolve(dataset.length);
      });
    });
  }

  trainingData() {
    return new Promise((resolve, reject)=> {
      this.save().then(()=> {
        this.store.getItem(this.DATASET_KEY).then((dataset)=> {
          let trainingData = [];
          dataset.forEach((line)=> {
            trainingData.push({input:line.input, output:line.output});
          });
          resolve(trainingData);
        });
      });
    });
  }
}

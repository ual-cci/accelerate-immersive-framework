class Dataset {

  constructor(docId) {
    this.outputGUI = [];
    this.classifier = true;
    this.recordingRound = 0;
    this.recording = false;
    this.running = false;
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

  addGUI(p) {
    let parent = document.body;
    if(p)
    {
      parent = document.getElementById(p);
    }
    let recBtn = document.createElement("BUTTON");
    recBtn.id = "rec-btn";
    recBtn.onclick = ()=>{
      this.record();
    };
    recBtn.innerHTML = "Record";
    parent.appendChild(recBtn);

    let trainBtn = document.createElement("BUTTON");
    trainBtn.id = "train-btn";
    trainBtn.onclick = ()=>{
      this.train();
    };
    trainBtn.innerHTML = "Train";
    parent.appendChild(trainBtn);

    let runBtn = document.createElement("BUTTON");
    runBtn.id = "run-btn";
    runBtn.onclick = ()=>{
      this.run();
    };
    runBtn.innerHTML = "Run";
    parent.appendChild(runBtn);

    // let saveBtn = document.createElement("BUTTON");
    // saveBtn.onclick = ()=>{
    //   this.save();
    // };
    // saveBtn.innerHTML = "Save Dataset";
    // parent.appendChild(saveBtn);

    let deleteLastBtn = document.createElement("BUTTON");
    deleteLastBtn.onclick = ()=>{
      this.deleteLastRound();
    };
    deleteLastBtn.innerHTML = "Delete Last Round";
    parent.appendChild(deleteLastBtn);

    let deleteBtn = document.createElement("BUTTON");
    deleteBtn.onclick = ()=>{
      this.clear();
    };
    deleteBtn.innerHTML = "Clear";
    parent.appendChild(deleteBtn);

    let datalog = document.createElement('span')
    datalog.id = "datalog";
    parent.appendChild(datalog);

    this.guiParent = parent;

    this.updateRows();
  }

  addRegression(
      n,
      callback,
      workerUrl = "https://mimicproject.com/libs/regressionWorker.js",
      gui = true)
    {
    this.setWorker(workerUrl)
    this.onResult = callback;
    this.classifier = false;
    let container = document.createElement("div");
    this.guiParent.appendChild(container);
    for(let i = 0; i < n; i++)
    {
      let slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 1;
      slider.value = 0.5;
      slider.step = 0.01;
      this.outputGUI.push(slider);
      slider.onchange = ()=> {
      	this.onResult({data:slider.value,index:i});
   	  }
      container.appendChild(slider);
    }
  }

  addClassifier(
      n,
      callback,
      workerUrl = "https://mimicproject.com/libs/classificationWorker.js",
      gui = true)
    {
    this.setWorker(workerUrl)
    this.onResult = callback;
    this.classifier = true;
    let container = document.createElement("div");
    var selectList = document.createElement("select");
    selectList.id = "dropdown";
    selectList.onchange = ()=> {
      this.onResult({data:selectList.selectedIndex, index:0});
    }
    this.guiParent.appendChild(container);
    container.appendChild(selectList);
    for (let i = 0; i < n; i++)
    {
        var option = document.createElement("option");
        option.value = i;
        option.text = i;
        selectList.appendChild(option);
    }
    this.outputGUI.push(selectList);
  }

  updateButtons() {
    document.getElementById("run-btn").innerHTML = this.running ? "Stop" : "Run"
    document.getElementById("rec-btn").innerHTML = this.recording ? "Stop" : "Record"
    if(this.onUpdateState)
    {
      this.onUpdateState();
    }
  }

  updateRows() {
    const datalog = document.getElementById("datalog");
    this.numRows().then((n)=>{
      datalog.innerHTML = "You have " + n + " saved examples";
    });
  }

  newData(input, y) {
    if(this.recording)
    {
      //ADD TO DATASET
      this.addRow(input, y);
    }
    else if(this.running)
    {
      //RUN
      this.myWorker.postMessage({action:"run",data:input});
    }
  }

  setWorker(url) {
    this.myWorker = this.createWorker(url);
    this.myWorker.onmessage = (event)=>{
      if(this.onResult)
      {
        for(let i = 0; i < this.outputGUI.length; i++)
        {
          if(this.classifier)
          {
            this.outputGUI[i].value = event.data[i];
          }
          else
          {
			this.outputGUI[i].value = event.data[i];
          }
          this.onResult({index:i, data:event.data[i]});
        }
      }
    }
  }

  train() {
    if(!this.running && ! this.recording)
    {
      this.trainingData().then((t)=> {
        this.updateRows();
        this.myWorker.postMessage({action:"train",data:t});
      });
    }
  }

  run() {
    this.recording = false;
    this.running = !this.running;
    this.updateButtons();
  }

  record() {
    this.running = false;
    this.recording = !this.recording;
    if(!this.recording)
    {
      this.save();
    }
    this.updateButtons();
  }

  clear() {
    this.store.setItem(this.DATASET_KEY,[]).then(()=> {
		    this.updateRows();
    });
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
        this.store.setItem(this.DATASET_KEY, trainingData).then(()=> {
          this.updateRows();
        });
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
        this.store.setItem(this.DATASET_KEY, dataset).then(()=> {
          this.newRecordingRound();
          this.updateRows();
          resolve();
        });
      });
    });
  }

  newRecordingRound() {
  	this.recordingRound++;
    this.store.setItem(this.REC_KEY, this.recordingRound);
  };

  numRows() {
    return new Promise((resolve, reject)=> {
      this.store.getItem(this.DATASET_KEY).then((dataset)=> {
        if(dataset)
        {
          resolve(dataset.length);
        }
        else
        {
          resolve(0);
        }
      });
    });
  };

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

  createWorker (workerUrl) {
	var worker = null;
	try {
		worker = new Worker(workerUrl);
	} catch (e) {
		try {
			var blob;
			try {
				blob = new Blob(["importScripts('" + workerUrl + "');"], { "type": 'application/javascript' });
			} catch (e1) {
				var blobBuilder = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)();
				blobBuilder.append("importScripts('" + workerUrl + "');");
				blob = blobBuilder.getBlob('application/javascript');
			}
			var url = window.URL || window.webkitURL;
			var blobUrl = url.createObjectURL(blob);
			worker = new Worker(blobUrl);
		} catch (e2) {
			//if it still fails, there is nothing much we can do
		}
	}
	return worker;
  }
}

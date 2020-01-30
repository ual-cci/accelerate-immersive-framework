class Learner {

  constructor(docId) {
    docId = window.frameElement.name;
    this.outputGUI = [];
    this.classifier = true;
    this.recordingRound = 0;
    this.recording = false;
    this.running = false;
    this.temp = [];
    this.y = [];
    this.numOutputs = 1;
    this.gui = false;
    this.recLimit = 0;
    this.countIn = 0;
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = ()=>{
      this.DATASET_KEY = "dataset";
      this.REC_KEY = "recordingRound";
      this.store = localforage.createInstance({name: docId});
      console.log("loaded localforage", this.store);
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
        this.updateRows();
      });
    };
    script.src = 'https://mimicproject.com/libs/localforage.min.js';
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  addGUI(p) {
    let parent = document.body;
    if(p)
    {
      parent = p;
    }
    //parent.style.display = "none";

    this.selectorContainer = document.createElement('div');
    parent.appendChild(this.selectorContainer)
   	const table = document.createElement("TABLE");
    parent.appendChild(table)
    let row = table.insertRow();
    let cell = row.insertCell();
    let recBtn = document.createElement("BUTTON");
    recBtn.id = "rec-btn";
    recBtn.onclick = ()=>{
      this.record();
    };
    recBtn.innerHTML = "Record";
    cell.appendChild(recBtn);
    cell = row.insertCell();
    const countDown = document.createElement('span')
    countDown.id = "countdown-span";
    cell.appendChild(countDown);

	row = table.insertRow();
    cell = row.insertCell();
    let trainBtn = document.createElement("BUTTON");
    trainBtn.id = "train-btn";
    trainBtn.onclick = ()=>{
      this.train();
    };
    trainBtn.innerHTML = "Train";
    cell.appendChild(trainBtn);

    row = table.insertRow();
    cell = row.insertCell();
    let runBtn = document.createElement("BUTTON");
    runBtn.id = "run-btn";
    runBtn.onclick = ()=>{
      this.run();
    };
    runBtn.innerHTML = "Run";
    cell.appendChild(runBtn);

    row = table.insertRow();
    cell = row.insertCell();
    let deleteLastBtn = document.createElement("BUTTON");
    deleteLastBtn.onclick = ()=>{
      this.deleteLastRound();
    };
    deleteLastBtn.innerHTML = "Delete Last Round";
    cell.appendChild(deleteLastBtn);

    cell = row.insertCell();
    let deleteBtn = document.createElement("BUTTON");
    deleteBtn.onclick = ()=>{
      this.clear();
    };
    deleteBtn.innerHTML = "Clear";
    cell.appendChild(deleteBtn);

    row = table.insertRow();
    cell = row.insertCell();
    let datalog = document.createElement('span')
    datalog.id = "datalog";
    cell.appendChild(datalog);

    this.outputLabel = document.createElement("span");
    this.outputLabel.innerHTML = "Select your outputs"
    this.outputLabel.style.display = "none";
    this.selectorContainer.appendChild(this.outputLabel);
    this.randomiseBtn = document.createElement("BUTTON");
    this.randomiseBtn.onclick = ()=>{
      this.randomise();
    };
    this.randomiseBtn.innerHTML = "Randomise";
    this.randomiseBtn.style.display = "none";
    this.selectorContainer.appendChild(this.randomiseBtn);

    this.guiParent = parent;

    this.updateRows();
  }

  addRegression(
      n,
      gui = true,
      workerUrl = "https://mimicproject.com/libs/regressionWorker.js"
      )
    {
    this.setWorker(workerUrl)
    this.classifier = false;
    this.numOutputs = n;
    this.gui = gui;
    if(gui)
    {
      let container = this.selectorContainer;
      this.randomiseBtn.style.display = "block";
      this.outputLabel.style.display = "block";
      for(let i = 0; i < n; i++)
      {
        let slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 1;
        slider.value = 0;
        slider.step = 0.01;
        this.outputGUI.push(slider);
        this.y.push(0);
        slider.onchange = ()=>{
          this.y[i] = parseFloat(slider.value);
          this.onOutput(this.y);
        }
        container.appendChild(slider);
      }
    }
  }

  addClassifier(
      n,
      gui = true,
      workerUrl = "https://mimicproject.com/libs/classificationWorker.js")
    {
    this.setWorker(workerUrl)
    this.classifier = true;
    this.numOutputs = 1;
    this.gui = gui;
    if(gui)
    {
      let container = this.selectorContainer;;
      var selectList = document.createElement("select");
      this.randomiseBtn.style.display = "none";
      selectList.id = "dropdown";
      this.y.push(0);
      selectList.onchange = ()=> {
        this.y[0] = parseInt(selectList.selectedIndex);
        this.onOutput(this.y)
      }
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
  }

  disableButtons(disable)
  {
    const run = document.getElementById("run-btn");
    const rec = document.getElementById("rec-btn");
    const train = document.getElementById("train-btn");
    run.disabled = rec.disabled = train.disabled = disable;
  }

  updateButtons() {
    const run = document.getElementById("run-btn");
    const rec = document.getElementById("rec-btn");
    run.innerHTML = this.running ? "Stop" : "Run"
    rec.innerHTML = this.recording ? "Stop" : "Record"
    if(this.onUpdateState)
    {
      this.onUpdateState();
    }
  }

  updateRows() {
    const datalog = document.getElementById("datalog");
    this.numRows().then((n)=>{
      const total = n + this.temp.length;
      datalog.innerHTML = "You have " + total + " saved examples";
    });
  }

  setCountIn(val) {
    this.countIn = val;
  }

  setRecordLimit(val) {
    this.recLimit = val;
  }

  newExample(input, y) {
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

  updateOutput(index, val)
  {
      if(this.gui)
      {
        this.outputGUI[index].value = val;
      }
      this.y[index] = val;
      if(this.onOutput)
      {
		this.onOutput(this.y)
      }
  }

  setWorker(url) {
    this.myWorker = this.createWorker(url);
    this.myWorker.onmessage = (event)=>{
      console.log(event.data);
      if(event.data == "trainingend")
      {
        this.disableButtons(false);
        this.run()
      }
      else if(this.onOutput)
      {
        for(let i = 0; i < this.numOutputs; i++)
        {
          if(this.gui)
          {
            this.outputGUI[i].value = event.data[i];
          }
          this.y[i] = event.data[i];
        }
        this.onOutput(this.y);
      }
    }
  }

  train() {
    if(!this.running && ! this.recording)
    {
      this.disableButtons(true);
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

  limitRecord() {
    let timeLeft = this.recLimit;
    const label = document.getElementById("countdown-span");
    this.stopInterval = setInterval(()=>{
      timeLeft -= 1;
      label.innerHTML = "stopping in " + timeLeft + " secs"
    }, 1000);
    this.stopTimeout = setTimeout(()=>{
      this.stopTimeout = null;
      this.record();
    }, this.countIn * 1000)
  }

  record() {
    if(this.stopInterval)
    {
      clearTimeout(this.stopTimeout);
      clearInterval(this.stopInterval);
      this.stopInterval = null;
      this.stopTimeout = null;
      const label = document.getElementById("countdown-span");
      label.innerHTML = "";
    }
    const doRun = ()=> {
      this.running = false;
      this.recording = !this.recording;
      if(!this.recording)
      {
        this.save();
      }
      else if(this.recLimit > 0)
      {
		this.limitRecord();
      }
      this.updateButtons();
      const run = document.getElementById("run-btn");
      run.disabled = true;
    }
    if(this.countIn > 0 && !this.recording)
    {
      let timeLeft = this.countIn;
      const label = document.getElementById("countdown-span");
      const rec = document.getElementById("rec-btn");
      rec.disabled = true;
      let interval = setInterval(()=>{
        timeLeft -= 1;
        label.innerHTML = "recording in " + timeLeft + " secs"
      }, 1000);
      setTimeout(()=>{
        clearInterval(interval);
        label.innerHTML = "";
        rec.disabled = false;
        doRun();
      }, this.countIn * 1000)
    }
    else
    {
      doRun();
    }
  }

  clear() {
    this.store.setItem(this.DATASET_KEY,[]).then(()=> {
		this.updateRows();
    });
  }

  randomise() {
    for(let i = 0; i < this.numOutputs; i++)
    {
	     this.updateOutput(i, Math.random());
    }
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
    this.updateRows();
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
      if(!this.store)
      {
        resolve(0);
      }
      else
      {
        this.store.getItem(this.DATASET_KEY).then((dataset)=> {
          if(dataset)
          {
            resolve(dataset.length);
          }
          else
          {
            resolve(0);
          }
        }).catch((err)=>{resolve(0)});
      }
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

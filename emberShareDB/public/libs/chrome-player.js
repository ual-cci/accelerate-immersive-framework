var ChromePlayer = function(context) {
  this.context = context
  console.log(context.state)
  const states = context.map((c)=>{return c.state})
  var isChrome = !!window.chrome;
  console.log(states.includes("suspended"), isChrome, states.includes("suspended") && isChrome)
  if(states.includes("suspended") && isChrome)
  {
    console.log("showing play button")
    const container = document.createElement('div')
    container.id = "cp-play-container"
    container.style['background-color'] = "rgba(50,50,50,0.75)"
    container.style.position = "absolute"
    container.style.top = 0
    container.style.left = 0
    container.style.width = "100%"
    container.style.height = "100%"
    console.log(document, container)
    document.body.appendChild(container)
    const btn = document.createElement("BUTTON")
    btn.id = "cp-play-btn"
    btn.innerHTML = "Play"
    btn.style.margin="auto"
    btn.style.width="100px"
    btn.style.height="50px"
    btn.style.position= "absolute"
    btn.style.top= 0
    btn.style.bottom= 0
    btn.style.left= 0
    btn.style.right= 0
    const lbl = document.createElement("p")
    lbl.innerHTML = "because Chrome"
    lbl.style.margin="auto"
    lbl.style.width="300px"
    lbl.style.height="50px"
    lbl.style.position= "absolute"
    lbl.style.top= "150px"
    lbl.style.bottom= 0
    lbl.style.left= 0
    lbl.style.right= 0
    lbl.style["text-align"] = "center";
    btn.onclick = ()=> {
      container.style.display = "none"
      this.context.forEach((c)=> {
        c.resume()
      })
      this.onPlay();
    }
    container.appendChild(btn)
    container.appendChild(lbl)
  }
}

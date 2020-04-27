class MIMICSamples {
  static keys = [
    "hihat1", "hihat2", "hihat3",
    "snare1", "snare2", "snare3",
    "kick1", "kick2", "kick3",
    "clap1",
  ]
  static url = (key)=> {
    if(MIMICSamples.keys.includes(key)) {
      return document.location.origin + "/samples/" + key + ".wav";
    }
    else {
      return "invalid key"
    }
  }
}

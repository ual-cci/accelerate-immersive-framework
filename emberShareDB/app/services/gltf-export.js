import { A } from '@ember/array'
import Service from '@ember/service'
import config from '../config/environment'
import safeEval from 'safe-eval'
import * as THREE from 'three'

export default Service.extend({
  items: A([1, 2, 3]),
  export(code) {
    const html = document.createElement('html')
    html.innerHTML = code
    const body = html.getElementsByTagName('body')[0]
    const script = `
    ${body.querySelector('script').innerHTML}
    if(onPost) onPost()
    `

    function postCallback() {
      console.log('finished!')
    }

    //const script = body.querySelector('script').innerHTML

    const scene = Function('onPost', script)
    console.log(scene(postCallback))
    //const insertBefore = '</body>'
    //const index = source.indexOf(insertBefore)
    //const insert = `
    //<script src = "${config.localOrigin}/libs/${this.get('library').url('GLTFExporter')}"></script>
    //<script  language="javascript" type="text/javascript">
    //var gltfExporter = new THREE.GLTFExporter();
    //gltfExporter.parse( input, function( result ) {

    //var output = JSON.stringify( result, null, 2 );
    //console.log( output );
    //downloadJSON( output, 'scene.gltf' );

    //}, options );
    //</script>
    //`
  },
})

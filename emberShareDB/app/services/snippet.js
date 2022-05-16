import Service from '@ember/service'
import { computed } from '@ember/object'

export default Service.extend({
  snippetsMap: computed(() => {
    return [
      {
        title: 'Export Scene as GLTF',
        id: 'exportGLTF',
        snip: `
          <script  language="javascript" type="text/javascript">
            function save(blob, filename) {
              const link = document.createElement('a')
              link.style.display = 'block'
              document.body.appendChild(link)

              console.log(blob)

              link.href = URL.createObjectURL(blob)
              link.download = filename
              link.click()

            }
            function saveString(text, filename) {
              save(new Blob([text], { type: 'text/plain' }), filename)
            }

            function exportGLTF() {
              const exporter = new GLTFExporter()
              const params = {
                trs: false,
                onlyVisible: true,
                truncateDrawRange: true,
                binary: false,
                maxTextureSize: 4096,
              }

              exporter.parse(
                scene,
                // called when the gltf has been generated
                function (gltf) {
                  const output = JSON.stringify(gltf, null, 2)
                  console.log(output)
                  saveString(output, 'scene.gltf')
                },
                // called when there is an error in the generation
                function (error) {
                  console.log('An error happened')
                },
                params
              )
            }
            exportGLTF()
          </script>
        `,
        position: 'before',
        marker: '</body>',
        libs: ['threejs'],
      },
      {
        title: 'A-Frame Basic Scene',
        snip: `
          <a-scene>
            <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9"></a-box>
            <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>
            <a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>
            <a-plane position="0 0 -4" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>
            <a-sky color="#ECECEC"></a-sky>
          </a-scene>
          `,
        position: 'before',
        marker: '</body>',
        libs: ['a-frame'],
      },
      {
        title: 'A-Frame Box',
        snip: '<a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9"></a-box>\n',
        position: 'before',
        marker: '</a-scene>',
        libs: ['a-frame'],
      },
      {
        title: 'A-Frame Sphere',
        snip: '<a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>\n',
        position: 'before',
        marker: '</a-scene>',
        libs: ['a-frame'],
      },
      {
        title: 'A-Frame Cylinder',
        snip: '<a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>\n',
        position: 'before',
        marker: '</a-scene>',
        libs: ['a-frame'],
      },
      {
        title: 'A-Frame Plane',
        snip: '<a-plane position="0 0 -4" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>\n',
        position: 'before',
        marker: '</a-scene>',
        libs: ['a-frame'],
      },
      {
        title: 'A-Frame Sky',
        snip: '<a-sky color="#ECECEC"></a-sky>\n',
        position: 'before',
        marker: '</a-scene>',
        libs: ['a-frame'],
      },
      {
        title: 'A-Frame GLB Model',
        snip: `
          <a-assets>
            <a-asset-item id="YOUR-ID" src="INSERT-NAME-OF-MODEL.glb"></a-asset-item>
          </a-assets>

          <a-entity gltf-model="#YOUR-ID"></a-entity>`,
        position: 'before',
        marker: '</a-scene>',
        libs: ['a-frame'],
      },
      {
        title: 'A-Frame Effect: Toon',
        snip: `\neffects="colors"\ncolors="mode:hqprtom; mul: 1 1 1; pow: 1 1.33 1.66; quant: 0.3 0.3 0.1; orig: 0.33 0.66 0.66"`,
        position: 'after',
        marker: '<a-scene',
        libs: ['a-frame', 'a-frame-effects'],
      },
    ]
  }),
})

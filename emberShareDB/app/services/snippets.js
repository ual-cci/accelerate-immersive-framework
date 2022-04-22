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
        marker: '</body>',
        position: 'before',
      },
    ]
  }),
})

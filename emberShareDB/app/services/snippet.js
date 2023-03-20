import Service from '@ember/service'
import { computed } from '@ember/object'
import { randRange, randomAframeAttr, randInt } from '../helpers/snippet-insert'
import { randomColor } from '../helpers/colors'
import config from '../config/environment'

export default Service.extend({
  snippetsMap: computed(() => {
    return [
      {
        title: 'Export Scene as GLTF',
        id: 'exportGLTF',
        fn: () => ({
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
        }),
      },
      {
        title: 'A-Frame Basic Scene',
        fn: () => ({
          type: 'scene',
          snip: `
          <a-scene>
            <a-box id="box_${randInt(4)}"
                   position="-1 0.5 -3"
                   rotation="0 45 0"
                   color="lightblue">
            </a-box>
            <a-sphere id="sphere_${randInt(4)}"
                      position="0 1.25 -5"
                      radius="1.25"
                      color="tomato">
            </a-sphere>
            <a-cylinder id="cylinder_${randInt(4)}"
                        position="1 0.75 -3"
                        radius="0.5"
                        height="1.5"
                        color="orange">
            </a-cylinder>
            <a-plane id="plane_${randInt(4)}"
                     position="0 0 -4"
                     rotation="-90 0 0"
                     width="4"
                     height="4"
                     color="teal">
            </a-plane>
            <a-sky id="sky_${randInt(4)}"
                   color="lightgrey">
            </a-sky>
          </a-scene>
          `,
          position: 'after',
          marker: '<body>',
          libs: ['a-frame'],
        }),
      },
      {
        title: 'A-Frame Empty Scene',
        fn: () => ({
          type: 'scene',
          snip: `
  <a-scene>
  </a-scene>`,
          position: 'after',
          marker: '<body>',
          libs: ['a-frame'],
        }),
      },
      {
        title: 'A-Frame Light: Basic Lighting',
        fn: ({
          ambientColor,
          directionalColor,
          directionalIntensity,
          shadow,
        }) => ({
          snip: `\n<a-entity id="ambient-light_${randInt(
            4
          )}" light="type: ambient; color: ${ambientColor}"></a-entity>
<a-entity id="directional-light" light="type: directional; color: ${directionalColor}; intensity: ${directionalIntensity}; castShadow: ${shadow}" position="-0.5 1 1"></a-entity>\n`,
          position: 'before',
          marker: '</a-scene>',
          libs: ['a-frame'],
        }),
        props: [
          {
            name: 'ambientColor',
            default: '#BBBBBB',
          },
          {
            name: 'directionalColor',
            default: '#FFFFFF',
          },
          {
            name: 'directionalIntensity',
            default: '0.6',
          },
          {
            name: 'shadow',
            default: 'true',
          },
        ],
        samples: [
          {
            name: () => 'random',
            ambientColor: () => randomColor(),
            directionalColor: () => randomColor(),
          },
        ],
      },
      {
        title: 'A-Frame Light: Ambient',
        fn: ({ color }) => ({
          snip: `\n<a-entity id="ambient-light_${randInt(
            4
          )}" light="type: ambient; color: ${color}"></a-entity>\n`,
          position: 'before',
          marker: '</a-scene>',
          libs: ['a-frame'],
        }),
        props: [
          {
            name: 'color',
            default: '#BBBBBB',
          },
        ],
        samples: [
          {
            name: () => 'random',
            color: () => randomColor(),
          },
        ],
      },
      {
        title: 'A-Frame Light: Directional',
        fn: ({ color, intensity, shadow, position }) => ({
          snip: `\n<a-entity id="directional-light_${randInt(
            4
          )}" light="type: directional; color: ${color}; intensity: ${intensity}; castShadow: ${shadow}" position="${position}"></a-entity>\n`,
          position: 'before',
          marker: '</a-scene>',
          libs: ['a-frame'],
        }),
        props: [
          {
            name: 'color',
            default: '#FFFFFF',
          },
          {
            name: 'intensity',
            default: '0.6',
          },
          {
            name: 'shadow',
            default: 'true',
          },
          {
            name: 'position',
            default: '-0.5 1 1',
          },
        ],
        samples: [
          {
            name: () => 'random',
            color: () => randomColor(),
            intensity: () => randRange(0, 1, 2),
            position: () => randomAframeAttr(-100, 100),
          },
        ],
      },

      {
        title: 'A-Frame Fog',
        fn: ({ color, type, near, far, density }) => ({
          snip: ` fog="type: ${type}; color: ${color}; near: ${near}; far: ${far}; density: ${density};"`,
          position: 'after',
          marker: '<a-scene',
          libs: ['a-frame'],
        }),
        props: [
          {
            name: 'color',
            default: 'lightgray',
          },
          {
            name: 'type',
            default: 'linear',
          },
          {
            name: 'near',
            default: '1',
          },
          {
            name: 'far',
            default: '20',
          },
          {
            name: 'density',
            default: '0.00025',
          },
        ],
        samples: [
          {
            name: () => 'random',
            color: () => randomColor(),
            near: () => randRange(1, 20),
            far: () => randRange(20, 1000),
            density: () => randRange(0, 0.05, 5),
          },
        ],
      },

      {
        title: 'A-Frame GLB Model',
        fn: ({ id, name, src, position, scale, rotation, shadow, body }) => ({
          type: 'asset',
          snip: `\n<a-entity id="${id}"
          gltf-model="#${name}"
          position="${position}"
          rotation="${rotation}"
          scale="${scale}"
          shadow="cast: ${shadow}"
          body="type:${body};"
          grabbable="physics:true;"
></a-entity>\n`,
          asset: { name, src },
          position: 'before',
          marker: '</a-scene>',
          libs: ['a-frame'],
        }),
        props: [
          {
            name: 'id',
            default: `glb_${randInt(4)}`,
          },
          {
            name: 'name',
            default: '',
          },
          {
            name: 'src',
            default: '',
          },
          {
            name: 'position',
            default: '0 0 0',
          },
          {
            name: 'scale',
            default: '1 1 1',
          },
          {
            name: 'rotation',
            default: '0 0 0',
          },
          {
            name: 'shadow',
            default: 'true',
          },
          {
            name: 'body',
            default: 'static',
          },
        ],
        samples: [
          {
            id: () => `fox_${randInt(4)}`,
            name: () => 'fox',
            src: () => `${config.localOrigin}/libs/a-game/fox.glb`,
            position: () => '0 1 -3',
            scale: () => '3 3 3',
          },
          {
            id: () => `rabbit_${randInt(4)}`,
            name: () => 'rabbit',
            src: () => `${config.localOrigin}/libs/a-game/rabbit.glb`,
            position: () => '0 0.5 -3',
            scale: () => '0.08 0.08 0.08',
          },
          {
            id: () => `tree_${randInt(4)}`,
            name: () => 'tree',
            src: () => `${config.localOrigin}/libs/a-game/tree.glb`,
            position: () => '0 0 -3',
            scale: () => '0.8 0.8 0.8',
          },
        ],
      },

      /*
       * Effects do not work with A-Frame 1.3.0 and it doesn't look like there is much work
       * happening on the A-Frame Effects repo.. I've played around a little bit seeing if
       * I could get a few of the functions working which were throwing errors, but other
       * problems occur which don't seem lilke quick fixes.
       * See: https://github.com/wizgrav/aframe-effects/issues/21
       */
      /*
      {
        title: 'A-Frame Effect: Toon',
        fn: () => ({
          type: 'effect',
          name: 'colors',
          effect:
            'colors="mode:hqprtom; mul: 1 1 1; pow: 1 1.33 1.66; quant: 0.3 0.3 0.1; orig: 0.33 0.66 0.66"',
          position: 'after',
          marker: '<a-scene',
          libs: ['a-frame', 'a-frame-effects'],
        }),
      },
      {
        title: 'A-Frame Effect: Bloom',
        fn: ({ strength, radius }) => ({
          type: 'effect',
          name: 'bloom',
          effect: `bloom="filter: bloom.filter; strength: ${strength}; radius: ${radius}"`,
          position: 'after',
          marker: '<a-scene',
          libs: ['a-frame', 'a-frame-effects'],
        }),
        props: [
          {
            name: 'strength',
            default: '0.3',
          },
          {
            name: 'radius',
            default: '1.0',
          },
        ],
      },
      {
        title: 'A-Frame Effect: God Rays',
        fn: ({ source, threshold, intensity }) => ({
          type: 'effect',
          name: 'godrays',
          effect: `godrays="src: #${source}; threshold: ${threshold}; intensity: ${intensity}"`,
          position: 'after',
          marker: '<a-scene',
          libs: ['a-frame', 'a-frame-effects'],
        }),
        props: [
          {
            name: 'source',
            default: '',
          },
          {
            name: 'threshold',
            default: '0 0.33',
          },
          {
            name: 'intensity',
            default: '2',
          },
        ],
      }, */

      {
        title: 'A-Frame Box',
        fn: ({
          id,
          position,
          color,
          width,
          height,
          depth,
          rotation,
          body,
          floor,
        }) => ({
          snip: `\n<a-box id="${id}"
position="${position}"
rotation="${rotation}"
color="${color}"
width="${width}"
height="${height}"
depth="${depth}"
body="type:${body};"
grabbable="physics:true;"
shadow="receive: true;"
${floor === 'true' ? 'floor' : ''}></a-box>\n`,
          position: 'before',
          marker: '</a-scene>',
          libs: ['a-frame'],
        }),
        props: [
          {
            name: 'id',
            default: `box_${randInt(4)}`,
          },
          {
            name: 'position',
            default: '0 1 -3',
          },
          {
            name: 'rotation',
            default: '0 0 0',
          },
          {
            name: 'width',
            default: '1',
          },
          {
            name: 'height',
            default: '1',
          },
          {
            name: 'depth',
            default: '1',
          },
          {
            name: 'color',
            default: 'red',
          },
          {
            name: 'body',
            default: 'static',
          },
          {
            name: 'floor',
            default: 'false',
          },
        ],
        samples: [
          {
            id: () => `box_${randInt(4)}`,
            name: () => 'random',
            position: () => randomAframeAttr(-10, 10),
            rotation: () => randomAframeAttr(0, 360),
            width: () => randRange(1, 10),
            height: () => randRange(1, 10),
            depth: () => randRange(1, 10),
            color: () => randomColor(),
          },
        ],
      },
      {
        title: 'A-Frame Sphere',
        fn: ({ id, position, color, radius, body, shadow }) => ({
          snip: `\n<a-sphere id="${id}"
position="${position}"
radius="${radius}"
color="${color}"
body="type:${body};"
shadow="cast: ${shadow};"
grabbable="physics:true;"></a-sphere>\n`,
          position: 'before',
          marker: '</a-scene>',
          libs: ['a-frame'],
        }),
        props: [
          {
            name: 'id',
            default: `sphere_${randInt(4)}`,
          },
          {
            name: 'position',
            default: '0 0 0',
          },
          {
            name: 'radius',
            default: '1',
          },
          {
            name: 'color',
            default: 'tomato',
          },
          {
            name: 'body',
            default: 'static',
          },
          {
            name: 'shadow',
            default: 'true',
          },
        ],
        samples: [
          {
            id: () => `sphere_${randInt(4)}`,
            name: () => 'random',
            position: () => randomAframeAttr(-10, 10),
            radius: () => randRange(1, 10),
            color: () => randomColor(),
          },
        ],
      },

      {
        title: 'A-Frame Cylinder',
        fn: ({
          id,
          position,
          color,
          radius,
          rotation,
          height,
          body,
          shadow,
        }) => ({
          snip: `\n<a-cylinder id="${id}"
position="${position}"
radius="${radius}"
height="${height}"
color="${color}"
rotation="${rotation}"
body="type:${body};"
shadow="cast: ${shadow};"
grabbable="physics:true;"></a-cylinder>\n`,
          position: 'before',
          marker: '</a-scene>',
          libs: ['a-frame'],
        }),
        props: [
          {
            name: 'id',
            default: `cylinder_${randInt(4)}`,
          },
          {
            name: 'position',
            default: '0 1.25 -3',
          },
          {
            name: 'radius',
            default: '1',
          },
          {
            name: 'height',
            default: '1.5',
          },
          {
            name: 'rotation',
            default: '0 0 0',
          },
          {
            name: 'color',
            default: 'orange',
          },
          {
            name: 'shadow',
            default: 'true',
          },
          {
            name: 'body',
            default: 'static',
          },
        ],
        samples: [
          {
            id: () => `cylinder_${randInt(4)}`,
            name: () => 'random',
            position: () => randomAframeAttr(-10, 10),
            rotation: () => randomAframeAttr(0, 360),
            radius: () => randRange(1, 10),
            height: () => randRange(0.4, 10, 1),
            color: () => randomColor(),
          },
        ],
      },
      {
        title: 'A-Frame Plane',
        fn: ({ id, position, color, rotation, height, width, shadow }) => ({
          snip: `\n<a-plane id="${id}"
position="${position}"
rotation="${rotation}"
height="${height}"
width="${width}"
color="${color}"
shadow="receive: ${shadow}"
></a-plane>\n`,
          position: 'before',
          marker: '</a-scene>',
          libs: ['a-frame'],
        }),
        props: [
          {
            name: 'id',
            default: `plane_${randInt(4)}`,
          },
          {
            name: 'position',
            default: '0 0 -4',
          },
          {
            name: 'rotation',
            default: '-90 0 0',
          },
          {
            name: 'height',
            default: '4',
          },
          {
            name: 'width',
            default: '4',
          },
          {
            name: 'color',
            default: 'teal',
          },
          {
            name: 'shadow',
            default: 'true',
          },
        ],
      },

      {
        title: 'A-Frame Sky',
        fn: ({ id, color }) => ({
          snip: `\n<a-sky id="${id}" color="${color}"></a-sky>\n`,
          position: 'before',
          marker: '</a-scene>',
          libs: ['a-frame'],
        }),
        props: [
          {
            name: 'id',
            default: `sky_${randInt(4)}`,
          },
          {
            name: 'color',
            default: 'lightgrey',
          },
        ],
        samples: [
          {
            id: () => `sky_${randInt(4)}`,
            name: () => 'random',
            color: () => randomColor(),
          },
        ],
      },
      /* {
        title: 'THROW ERROR',
        fn: () => ({
          // Will throw as does not contain a snip fn
          position: () => randomAframeAttr(-10, 10),
        }),
      }, */
    ]
  }),
})

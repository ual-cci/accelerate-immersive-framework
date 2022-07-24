import Service from '@ember/service'
import config from '../config/environment'

// TODO: Rename to something better
export default Service.extend({
  init() {
    window.addEventListener('message', (e) => console.log(e))
  },
  receiveMessage(e) {
    if (!e.origin === config.localOrigin) return

    const { data } = e

    if (!typeof data === 'string') return

    /* TODO: Run this.updateFile
     * updateFile should produce a series of ops to send back to the parser
     * or maybe one big op which replaces the entire file.
     */
  },
  updateFile(source, changes) {
    // Matches any character including line breaks.
    const element = '(<a-[\\w]+)'
    const filler = '([^]*?)'
    const whitespace = '[\\s\\n]'
    const propertyDelimit = '["\\s;]'

    Object.keys(changes).forEach((id) => {
      // Scan for ID in file.
      const regex = new RegExp(
        `${element}${filler}(${whitespace})id="${id}"${filler}>`
      )
      const match = regex.exec(source)
      if (!match) {
        return
      }

      // Might match unwanted parent entities, filter out.
      const entitySplit = match[0].split('<a-')
      let entityString = '<a-' + entitySplit[entitySplit.length - 1]
      const originalEntityString = entityString

      // Post-process regex to get only last occurence.
      const idWhitespaceMatch = match[3]

      // Scan for components within entity.
      Object.keys(changes[id]).forEach((attribute) => {
        // Check if component is defined already.
        const attributeRegex = new RegExp(
          `(${whitespace})${attribute}="(.*?)(;?)"`
        )
        const attributeMatch = attributeRegex.exec(entityString)
        const value = changes[id][attribute]

        if (typeof value === 'string') {
          // Single-property attribute match (e.g., position, rotation, scale).
          if (attributeMatch) {
            const whitespaceMatch = attributeMatch[1]
            // Modify.
            entityString = entityString.replace(
              new RegExp(`${whitespaceMatch}${attribute}=".*?"`),
              `${whitespaceMatch}${attribute}="${value}"`
            )
          } else {
            // Add.
            entityString = entityString.replace(
              new RegExp(`${idWhitespaceMatch}id="${id}"`),
              `${idWhitespaceMatch}id="${id}" ${attribute}="${value}"`
            )
          }
        } else {
          // Multi-property attribute match (e.g., material).
          Object.keys(value).forEach((property) => {
            const attributeMatch = attributeRegex.exec(entityString)
            const propertyValue = value[property]

            if (attributeMatch) {
              // Modify attribute.
              let attributeString = attributeMatch[0]
              const whitespaceMatch = attributeMatch[1]
              const propertyRegex = new RegExp(
                `(${propertyDelimit})${property}:(.*?)([";])`
              )
              propertyMatch = propertyRegex.exec(attributeMatch)

              if (propertyMatch) {
                // Modify property.
                const propertyDelimitMatch = propertyMatch[1]
                attributeString = attributeString.replace(
                  new RegExp(`${propertyDelimitMatch}${property}:(.*?)([";])`),
                  `${propertyDelimitMatch}${property}: ${propertyValue}${propertyMatch[3]}`
                )
              } else {
                // Add property to existing.
                attributeString = attributeString.replace(
                  new RegExp(`${whitespaceMatch}${attribute}="(.*?)(;?)"`),
                  `${whitespaceMatch}${attribute}="${attributeMatch[2]}${attributeMatch[3]}; ${property}: ${propertyValue}"`
                )
              }

              // Update entity string with updated component.
              entityString = entityString.replace(
                attributeMatch[0],
                attributeString
              )
            } else {
              // Add component entirely.
              entityString = entityString.replace(
                new RegExp(`${idWhitespaceMatch}id="${id}"`),
                `${idWhitespaceMatch}id="${id}" ${attribute}="${property}: ${propertyValue}"`
              )
            }
          })
        }

        console.log(`Updated ${attribute} of #${id}.`)
      })

      // Splice in updated entity string into file source.
      source = source.replace(originalEntityString, entityString)
    })

    return source
  },
})

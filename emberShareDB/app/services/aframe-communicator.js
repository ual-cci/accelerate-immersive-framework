import Service from '@ember/service'

// TODO: Rename to something better
export default Service.extend({
  updateFile(source, changes, errorHandler) {
    // Matches any character including line breaks.
    const element = '(<a-[\\w]+)'
    const filler = '([^]*?)'
    const whitespace = '[\\s\\n]'
    const propertyDelimit = '["\\s;]'
    /* const closing = '[\\w]+>' */

    Object.keys(changes).forEach((id) => {
      // Scan for ID in file.
      const regex = new RegExp(
        `${element}${filler}(${whitespace})id="${id}"${filler}>`
      )
      const match = regex.exec(source)
      if (!match) {
        // If no ID, throw error for the error bar
        // TODO: Better handling for error amongst multiple object changes (eg. 1 ID missing)
        const msg = ['Make sure the objects you are editing have an ID!',
          'Could not apply changes:',
          JSON.stringify(changes, null, 2)].join('\n')
        errorHandler(msg)
        return
      }

      // Might match unwanted parent entities, filter out.
      const entitySplit = match[0].split('<a-')
      let entityString = '<a-' + entitySplit[entitySplit.length - 1]
      const originalEntityString = entityString

      if(changes[id].remove === true) {
        const nameReg = new RegExp(element)
        const name = nameReg.exec(originalEntityString)
        const closing = name[0].replace('<', '</') + '>'

        source = source.replace(originalEntityString + closing, '')
      }

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
              const propertyMatch = propertyRegex.exec(attributeMatch)

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

import { helper } from '@ember/component/helper'

function runFn([fn]) {
  return fn()
}

export default helper(runFn)

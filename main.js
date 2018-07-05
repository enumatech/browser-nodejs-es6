import * as App from './app.js'
console.log(App.greeting('ES6'))

import BigNumber from './bignumber.js'
const sum = App.preciseAdd(BigNumber('1.1'), BigNumber('1.3')).toString()
console.log('Precise:', sum, ', JS: ', 1.1 + 1.3)

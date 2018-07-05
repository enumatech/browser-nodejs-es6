# Share ES6 modules between the browser and Node.js

This repo contains the complete example discussed by the related
[Enuma blog post]().

ECMAScript module support is [available](https://caniuse.com/#search=module)
in all major browsers, since May 9, 2018, when Firefox has also officially
enabled the feature, by default for the public.

This prompted us to revisit the answer to a few questions, in the hope of
reducing the dependencies and complexity in our JavaScript development tooling.

> Q1. Can we run browser-independent application-logic code
> both in Node.js and the browsers?

The answer to this question for a long time was, *yes*, BUT you had to use some
source code transformation tool, like [Webpack](https://webpack.js.org).

So here is a more refined question:

> Q2. Can we write isomorphic application-logic code without any module
> boilerplate, like [UMD](https://github.com/umdjs/umd) preambles
> and without using any bundlers?

Before we get into the answer, let's make sure you can run the examples.

## Setup

To ensure the same environment on every user's machine we recommend
[installing](https://nixos.org/nix/) the Nix package manager
(or even just use [NixOS](https://nixos.org) for development).

Assuming Nix is available, you can just start `nix-shell` in this repo.
It will download the necessary dependencies, like Node.js and the
[pnpm](https://pnpm.js.org) node package manager under `/nix/store`.
This ensures there is no interference with any other software on your system.
Then it starts a new shell process with such a `PATH` environment variable
which points inside the `/nix/store`, exposing the commands provided by
the packages declared in the `shell.nix` file.

Now you should be able to run `node` and `pnpm` for example.
That's how I've initialized this repo by running `pnpm init --yes`.
I don't have any Node.js available by default.

## Application logic

Let's assume we have some super simple application-logic, which just creates a
greeting message.

Put it into an `app.js`:

```
function greeting(name) { return `Hello, ${name}` }
```



### Browser

To use it from a browser, we need a HTML page hosting the app.
Let's call it `index.html`:

```html
<script src="app.js"></script>
```

Check if it works, by `open index.html`, then type `greeting('World')` in the
JavaScript console. It should return "Hello, World".



### Node.js

How can we use the `app.js` from `node`?

It doesn't start or use our application logic in any way, just defines it.

We can try to `require` it with the `-r` option, then evaluate an expression
which uses it:

```
⋊> node -r app.js -e "greeting('World')"
module.js:549
    throw err;
    ^

Error: Cannot find module 'app.js'
    at Function.Module._resolveFilename (module.js:547:15)
    at Function.Module._load (module.js:474:25)
    at Module.require (module.js:596:17)
    at Function.Module._preloadModules (module.js:753:12)
    at preloadModules (bootstrap_node.js:475:38)
    at startup (bootstrap_node.js:162:9)
    at bootstrap_node.js:612:3
```

Node.js tries to load the npm module called `app.js` but it can not find it
under the `node_modules` directory. We have to reference it via an explicit
relative path:

```
⋊> node -r ./app.js -e "greeting('World')"
[eval]:1
greeting('World')
^

ReferenceError: greeting is not defined
    at [eval]:1:1
    at ContextifyScript.Script.runInThisContext (vm.js:50:33)
    at Object.runInThisContext (vm.js:139:38)
    at Object.<anonymous> ([eval]-wrapper:6:22)
    at Module._compile (module.js:652:30)
    at evalScript (bootstrap_node.js:466:27)
    at startup (bootstrap_node.js:167:9)
    at bootstrap_node.js:612:3

```

Better, but unlike in a browser, the defined function is not available in the
global namespace immediately.

Node.js expects a [CommonJS](https://nodejs.org/docs/latest/api/modules.html)
module by default. (It's almost the same as the
[CommonJS](https://en.wikipedia.org/wiki/CommonJS) standard, with slight
differences).

It also assumes that when we use such a module, we load it with the `require`
function which returns a module object, which contains our greeting function.

So this works:

```
⋊> cat app.js
module.exports.greeting = function greeting(name) { return `Hello, ${name}` }

⋊> node -pe "require('./app.js').greeting('World')"
Hello, World
```

but now we get an error in the browser:

```
app.js:1 Uncaught ReferenceError: module is not defined
```



### ES6 in the browser

Now let's try the ES6 module format instead.

Syntax is documented here:
https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export

Check out the See also section at the bottom! It links to this great visual
article:
https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/

There is an important difference with ES6 modules: They are loaded
asynchronously, so you can't rely on the order of your script tags
to encode dependencies amongst your modules!

You also have to prepare the browser to receive an ES6 module, so your
script tag in `index.html` now looks like this:

```html
<script type="module" src="app.js"></script>
```

and `app.js` becomes:

```js
export function greeting(name) { return `Hello, ${name}` }
```

We get an error though in the browser console:

```
Access to Script at 'file:///Users/xxx/.../browser-nodejs-es6/app.js' from origin 'null' has been blocked by CORS policy: Invalid response. Origin 'null' is therefore not allowed access.
```

which means we must access our web app via http:// or https:// .

There is a great, self-contained, zero-config webserver called
[caddy](https://caddyserver.com/), which we can just declare as
a dependency in our `shell.nix` and restart our `nix-shell`, then
run `caddy`:

```
⋊> nix-shell
these paths will be fetched (6.01 MiB download, 34.12 MiB unpacked):
  /nix/store/canw340mmxhpp6gkwjcz5niidhsw1rki-caddy-0.10.12-bin
  /nix/store/cmwli8x3dgmhmv1vh1qms8d6rg99isai-caddy-0.10.12
copying path '/nix/store/canw340mmxhpp6gkwjcz5niidhsw1rki-caddy-0.10.12-bin' from 'https://cache.nixos.org'...
copying path '/nix/store/cmwli8x3dgmhmv1vh1qms8d6rg99isai-caddy-0.10.12' from 'https://cache.nixos.org'...

⋊> caddy
Activating privacy features... done.
http://:2015
```

Then just `open http://localhost:2015/` and we should be able to
evaluate `greeting('World')` again, right? Nope:

```
> Uncaught ReferenceError: greeting is not defined
    at <anonymous>:1:1
```

what if we try to `import` our app as described in the
[documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)?

```
> import * as App from './app.js'
Uncaught SyntaxError: Unexpected identifier
```

`import` can't be used interactively :(

Let's define a `main.js` module, which loads our app and
exercises it too!

```
import * as App from './app.js'

console.log(App.greeting('ES6'))
```

After updating `index.html` to

```
<script type="module" src="main.js"></script>
```

and reloading it, the console will indeed show:

```
main.js:3 Hello, ES6
```



### ES6 in Node.js

You might have read that Node.js supports ES6 modules too for quite a while, but
it had to be enabled with the `--experimental-modules` flag and such modules
should have the `.mjs` extension as documented here:
https://nodejs.org/api/esm.html

Let's try it, but to ensure we are working with the same code in the browser
and in Node.js, let's create a link:


```
⋊> ln -s main.js main.mjs
⋊> node --experimental-modules main.mjs
/Users/xxx/.../browser-nodejs-es6/main.js:1
(function (exports, require, module, __filename, __dirname) { import * as App from './app.js'
                                                              ^^^^^^

SyntaxError: Unexpected token import
    at createScript (vm.js:80:10)
    at Object.runInThisContext (vm.js:139:10)
    at Module._compile (module.js:616:28)
    at Object.Module._extensions..js (module.js:663:10)
    at Module.load (module.js:565:32)
    at tryModuleLoad (module.js:505:12)
    at Function.Module._load (module.js:497:3)
    at Function.Module.runMain (module.js:693:10)
    at startup (bootstrap_node.js:191:16)
    at bootstrap_node.js:612:3
```

It doesn't even recognize the `import` statement. Wat?

Upon close inspection we can spot that it is trying to load the `main.js`,
so it thinks it's not an ES6 module... Let's swap the link direction then:

```
⋊> rm main.mjs
⋊> mv main.js main.mjs
⋊> ln -s main.mjs main.js
⋊> node --experimental-modules main.mjs
(node:80138) ExperimentalWarning: The ESM module loader is experimental.
/Users/onetom/github.com/enumatech/browser-nodejs-es6/app.js:1
(function (exports, require, module, __filename, __dirname) { export function greeting(name) { return `Hello, ${name}` }
                                                              ^^^^^^

SyntaxError: Unexpected token export
    at createScript (vm.js:80:10)
...
```

Now the `export` directive in `app.js` is problematic, because it thinks
it's a CommonJS module. It still works in the browser, though.

If we would try to use the `.mjs` files from the browser. we would get
a different error:

```
Failed to load module script: The server responded with a non-JavaScript MIME type of "text/plain". Strict MIME type checking is enforced for module scripts per HTML spec.
```

which we can of course get around by configuring our webserver, but
since we can not always configure our server, it's not really  a
viable direction.



### `esm` to the rescue

Let's have a look at https://github.com/standard-things/esm and implement it!

```
⋊> pnpm i esm
Packages: +1
+
Resolving: total 1, reused 0, downloaded 1, done
dependencies:
+ esm 3.0.62

⋊> node -r esm main.js
Hello, ES6
```

Tadaaa! We are done, problem solved, right? Well... almost.



# References:

* https://medium.com/web-on-the-edge/tomorrows-es-modules-today-c53d29ac448c
* https://medium.com/@giltayar/native-es-modules-in-nodejs-status-and-future-directions-part-i-ee5ea3001f71

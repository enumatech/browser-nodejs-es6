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

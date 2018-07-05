# Share ES6 modules between the browser and Node.js

This repo contains the complete example discussed by the related
[Enuma blog post]().

ECMAScript module support is [available](https://caniuse.com/#search=module)
in all major browsers, since May 9, 2018, when Firefox has also officially
enabled the feature, by default for the public.

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

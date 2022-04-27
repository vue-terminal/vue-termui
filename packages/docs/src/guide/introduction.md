# Introduction

## What are Terminal Applications?

Terminal applications are programs running within a terminal that expose a text-based interface where the user can interact with the application. An example of a terminal app is [`htop`](https://htop.dev/). Differently to CLIs, Terminal Application are supposed to show some level of UI complexity.

## When should I use Vue TermUI?

Vue TermUI allows you to build applications using Vue.js, Flexbox, and a syntax similar to HTML. It gives you the power of declarative rendering and Hot Module Replacement (with Vite) to design complex applications like the ones you could deploy to a webpage and make them live **within a terminal**.

## When should I **not** use Vue TermUI?

This is of course subjective and no one will stop you from building what you want with Vue TermUI, but Vue TermUI is not meant as a replacement of existing tools like:

- [enquirer](https://github.com/termapps/enquirer): Create Interactive Prompts in the terminal
- [Draftlog](https://github.com/ivanseidel/node-draftlog): Creates mutable log (can be updated later)

While using Vue TermUI is probably more fun and easier to use, these already hold specific tools to specific problems. Vue TermUI is more powerful thanks to a more abstract API. For example, it will require more work to build interactive prompts.

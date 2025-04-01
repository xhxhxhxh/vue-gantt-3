# Installation

## Using Package Manager

**We recommend using the package manager (NPM, [Yarn](https://classic.yarnpkg.com/lang/en/), [pnpm](https://pnpm.io/)) to install vue-gantt-3**,
so that you can utilize bundlers like [Vite](https://vitejs.dev) and
[webpack](https://webpack.js.org/).

Choose a package manager you like.

::: code-group

```shell [npm]
$ npm install vue-gantt-3 --save
```

```shell [yarn]
$ yarn add vue-gantt-3
```

```shell [pnpm]
$ pnpm install vue-gantt-3
```

:::

## Import in Browser

Import vue-gantt-3 through browser HTML tags directly, and use global variable `VueGantt3`.

According to different CDN providers, there are different introduction methods.
Here we use [unpkg](https://unpkg.com) and [jsDelivr](https://jsdelivr.com) as example.
You can also use other CDN providers.

### unpkg

```html
<head>
  <link rel="stylesheet" href="//unpkg.com/vue-gantt-3/dist/vue-gantt-3.css" />
  <script src="//unpkg.com/vue@3"></script>
  <script src="//unpkg.com/vue-gantt-3"></script>
</head>
```

### jsDelivr

```html
<head>
  <link
    rel="stylesheet"
    href="//cdn.jsdelivr.net/npm/vue-gantt-3/dist/vue-gantt-3.css"
  />
  <script src="//cdn.jsdelivr.net/npm/vue@3"></script>
  <script src="//cdn.jsdelivr.net/npm/vue-gantt-3"></script>
</head>
```
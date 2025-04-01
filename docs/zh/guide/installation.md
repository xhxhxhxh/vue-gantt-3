# 安装

## 使用包管理器

**我们建议您使用包管理器 (如NPM, [Yarn](https://classic.yarnpkg.com/lang/en/)或[pnpm](https://pnpm.io/))安装vue-gantt-3**,
然后您就可以使用打包工具，例如 [Vite](https://vitejs.dev) 或
[webpack](https://webpack.js.org/)。

选择一个你喜欢的包管理器。

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

## 浏览器直接引入

直接通过浏览器的 HTML 标签导入 vue-gantt-3, 然后就可以使用全局变量 `VueGantt3`了。

根据不同的 CDN 提供商有不同的引入方式， 我们在这里以 [unpkg](https://unpkg.com) 和 [jsDelivr](https://jsdelivr.com) 举例。
你也可以使用其它的 CDN 供应商。

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
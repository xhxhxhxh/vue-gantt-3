
export const getRound = (floatNum: number, num = 3) => {
  return parseFloat(floatNum.toFixed(num));
};

/**
 * 遍历树结构，fn一旦返回false就会停止遍历
 * @param {Array} tree 树结构
 * @param {Function} fn 对每个节点执行一遍fn方法,如果return false就会停止遍历
 * @param {String} childrenKey  作为children的键
 * @param parent
 *
 */
export function treeForEachSkipChildren<T>(
  tree:T[],
  fn:(node:T, parent?:T|undefined) => boolean|void|'skipChildren',
  childrenKey = 'children',
  parent?:T
) {
  let size = tree.length;
  for (let i = 0; i < size; i++) {
    const curNode = tree[i];
    const res = fn(curNode, parent);
    if (res === false) return false;
    if (res === 'skipChildren') continue;

    const children = (curNode as any)?.[childrenKey];
    if (children?.length) {
      if (treeForEachSkipChildren(children, fn, childrenKey, curNode) === false) {
        return false;
      }
    }

  }
}

/**
 * 遍历树结构，fn一旦返回false就会停止遍历
 * @param {Array} tree 树结构
 * @param {Function} fn 对每个节点执行一遍fn方法,如果return false就会停止遍历
 * @param {String} childrenKey  作为children的键
 * @param parent
 *
 */
export function treeForEach<T>(
  tree:T[],
  fn:(node:T, parent?:T|undefined) => boolean|void,
  childrenKey = 'children',
  parent?:T
) {
  let size = tree.length;
  for (let i = 0; i < size; i++) {
    const curNode = tree[i];
    if (fn(curNode, parent) === false) return false;
    const children = (curNode as any)?.[childrenKey];
    if (children?.length) {
      if (treeForEach(children, fn, childrenKey, curNode) === false) {
        return false;
      }
    }

  }
}

// 等待 单位秒
export const sleep = (s = 0) => new Promise(r => setTimeout(r, s * 1000));
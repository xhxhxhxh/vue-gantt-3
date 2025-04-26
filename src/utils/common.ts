
export const getRound = (floatNum: number, num = 3) => {
  return parseFloat(floatNum.toFixed(num));
};

/**
 * Traversing the tree, function will stop traversing once it returns false
 * @param {Array} tree
 * @param {Function} fn
 * @param {String} childrenKey
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
 * Traversing the tree, function will stop traversing once it returns false
 * @param {Array} tree
 * @param {Function} fn
 * @param {String} childrenKey
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

export const sleep = (s = 0) => new Promise(r => setTimeout(r, s * 1000));

export const toMap = <K=string, V=any>(items: Array<V> | Set<V>, idKey = 'id'): Map<K, V> => {
  const map = new Map<K, V>();
  for (let it of items) {
    map.set(it[idKey], it);
  }
  return map;
};

export const arrangementArr = <T>(source: T[], target: T[], idKey = 'id') => {
  const targetIds = target.map(item => item[idKey] as string);
  const arr = new Array<T>(source.length);
  const indexMap = new Map<string, number>();

  targetIds.forEach((id, index) => {
    indexMap.set(id, index);
  });

  const unMatchArr = source.filter((item) => {
    const id = item[idKey] as string;
    if (indexMap.has(id)) {
      let index = indexMap.get(id) as number;
      arr[index] = item;
    }
    return !indexMap.has(id);
  });

  if (unMatchArr.length > 0) {
    let index = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === undefined) {
        arr[i] = unMatchArr[index++];
      }
      if (index >= unMatchArr.length) {
        break;
      }
    }
  }
  return arr.filter<T>(item => item !== undefined);
};
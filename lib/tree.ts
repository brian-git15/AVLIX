export interface TreeNode {
  id: string;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

export function createNode(value: number): TreeNode {
  return { id: `n-${value}`, value, left: null, right: null };
}

export function bstInsert(root: TreeNode | null, value: number): TreeNode {
  if (!root) return createNode(value);
  if (value < root.value) {
    root.left = bstInsert(root.left, value);
  } else if (value > root.value) {
    root.right = bstInsert(root.right, value);
  }
  return root;
}

export function inOrderTraversal(node: TreeNode | null): number[] {
  const out: number[] = [];
  const walk = (n: TreeNode | null) => {
    if (!n) return;
    walk(n.left);
    out.push(n.value);
    walk(n.right);
  };
  walk(node);
  return out;
}

/** Height of the empty tree is -1; a leaf has height 0. */
export function height(node: TreeNode | null): number {
  if (!node) return -1;
  return 1 + Math.max(height(node.left), height(node.right));
}

export function treeSize(node: TreeNode | null): number {
  if (!node) return 0;
  return 1 + treeSize(node.left) + treeSize(node.right);
}

/**
 * Strict AVL: every node has |height(left) - height(right)| <= 1
 * and both subtrees are AVL-balanced.
 */
export function isBalanced(node: TreeNode | null): boolean {
  const check = (n: TreeNode | null): number | null => {
    if (!n) return -1;
    const lh = check(n.left);
    if (lh === null) return null;
    const rh = check(n.right);
    if (rh === null) return null;
    if (Math.abs(lh - rh) > 1) return null;
    return 1 + Math.max(lh, rh);
  };
  return check(node) !== null;
}

/** Balance factor = height(left) - height(right). */
export function balanceFactors(node: TreeNode | null): Map<string, number> {
  const map = new Map<string, number>();
  const walk = (n: TreeNode | null): number => {
    if (!n) return -1;
    const lh = walk(n.left);
    const rh = walk(n.right);
    map.set(n.id, lh - rh);
    return 1 + Math.max(lh, rh);
  };
  walk(node);
  return map;
}

export function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

export function collectNodes(node: TreeNode | null): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (n: TreeNode | null) => {
    if (!n) return;
    out.push(n);
    walk(n.left);
    walk(n.right);
  };
  walk(node);
  return out;
}

export type NodeSide = "left" | "right";

export function locateNode(
  root: TreeNode,
  id: string,
): {
  node: TreeNode;
  parent: TreeNode | null;
  side: NodeSide | null;
} | null {
  if (root.id === id) {
    return { node: root, parent: null, side: null };
  }
  const walk = (
    parent: TreeNode,
  ): { node: TreeNode; parent: TreeNode; side: NodeSide } | null => {
    if (parent.left?.id === id) {
      return { node: parent.left, parent, side: "left" };
    }
    if (parent.right?.id === id) {
      return { node: parent.right, parent, side: "right" };
    }
    if (parent.left) {
      const found = walk(parent.left);
      if (found) return found;
    }
    if (parent.right) {
      const found = walk(parent.right);
      if (found) return found;
    }
    return null;
  };
  return walk(root);
}

export function expectedInOrder(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

export function assertInOrderUnchanged(root: TreeNode): void {
  const n = treeSize(root);
  const order = inOrderTraversal(root);
  console.assert(
    order.length === n && order.every((v, i) => v === i + 1),
    "in-order invariant broken",
    order,
  );
}

export function structureOf(node: TreeNode | null): unknown {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: structureOf(node.left),
    right: structureOf(node.right),
  };
}

/** Recursively insert the midpoint of [lo, hi] so the tree is height-balanced. */
export function buildBalancedBst(n: number): TreeNode {
  const build = (lo: number, hi: number): TreeNode | null => {
    if (lo > hi) return null;
    const mid = Math.floor((lo + hi) / 2);
    const node = createNode(mid);
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  };
  const root = build(1, n);
  if (!root) throw new Error("n must be at least 1");
  return root;
}

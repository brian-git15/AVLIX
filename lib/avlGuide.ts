import type { Move, RotationType } from "./rotations";
import { rotationLabel } from "./rotations";
import { balanceFactors, type TreeNode } from "./tree";

/** Named by the rotation(s) you perform — not LL/RR shape shorthand. */
export type AvlFixKind = "left" | "right" | "left-right" | "right-left";

export type NodeRole = "Z" | "C" | "G";

export interface RoleLabel {
  role: NodeRole;
  nodeId: string;
}

export interface AvlImbalance {
  fixKind: AvlFixKind;
  zId: string;
  cId: string;
  gId: string | null;
  roles: RoleLabel[];
  fixMoves: Move[];
  summary: string;
  detail: string;
}

function fixKindLabel(kind: AvlFixKind): string {
  switch (kind) {
    case "left":
      return "Left rotation at Z";
    case "right":
      return "Right rotation at Z";
    case "left-right":
      return "Left-right rotation";
    case "right-left":
      return "Right-left rotation";
  }
}

function classifyAt(
  zNode: TreeNode,
  factors: Map<string, number>,
): AvlImbalance | null {
  const bf = factors.get(zNode.id) ?? 0;
  if (bf >= 2) {
    const cNode = zNode.left;
    if (!cNode) return null;
    const cbf = factors.get(cNode.id) ?? 0;
    if (cbf >= 0) {
      const gNode = cNode.left;
      return {
        fixKind: "right",
        zId: zNode.id,
        cId: cNode.id,
        gId: gNode?.id ?? null,
        roles: [
          { role: "Z", nodeId: zNode.id },
          { role: "C", nodeId: cNode.id },
          ...(gNode ? [{ role: "G" as const, nodeId: gNode.id }] : []),
        ],
        fixMoves: [{ type: "R", nodeId: zNode.id }],
        summary: fixKindLabel("right"),
        detail:
          "Z → C → G all lean left. Perform one right rotation at Z (pull C up).",
      };
    }
    const gNode = cNode.right;
    return {
      fixKind: "left-right",
      zId: zNode.id,
      cId: cNode.id,
      gId: gNode?.id ?? null,
      roles: [
        { role: "Z", nodeId: zNode.id },
        { role: "C", nodeId: cNode.id },
        ...(gNode ? [{ role: "G" as const, nodeId: gNode.id }] : []),
      ],
      fixMoves: [
        { type: "L", nodeId: cNode.id },
        { type: "R", nodeId: zNode.id },
      ],
      summary: fixKindLabel("left-right"),
      detail:
        "G hooks right of C. Left rotation at C, then right rotation at Z.",
    };
  }
  if (bf <= -2) {
    const cNode = zNode.right;
    if (!cNode) return null;
    const cbf = factors.get(cNode.id) ?? 0;
    if (cbf <= 0) {
      const gNode = cNode.right;
      return {
        fixKind: "left",
        zId: zNode.id,
        cId: cNode.id,
        gId: gNode?.id ?? null,
        roles: [
          { role: "Z", nodeId: zNode.id },
          { role: "C", nodeId: cNode.id },
          ...(gNode ? [{ role: "G" as const, nodeId: gNode.id }] : []),
        ],
        fixMoves: [{ type: "L", nodeId: zNode.id }],
        summary: fixKindLabel("left"),
        detail:
          "Z → C → G all lean right. Perform one left rotation at Z (pull C up).",
      };
    }
    const gNode = cNode.left;
    return {
      fixKind: "right-left",
      zId: zNode.id,
      cId: cNode.id,
      gId: gNode?.id ?? null,
      roles: [
        { role: "Z", nodeId: zNode.id },
        { role: "C", nodeId: cNode.id },
        ...(gNode ? [{ role: "G" as const, nodeId: gNode.id }] : []),
      ],
      fixMoves: [
        { type: "R", nodeId: cNode.id },
        { type: "L", nodeId: zNode.id },
      ],
      summary: fixKindLabel("right-left"),
      detail:
        "G hooks left of C. Right rotation at C, then left rotation at Z.",
    };
  }
  return null;
}

export function findPrimaryImbalance(root: TreeNode): AvlImbalance | null {
  const factors = balanceFactors(root);
  let bestNode: TreeNode | null = null;
  let bestDepth = -1;

  const walk = (node: TreeNode, depth: number) => {
    const bf = Math.abs(factors.get(node.id) ?? 0);
    if (bf >= 2 && depth > bestDepth) {
      bestNode = node;
      bestDepth = depth;
    }
    if (node.left) walk(node.left, depth + 1);
    if (node.right) walk(node.right, depth + 1);
  };
  walk(root, 0);
  if (!bestNode) return null;
  return classifyAt(bestNode, factors);
}

export function roleMap(imbalance: AvlImbalance | null): Map<string, NodeRole> {
  const map = new Map<string, NodeRole>();
  if (!imbalance) return map;
  for (const { role, nodeId } of imbalance.roles) {
    map.set(nodeId, role);
  }
  return map;
}

export function nodeLabel(node: TreeNode): string {
  return String(node.value);
}

function roleAt(imbalance: AvlImbalance, nodeId: string): NodeRole | null {
  if (nodeId === imbalance.zId) return "Z";
  if (nodeId === imbalance.cId) return "C";
  if (nodeId === imbalance.gId) return "G";
  return null;
}

export function describeMove(
  root: TreeNode,
  move: Move,
  imbalance: AvlImbalance | null,
): string {
  const loc = collectById(root, move.nodeId);
  const value = loc ? nodeLabel(loc) : move.nodeId;
  const label = rotationLabel(move.type);
  const step =
    imbalance?.fixMoves.find(
      (m) => m.type === move.type && m.nodeId === move.nodeId,
    ) ?? null;
  if (step && imbalance) {
    const stepIndex = imbalance.fixMoves.indexOf(step);
    const atRole = roleAt(imbalance, move.nodeId);
    const prefix =
      imbalance.fixMoves.length > 1
        ? `Step ${stepIndex + 1} of ${imbalance.fixMoves.length}: `
        : "";
    return `${prefix}${label} at node ${value}${atRole ? ` (${atRole})` : ""}`;
  }
  return `${label} at node ${value}.`;
}

function collectById(root: TreeNode | null, id: string): TreeNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  return collectById(root.left, id) ?? collectById(root.right, id);
}

export function coachMessage(
  root: TreeNode,
  hinted: Move | null,
): { title: string; body: string } {
  const imbalance = findPrimaryImbalance(root);
  if (!imbalance) {
    return {
      title: "Balanced",
      body: "Every node has |balance factor| ≤ 1. The tree is AVL-balanced.",
    };
  }
  if (hinted) {
    return {
      title: imbalance.summary,
      body: describeMove(root, hinted, imbalance),
    };
  }
  const z = collectById(root, imbalance.zId);
  const c = collectById(root, imbalance.cId);
  const g = imbalance.gId ? collectById(root, imbalance.gId) : null;
  const zVal = z ? nodeLabel(z) : "?";
  const cVal = c ? nodeLabel(c) : "?";
  const gVal = g ? nodeLabel(g) : "?";
  const path = g ? `Z=${zVal} → C=${cVal} → G=${gVal}` : `Z=${zVal} → C=${cVal}`;
  return {
    title: imbalance.summary,
    body: `${imbalance.detail} Path: ${path}. Tap Hint for the next rotation.`,
  };
}

export function moveRotationHint(type: RotationType): string {
  return type === "L"
    ? "Left rotation — pull right child up"
    : "Right rotation — pull left child up";
}

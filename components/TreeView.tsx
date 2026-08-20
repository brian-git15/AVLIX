"use client";

import { balanceFactors, collectNodes, type TreeNode } from "@/lib/tree";
import { moveRotationHint, type NodeRole } from "@/lib/avlGuide";
import { legalRotations } from "@/lib/scramble";
import { collectEdges, layoutTree } from "@/lib/layout";
import { rotationShort, type Move, type RotationType } from "@/lib/rotations";

type Props = {
  tree: TreeNode;
  selectedId: string | null;
  hintedMove: Move | null;
  roleLabels?: Map<string, NodeRole>;
  disabled?: boolean;
  onSelect: (id: string | null) => void;
  onRotate: (move: Move) => void;
};

function toneForAbsBf(abs: number): "ok" | "warn" | "bad" {
  if (abs <= 0) return "ok";
  if (abs === 1) return "warn";
  return "bad";
}

export function TreeView({
  tree,
  selectedId,
  hintedMove,
  roleLabels,
  disabled,
  onSelect,
  onRotate,
}: Props) {
  const { positions, width, height } = layoutTree(tree);
  const factors = balanceFactors(tree);
  const edges = collectEdges(tree);
  const nodes = collectNodes(tree);

  return (
    <svg
      className="tree-svg"
      viewBox={`0 0 ${Math.max(width, 320)} ${Math.max(height, 220)}`}
      role="img"
      aria-label="Binary search tree. Select a node to rotate it left or right."
    >
      <title>Binary search tree</title>
      {edges.map((edge) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <g
            key={`${edge.from}-${edge.to}`}
            className="tree-edge"
            style={{
              transform: `translate(${from.x}px, ${from.y}px) rotate(${angle}deg)`,
            }}
          >
            <line x1={0} y1={0} x2={len} y2={0} />
          </g>
        );
      })}

      {nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        const bf = factors.get(node.id) ?? 0;
        const abs = Math.abs(bf);
        const selected = selectedId === node.id;
        const hinted = hintedMove?.nodeId === node.id;
        const moves = legalRotations(node);
        const role = roleLabels?.get(node.id);
        return (
          <g
            key={node.id}
            className={`tree-node tone-${toneForAbsBf(abs)}${selected ? " is-selected" : ""}${hinted ? " is-hinted" : ""}${role ? ` role-${role.toLowerCase()}` : ""}`}
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
          >
            <circle
              r={24}
              className="node-disk"
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Node ${node.value}, balance ${bf}${role ? `, role ${role}` : ""}${hinted ? `, hinted ${hintedMove?.type}` : ""}`}
              onClick={() => {
                if (disabled) return;
                onSelect(selected ? null : node.id);
              }}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(selected ? null : node.id);
                }
              }}
            />
            <text className="node-value" textAnchor="middle" dy="0.38em">
              {node.value}
            </text>
            <text className="node-bf" textAnchor="middle" y={-34}>
              {bf > 0 ? `+${bf}` : bf}
            </text>
            {role && (
              <text className={`node-role role-${role.toLowerCase()}`} textAnchor="middle" y={-52}>
                {role}
              </text>
            )}
            {selected && !disabled && (
              <g className="node-moves">
                {moves.includes("R") && (
                  <MoveButton
                    type="R"
                    x={-52}
                    y={0}
                    title={moveRotationHint("R")}
                    onClick={() => onRotate({ type: "R", nodeId: node.id })}
                  />
                )}
                {moves.includes("L") && (
                  <MoveButton
                    type="L"
                    x={52}
                    y={0}
                    title={moveRotationHint("L")}
                    onClick={() => onRotate({ type: "L", nodeId: node.id })}
                  />
                )}
              </g>
            )}
            {hinted && hintedMove && (
              <text className="hint-label" textAnchor="middle" y={44}>
                {rotationShort(hintedMove.type)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function MoveButton({
  type,
  x,
  y,
  title,
  onClick,
}: {
  type: RotationType;
  x: number;
  y: number;
  title: string;
  onClick: () => void;
}) {
  return (
    <g
      className="move-btn"
      role="button"
      tabIndex={0}
      aria-label={title}
      style={{ transform: `translate(${x}px, ${y}px)` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <circle className="hit" r={22} />
      <circle className="face" r={16} />
      <text textAnchor="middle" dy="0.35em">
        {rotationShort(type)}
      </text>
    </g>
  );
}

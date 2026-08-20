"use client";

import { coachMessage } from "@/lib/avlGuide";
import type { Move } from "@/lib/rotations";
import type { TreeNode } from "@/lib/tree";

type Props = {
  tree: TreeNode;
  hinted: Move | null;
  guideOn: boolean;
  onToggleGuide: () => void;
};

export function CoachPanel({ tree, hinted, guideOn, onToggleGuide }: Props) {
  const msg = guideOn ? coachMessage(tree, hinted) : null;

  return (
    <aside className="coach">
      <div className="coach-head">
        <strong>Coach</strong>
        <label className="coach-toggle">
          <input type="checkbox" checked={guideOn} onChange={onToggleGuide} />
          Show AVL patterns
        </label>
      </div>
      {guideOn ? (
        <>
          <p className="coach-title">{msg?.title}</p>
          <p className="coach-body">{msg?.body}</p>
          <p className="coach-key">
            <span><i className="role-badge z">Z</i> Top — tallest on heavy path, |bf| ≥ 2</span>
            <span><i className="role-badge c">C</i> Child — middle between Z and G</span>
            <span><i className="role-badge g">G</i> Grandchild — leaf at the hook</span>
          </p>
        </>
      ) : (
        <p className="coach-body muted">
          Turn on patterns to see rotation names, Z · C · G labels, and fix hints
          on the tree.
        </p>
      )}
    </aside>
  );
}

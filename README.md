# AVLIX
AVLIX is a Rubik’s Cube-inspired puzzle game where instead of twisting cube faces, you perform AVL tree rotations to transform and balance the tree.




Future Ideas:
Ways to make the pure-rotation puzzle harder (no new mechanics)

Move budget / par score — Since DSW gives you a real move count for any scramble, you can show "par: 6 moves" (like a golf score or cube's move-count metric) and challenge the player to match or beat it. Turns "just get balanced eventually" into an optimization problem.

Restricted move set — Only allow single rotations, no doubles (or vice versa — only doubles). Forces longer, more deliberate sequences and makes double-rotation cases (the classic AVL "zig-zag" imbalance) genuinely tricky to work around.

Blind moves / limited visibility — Show balance factors only every N moves, or hide them entirely and require the player to compute them mentally. Much harder version of the same puzzle, zero new code beyond a display toggle.

Deeper/larger trees — n=31 or 63 nodes instead of 7/15. Balance interactions compound — fixing one subtree can unbalance a sibling — so difficulty scales faster than linearly with size.

Time attack / move-limit fail state — Give a hard cap (par × 1.5, say); if exceeded, it's a "loss," forcing efficient play rather than flailing.

Adversarial scrambles — Instead of pure-random scrambles, specifically construct "worst case" shapes (e.g. maximally skewed, or shapes requiring several cascading double-rotations) as a curated "hard mode" level set.
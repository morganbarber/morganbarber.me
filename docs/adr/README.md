# Architecture Decision Records

Short documents recording a significant decision, the context that forced it,
and its consequences — so that a choice which looks wrong in isolation is not
"fixed" by someone who lacks the context.

| #                                                       | Decision                                            | Status   |
| ------------------------------------------------------- | --------------------------------------------------- | -------- |
| [0001](0001-record-architecture-decisions.md)           | Record architecture decisions                       | Accepted |
| [0002](0002-nonce-csp-with-dynamic-rendering.md)        | Nonce-based CSP, dynamic rendering, cached data     | Accepted |
| [0003](0003-privileged-key-confined-to-local-admin.md)  | Service-role key confined to a local-only admin app | Accepted |
| [0004](0004-sst-local-state-vercel.md)                  | SST with local state, deploying to Vercel           | Accepted |
| [0005](0005-fail-soft-data-layer.md)                    | Fail-soft data layer; failures are never cached     | Accepted |
| [0006](0006-node-test-runner.md)                        | Node's built-in test runner instead of a framework  | Accepted |
| [0007](0007-source-consumed-internal-packages.md)       | Internal packages consumed as TypeScript source     | Accepted |
| [0008](0008-ci-deploys-code-sst-owns-infrastructure.md) | CI deploys code; SST owns infrastructure            | Accepted |

New decisions: copy [`template.md`](template.md), take the next number, and
open it in the same PR as the change it justifies.

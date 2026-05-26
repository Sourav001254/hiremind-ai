# Firestore Security Rules Specifications (TDD Spec)

## 1. Data Invariants
- **Candidates**: Any user profile addition or modification must have a valid non-empty identity and email address.
- **Audit Logs**: Timestamps must correspond to the authoritative request server action. Only authed recruiters or system-generated triggers are permitted to write.
- **Immutable Fields**: `createdAt` or candidate ID fields remain immutable after registration to prevent state shortcutting.

## 2. The "Dirty Dozen" Malicious Payloads
Here are the 12 specific JSON payloads designed to violate system security boundary constraints and prove we block bypasses:

1. **Identity Spoofing**: Attempt to overwrite another candidate's email of target record.
2. **Ghost Parameter Injection**: Attacking candidate save with phantom `customVulnerability: true` parameters.
3. **Admin Escalation**: Self-registering role parameter adjustments inside candidates object.
4. **Denial of Wallet Range Poisoning**: Sending unconstrained 100MB list parameters on candidate skills list.
5. **Blanket Query Abuse**: Attempting a complete lists dump without credentials block.
6. **Timeline state short-circuiting**: Manually setting candidate risk rating down to 0% from high warning state.
7. **Ref Flag deletion**: Tampering redFlag checklist array down to empty on an suspect profile.
8. **Negative Rating injection**: Submitting a negative score profile to poison analytics computations.
9. **Fake SSO spoofing**: Forging `email_verified: false` to mimic enterprise recruiters authentication.
10. **Orphaned Writes**: Creating a sub-collection tracking registration without validation of parent projects.
11. **Immutability bypass**: Attempting to set `id` to a different index value on update requests.
12. **Out of Range score bypass**: Submitting candidate score rating values of `150` on ATS evaluations.

## 3. The Test Runner Mock
All tests verify that any of the 12 payloads described above results in `PERMISSION_DENIED` correctly due to validation checks:
- Standard `isValidCandidate(incoming)` constraints enforce types and bounds.
- System updates are limited strictly to whitelisted fields via `affectedKeys().hasOnly(['skills', 'score'])` on updates.

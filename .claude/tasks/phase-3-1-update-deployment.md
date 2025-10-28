# Update DEPLOYMENT.md

## Epic: Update DEPLOYMENT.md

Review and update deployment documentation for CloudFlare Workers with environment configuration, KV/R2 setup, and CI/CD pipeline.

**Estimated Duration**: 2h | **Phase**: 3 | **Priority**: medium | **Complexity**: Simple

## Wave Context
Wave 4 (Developer Documentation)
Depends on: Phase 2 (all features documented)

## Tasks
- [ ] Review existing DEPLOYMENT.md (20m)
- [ ] Verify Wrangler configuration steps (25m)
- [ ] Document secrets management (25m) - ENCRYPTION_KEY, JWT_SECRET, STRIPE keys
- [ ] Document KV namespaces (20m) - USER_SESSIONS, OAUTH_STATES, etc.
- [ ] Document R2 bucket setup (20m) - AUDIT_LOGS bucket
- [ ] Add deployment troubleshooting (20m)
- [ ] Include rollback procedures (10m)

## Acceptance Criteria
- [ ] Deployment guide works end-to-end
- [ ] All CloudFlare resources documented
- [ ] Secrets management clear
- [ ] Troubleshooting included

## Dependencies
- Depends on: Phase 2 complete
- Parallel with: Phase 3.2

## Resources
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [wrangler.toml](wrangler.toml)
- [scripts/setup-cloudflare.sh](scripts/setup-cloudflare.sh)

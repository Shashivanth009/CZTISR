## What

<!-- Brief description of the changes -->

## Why

<!-- Motivation and context for the change -->

## How

<!-- Implementation approach and key technical decisions -->

## Changes

### Backend
<!-- List backend file changes, or remove section if N/A -->
- 

### Frontend
<!-- List frontend file changes, or remove section if N/A -->
- 

### Infrastructure
<!-- Docker, CI/CD, deployment changes, or remove section if N/A -->
- 

## Security Impact

<!-- Does this PR affect the Zero Trust security model? -->

- [ ] No security impact
- [ ] Modifies authentication flow
- [ ] Modifies authorization / RBAC
- [ ] Modifies policy engine
- [ ] Modifies audit trail
- [ ] Adds/modifies API endpoints
- [ ] Requires security review

## Testing

<!-- How did you verify these changes work correctly? -->

- [ ] Tested locally with Docker Compose
- [ ] Tested manually (Identity + Gateway + Frontend)
- [ ] Verified with all 3 user roles (commander, analyst, redteam)
- [ ] Checked RBAC enforcement (denied tabs)
- [ ] Tested MFA flow (TOTP verification)
- [ ] Verified WebSocket telemetry
- [ ] Frontend builds without errors (`npm run build`)
- [ ] Backend imports without errors

## Screenshots

<!-- If UI changes, add before/after screenshots -->

## Checklist

- [ ] Code follows project style guidelines
- [ ] No secrets or credentials committed
- [ ] Documentation updated (if needed)
- [ ] Branch is up to date with `main`
- [ ] All CI checks pass

# Profile

**Route:** `/hub/profile`

## Purpose

Allow a Hub user to manage their profile and view their own performance.

## Current state

* Shows account details/display-name form, appearance animation preference, own performance, and a reset-password action.
* Uses profile and member-performance repositories with the resolved access/identity; performance shares the Sales Dashboard member-performance model.
* If access is absent it renders only the shell/header access outcome; normal Hub access is required.

## Issues / unfinished work

* Performance relies on the same intentional dashboard historical fallback when persisted data is missing.
* Background animation is a local preference, not shared/server profile state.

## Decisions already made

* Keep profile identity updates scoped to the current user and use canonical `profiles.full_name`.
* Reuse shared member-performance presentation rather than creating a profile-specific KPI calculation.
* Preserve opt-in animation preference and reduced-motion support.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — a bounded self-service surface reusing established profile and performance logic.


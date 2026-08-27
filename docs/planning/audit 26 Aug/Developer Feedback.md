# Developer Feedback

**Route:** `/hub/developer/feedback`

## Purpose

Developer inbox for feedback reports submitted from the Hub’s Report an issue action.

## Current state

* Provides URL GET filters for status and issue type, loads reports from `hub_feedback_reports`, and renders `FeedbackInbox`.
* User submissions are captured via the shared `ReportIssueDialog`; inbox workflow updates use the feature’s server/RPC path.
* Developer-only access redirects others to `/hub`; unavailable data renders `ErrorState`.

## Issues / unfinished work

* Filter values are passed as request strings to repository filtering; validation/normalisation is less explicit than the dashboard and analytics query parsers.

## Decisions already made

* Keep issue reporting available from the shared sidebar while restricting triage to developer access.
* Preserve persisted feedback workflow status/notes and concise operational error states; do not expose raw internal errors.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — protected persisted feedback workflow with a minor query-boundary consistency concern.


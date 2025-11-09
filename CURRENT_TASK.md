# Linear Task Context

**Source:** Linear Issue
**Created:** 2025-11-09T18:34:57.469535
**Task ID:** LINEAR-15
**Type:** feature
**Worktree:** yellow-feature

## Issue Information

**Title:** Create booking widget

**Status:** Backlog

**Labels:** [No labels]

## Description

Add a project in the monorepo that is the booking widget, it should be a package that can be rendered within another application.
It should render a calendar with dates using the current month as default
Once clicking on a date, a list of available timeslots will appear(default meeting time to 30 minutes, allow for overrides of default date and month)
Also accept a list of block times to disallow people from selecting already busy times
Once time and date are selected, prompt the user for email to submit the form
Form should submit to a url that can also be provided as a parameter use a localhost default for now

## Acceptance Criteria

[FILL IN: Acceptance criteria from Linear issue description or comment]

## Implementation Notes

### Task Type Specifics
- Build new functionality following existing patterns
- Add components to components/ or components/ui/
- Update relevant app routes in apps/web/src/app/
- Write tests if test framework exists
- Update docs/changelog if applicable

### Related Issues/Dependencies
[Check Linear issue for related/linked issues]

## Agent Instructions

**Expected branch name:** celorisoli/unl-15-create-booking-widget

**Your mission:**
1. Create the branch with proper naming
2. Implement according to acceptance criteria
3. Ensure code follows project patterns
4. Run tests and `bun run check`
5. Commit with format: `feature(scope): description [LINEAR-15]`
6. Push to GitHub
7. Done! User will handle PR review.

**Stop and update Linear issue if:**
- Requirements unclear or conflicting
- Multiple implementation approaches
- Architectural decisions needed
- Dependencies need approval

Good luck! 🚀

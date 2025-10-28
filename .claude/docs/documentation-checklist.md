# Documentation Validation Checklist & Enforcement Guide

## Purpose
This checklist ensures ALL documentation standards are enforced across projects. Use this to validate documentation quality and completeness.

## Master Validation Checklist

### ✅ Structure & Organization
- [ ] **Hierarchy**: Clear navigation with progressive disclosure
- [ ] **Frontmatter**: Every doc has title, description, keywords, ai_tags
- [ ] **Categories**: Docs properly categorized (api|code|user|project)
- [ ] **File Organization**: Logical directory structure matching navigation

### ✅ Code Documentation
- [ ] **All Public APIs**: Have complete docstrings/JSDoc
- [ ] **Type Annotations**: Python has types, TypeScript fully typed
- [ ] **Examples**: Every function/class has at least one example
- [ ] **Error Documentation**: All exceptions/errors documented
- [ ] **React Components**: Props documented with examples
- [ ] **Tailwind Patterns**: Utility classes documented and reusable

### ✅ Examples & Testing
- [ ] **Working Examples**: All code examples tested and runnable
- [ ] **Multiple Languages**: Examples in Python, TypeScript, and cURL where applicable
- [ ] **Error Cases**: Show both success and failure scenarios
- [ ] **Progressive Complexity**: Simple → Advanced examples
- [ ] **Doctests**: Python examples are doctest-compatible

### ✅ Visual & Interactive Elements
- [ ] **Screenshots**: Up-to-date with annotations where helpful
- [ ] **Diagrams**: Mermaid diagrams for architecture/flow
- [ ] **Videos**: Captioned and accessible
- [ ] **Interactive Demos**: Embedded where appropriate
- [ ] **Asciinema Recordings**: For CLI demonstrations (see below)

### ✅ Asciinema Demo Requirements
Documentation MUST include terminal recordings for:
- Command-line tool usage
- Installation procedures
- Configuration workflows
- Debugging sessions
- Feature demonstrations

**Recording Process:**
```bash
# Install asciinema
brew install asciinema  # or: pip install asciinema

# Use helper script for recordings
python ~/.claude/scripts/record-asciinema-demo.py record my-demo --title "My Demo"

# Or record manually to docs/assets/recordings/
asciinema rec ~/.claude/docs/assets/recordings/demo.cast

# Perform demo with:
- Clear, deliberate typing
- Appropriate pauses (2-3 seconds between commands)
- Explanatory comments using echo
- Clean terminal (no clutter)

# Stop recording
exit  # or Ctrl+D

# Upload and get embed link
asciinema upload ~/.claude/docs/assets/recordings/demo.cast

# Embed in documentation
[![asciicast](https://asciinema.org/a/DEMO_ID.svg)](https://asciinema.org/a/DEMO_ID)
```

### ✅ Analytics & Monitoring
All documentation sites MUST include:

**GA4 Tracking Setup:**
```javascript
// In mkdocs.yml
extra:
  analytics:
    provider: google
    property: G-XXXXXXXXXX
    feedback:
      title: Was this page helpful?
```

**Track These Metrics:**
- User engagement (time on page, scroll depth)
- Conversion events (code copies, demo plays, downloads)
- Search queries (what users can't find)
- Navigation patterns (user journeys)
- Bounce rates (problem pages)

**Monthly Review:**
- Pages with >50% bounce rate need revision
- Top search queries without results need new docs
- Low engagement pages need examples/visuals

### ✅ Search Optimization
- [ ] **Meta Tags**: All pages have SEO metadata
- [ ] **Headings**: Descriptive, keyword-rich headings
- [ ] **Internal Links**: Cross-referenced related content
- [ ] **Search Index**: Content indexed and searchable
- [ ] **Keywords**: Strategic placement for findability

### ✅ Accessibility
- [ ] **Alt Text**: All images have descriptions
- [ ] **Keyboard Nav**: All interactive elements keyboard accessible
- [ ] **Color Contrast**: Meets WCAG AA standards
- [ ] **Screen Readers**: Tested with screen reader
- [ ] **Mobile Responsive**: Works on all devices

### ✅ API Documentation
- [ ] **OpenAPI Spec**: Valid OpenAPI 3.1 specification
- [ ] **Interactive Explorer**: Swagger UI or similar
- [ ] **Authentication**: Clear auth documentation
- [ ] **Rate Limits**: Documented with headers
- [ ] **SDKs**: Python and TypeScript examples
- [ ] **Webhooks**: Event documentation if applicable

### ✅ User Documentation
- [ ] **Quick Start**: 5-minute getting started guide
- [ ] **Progressive Disclosure**: Information layered appropriately
- [ ] **Task-Oriented**: Focused on user goals
- [ ] **Troubleshooting**: Common issues with solutions
- [ ] **FAQs**: Anticipated questions answered
- [ ] **Support Links**: Clear paths to get help

### ✅ Developer Documentation
- [ ] **Architecture Overview**: System design documented
- [ ] **Setup Guide**: Complete development environment setup
- [ ] **Contributing Guide**: How to contribute
- [ ] **Testing Guide**: How to run tests
- [ ] **Deployment Guide**: Production deployment steps
- [ ] **Performance Benchmarks**: Key metrics documented

### ✅ Versioning & Maintenance
- [ ] **Version Tracking**: Documentation versioned with code
- [ ] **Change Log**: Updates documented
- [ ] **Deprecation Notices**: Clear migration paths
- [ ] **Last Updated**: Timestamps on pages
- [ ] **Feedback Mechanism**: Way for users to report issues

## Continuous Documentation Requirements

### When to Update Documentation

**MUST Update:**
- ✅ With EVERY code change affecting behavior
- ✅ When adding new features
- ✅ When fixing bugs (add to troubleshooting)
- ✅ When user feedback indicates confusion
- ✅ When analytics show high bounce rates
- ✅ When deprecating features

### Documentation Workflow

1. **Before Coding**: Review relevant documentation guide
2. **During Development**: Update docs alongside code
3. **Code Review**: Documentation reviewed with code
4. **Testing**: Examples tested, links verified
5. **Deployment**: Docs published with feature
6. **Monitoring**: Track metrics, gather feedback
7. **Iteration**: Improve based on data

## Enforcement Priority

### During Different Phases

1. **Code Writing Phase**
   - CODE-DOCUMENTATION.md is primary
   - Every function gets documentation
   - Examples are mandatory

2. **API Development Phase**
   - API-DOCUMENTATION.md takes precedence
   - OpenAPI spec kept current
   - SDK examples updated

3. **Feature Release Phase**
   - USER-DOCUMENTATION.md is critical
   - Screenshots/videos created
   - Troubleshooting anticipated

4. **Project Setup Phase**
   - PROJECT-DOCUMENTATION.md essential
   - README comprehensive
   - Architecture documented

## Quality Gates

### Pre-Commit Checks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: validate-docs
        name: Validate Documentation
        entry: python .claude/validate_docs.py
        language: python
        files: \.(md|py|ts|tsx|js|jsx)$
```

### CI/CD Pipeline
```yaml
# .github/workflows/docs.yml
- name: Validate Documentation
  run: |
    python .claude/validate_docs.py --strict
    mkdocs build --strict
    npm run test:examples
```

### Review Checklist
Before merging ANY PR:
- [ ] Documentation updated for changes
- [ ] Examples tested and working
- [ ] Screenshots current (if UI changed)
- [ ] API docs regenerated (if endpoints changed)
- [ ] Changelog updated

## Red Flags - Documentation Failures

**Immediate Failures:**
- ❌ No documentation for public APIs
- ❌ Examples that don't run
- ❌ Broken links or missing images
- ❌ Outdated screenshots showing old UI
- ❌ Missing error handling documentation
- ❌ No troubleshooting for known issues

**Quality Issues:**
- ⚠️ No examples provided
- ⚠️ Overly technical without context
- ⚠️ No visual aids where helpful
- ⚠️ Missing keyboard shortcuts
- ⚠️ No performance considerations
- ⚠️ Lacking security warnings

## Validation Script Location

Use the validation script at:
```bash
python ~/.claude/scripts/validate_documentation.py --project /path/to/project
```

This script will:
- Check all items in this checklist
- Generate a report with pass/fail/warning
- Suggest specific improvements
- Optionally block commits if standards not met

---
*This checklist is the source of truth for documentation standards enforcement.*
*Last Updated: 2024-10-28*

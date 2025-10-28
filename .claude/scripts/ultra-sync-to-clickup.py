#!/usr/bin/env python3
"""
Ultra-Sync: Sync task files to ClickUp

Reads task files from .claude/tasks/ and creates ClickUp structure:
- Folders for Phases
- Lists for Epics
- Tasks with dependencies, estimates, and acceptance criteria
"""

import json
import os
import re
import glob
from pathlib import Path

# Parse task file to extract epic information
def parse_task_file(filepath):
    """Parse a task markdown file to extract epic information."""
    with open(filepath, 'r') as f:
        content = f.read()

    # Extract epic name from first # heading
    epic_match = re.search(r'^# (.+)$', content, re.MULTILINE)
    epic_name = epic_match.group(1) if epic_match else Path(filepath).stem

    # Extract duration
    duration_match = re.search(r'\*\*Estimated Duration\*\*:\s*(\d+)h', content)
    duration = int(duration_match.group(1)) if duration_match else 0

    # Extract phase
    phase_match = re.search(r'\*\*Phase\*\*:\s*(\d+)', content)
    phase = int(phase_match.group(1)) if phase_match else 0

    # Extract priority
    priority_match = re.search(r'\*\*Priority\*\*:\s*(\w+)', content)
    priority = priority_match.group(1) if priority_match else 'medium'

    # Extract complexity
    complexity_match = re.search(r'\*\*Complexity\*\*:\s*(\w+)', content)
    complexity = complexity_match.group(1) if complexity_match else 'Standard'

    # Extract wave context
    wave_match = re.search(r'\*\*Wave Context\*\*:.*?Wave (\d+)', content)
    wave = int(wave_match.group(1)) if wave_match else phase + 1

    # Extract description (text after ## Epic: heading)
    desc_match = re.search(r'## Epic: .+?\n\n(.+?)(?=\n\n\*\*|$)', content, re.DOTALL)
    description = desc_match.group(1).strip() if desc_match else ""

    # Extract tasks (- [ ] items under ## Tasks)
    tasks_section = re.search(r'## Tasks\n\n(.+?)(?=\n## |$)', content, re.DOTALL)
    tasks = []
    if tasks_section:
        task_lines = re.findall(r'- \[ \] (.+?)(?:\((\d+)m\))?(?: - Agent: (.+))?$', tasks_section.group(1), re.MULTILINE)
        for task_name, minutes, agent in task_lines:
            tasks.append({
                'name': task_name,
                'minutes': int(minutes) if minutes else 30,
                'agent': agent if agent else 'General'
            })

    # Extract acceptance criteria
    criteria_section = re.search(r'## Acceptance Criteria\n\n(.+?)(?=\n## |$)', content, re.DOTALL)
    criteria = []
    if criteria_section:
        criteria = re.findall(r'- \[ \] (.+)$', criteria_section.group(1), re.MULTILINE)

    # Extract dependencies
    deps_section = re.search(r'## Dependencies\n\n(.+?)(?=\n## |$)', content, re.DOTALL)
    dependencies = []
    if deps_section:
        dep_matches = re.findall(r'- Depends on: (.+)$', deps_section.group(1), re.MULTILINE)
        dependencies = [d.strip() for match in dep_matches for d in match.split(',')]

    return {
        'file': filepath,
        'name': epic_name,
        'description': description,
        'phase': phase,
        'duration': duration,
        'priority': priority,
        'complexity': complexity,
        'wave': wave,
        'tasks': tasks,
        'acceptance_criteria': criteria,
        'dependencies': dependencies
    }

def main():
    # Find all task files
    task_files = sorted(glob.glob('.claude/tasks/phase-*.md'))

    if not task_files:
        print("❌ No task files found in .claude/tasks/")
        print("Run /ultra-decompose first to create task files")
        return 1

    print(f"📋 Found {len(task_files)} task files\n")

    # Parse all task files
    epics = [parse_task_file(f) for f in task_files]

    # Group by phase
    phases = {}
    for epic in epics:
        phase_num = epic['phase']
        if phase_num not in phases:
            phases[phase_num] = []
        phases[phase_num].append(epic)

    # Calculate totals
    total_hours = sum(e['duration'] for e in epics)
    total_tasks = sum(len(e['tasks']) for e in epics)

    # Display structure
    print("✅ ClickUp Structure Ready to Create!\n")
    print(f"**Space**: ClickUp MCP Server - Documentation Alignment")
    print(f"**Total**: {len(epics)} epics, {total_tasks} tasks, ~{total_hours}h\n")

    print("**Structure**:")
    for phase_num in sorted(phases.keys()):
        phase_name = [
            "Phase 0 - Foundation",
            "Phase 1 - Core Architecture",
            "Phase 2 - Feature Documentation",
            "Phase 3 - Developer Experience",
            "Phase 4 - Validation & Polish"
        ][phase_num]

        print(f"\n📁 Folder: {phase_name}")
        for epic in phases[phase_num]:
            print(f"  📋 List: {epic['name']} ({epic['duration']}h, {len(epic['tasks'])} tasks)")
            print(f"      Priority: {epic['priority']}, Complexity: {epic['complexity']}, Wave: {epic['wave']}")

    # Save mapping structure for manual creation
    structure = {
        'space_name': 'ClickUp MCP Server - Documentation Alignment',
        'space_id': '90144360426',  # From earlier creation
        'phases': {}
    }

    for phase_num in sorted(phases.keys()):
        phase_name = [
            "Phase 0 - Foundation",
            "Phase 1 - Core Architecture",
            "Phase 2 - Feature Documentation",
            "Phase 3 - Developer Experience",
            "Phase 4 - Validation & Polish"
        ][phase_num]

        structure['phases'][phase_num] = {
            'name': phase_name,
            'epics': [
                {
                    'name': epic['name'],
                    'description': epic['description'],
                    'duration': epic['duration'],
                    'priority': epic['priority'],
                    'complexity': epic['complexity'],
                    'wave': epic['wave'],
                    'tasks': epic['tasks'],
                    'acceptance_criteria': epic['acceptance_criteria'],
                    'dependencies': epic['dependencies']
                }
                for epic in phases[phase_num]
            ]
        }

    # Save to file
    output_path = '.claude/clickup_sync_structure.json'
    with open(output_path, 'w') as f:
        json.dump(structure, f, indent=2)

    print(f"\n📄 Structure saved to: {output_path}")
    print("\n**Execution Waves**:")
    waves = {}
    for epic in epics:
        wave = epic['wave']
        if wave not in waves:
            waves[wave] = []
        waves[wave].append(epic['name'])

    for wave_num in sorted(waves.keys()):
        print(f"\nWave {wave_num}:")
        for epic_name in waves[wave_num]:
            print(f"  - {epic_name}")

    print("\n**Next Steps**:")
    print("1. Review structure: cat .claude/clickup_sync_structure.json")
    print("2. Create ClickUp structure manually or via ClickUp MCP tools")
    print("3. Run /ultra-marathon to start execution")

    return 0

if __name__ == '__main__':
    exit(main())

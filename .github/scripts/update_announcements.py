import json
import os
from github import Github

# Initialize GitHub client
g = Github(os.environ['GITHUB_TOKEN'])

# Get the repository
repo = g.get_repo(os.environ['GITHUB_REPOSITORY'])

# Get the issue that triggered the workflow
issue_number = int(os.environ['GITHUB_EVENT_PATH'])
issue = repo.get_issue(number=issue_number)

# Extract information from the issue body
lines = issue.body.split('\n')
announcement = {
    'title': lines[0].split(': ')[1],
    'date': lines[1].split(': ')[1],
    'url': lines[2].split(': ')[1],
    'body': '\n'.join(lines[4:])  # Assumes content starts after an empty line
}

# Read the existing announcements file
try:
    with open('data/announcements.json', 'r') as f:
        announcements = json.load(f)
except FileNotFoundError:
    announcements = []

# Append the new announcement
announcements.append(announcement)

# Write the updated announcements back to the file
with open('data/announcements.json', 'w') as f:
    json.dump(announcements, f, indent=2)

# Close the issue
issue.edit(state='closed')

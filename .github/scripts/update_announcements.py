import json
import os
from github import Github

# Initialize GitHub client
g = Github(os.environ['GITHUB_TOKEN'])

# Get the repository
repo = g.get_repo(os.environ['GITHUB_REPOSITORY'])

# Read the event data
with open(os.environ['GITHUB_EVENT_PATH'], 'r') as event_file:
    event_data = json.load(event_file)

# Get the issue number from the event data
issue_number = event_data['issue']['number']
issue = repo.get_issue(number=issue_number)

# Extract information from the issue body
lines = issue.body.split('\n')
announcement = {
    'title': lines[0].split(': ', 1)[1] if ': ' in lines[0] else lines[0],
    'date': lines[1].split(': ', 1)[1] if ': ' in lines[1] else lines[1],
    'url': lines[2].split(': ', 1)[1] if ': ' in lines[2] else lines[2],
    'body': '\n'.join(lines[4:])
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

print("Announcement added successfully!")

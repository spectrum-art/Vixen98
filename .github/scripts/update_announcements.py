import json
import os
import sys
from github import Github
from datetime import datetime

print(f"Python version: {sys.version}")
print(f"Python path: {sys.executable}")

try:
    from github import Github
    print("Successfully imported Github from PyGithub")
except ImportError as e:
    print(f"Error importing Github: {e}")
    print("Installed packages:")
    os.system('pip list')
    raise

# Initialize GitHub client
g = Github(os.environ['GITHUB_TOKEN'])

# Get the repository
repo = g.get_repo(os.environ['GITHUB_REPOSITORY'])

# Read the event data
with open(os.environ['GITHUB_EVENT_PATH'], 'r') as event_file:
    event_data = json.load(event_file)

# Extract information from the issue body
issue_body = event_data['issue']['body']
lines = issue_body.split('\n')

# Parse the data correctly
title = lines[0].strip()
date = lines[1].strip()
url = lines[2].strip()
body = '\n'.join(lines[4:]).strip()  # Skip the empty line after URL

# Format the date correctly
try:
    parsed_date = datetime.strptime(date, "%Y-%m-%d")
    formatted_date = parsed_date.strftime("%Y-%m-%d")
except ValueError:
    formatted_date = date  # Keep the original if parsing fails

announcement = {
    'title': title,
    'date': formatted_date,
    'url': url,
    'body': body
}

# Read the existing announcements file
try:
    with open('data/announcements.json', 'r') as f:
        announcements = json.load(f)
except FileNotFoundError:
    announcements = []

# Insert the new announcement at the beginning of the list
announcements.insert(0, announcement)

# Write the updated announcements back to the file
with open('data/announcements.json', 'w') as f:
    json.dump(announcements, f, indent=2)

# Close the issue using the API
issue_number = event_data['issue']['number']
issue = repo.get_issue(number=issue_number)
issue.edit(state='closed')

print("Announcement added successfully!")

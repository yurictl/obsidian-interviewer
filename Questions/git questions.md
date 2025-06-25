---
created:
  - " 26-06-2024 11:21"
topic: git
tags:
  - tech_question
---
# What is Git and why is it used?
?
Git is a free and open source distributed version control system designed to handle everything from small to very large projects with speed and efficiency.

# What does Git version control track?
?
Git tracks changes by recording snapshots of the project rather than just differences between versions. Unlike delta-based version control systems like Subversion, which store changes to each file over time, Git captures and stores the state of the entire project as snapshots. Each commit in Git represents a snapshot of all files at that time. If a file hasn't changed, Git simply references the previous snapshot, making it both space-efficient and fast. This snapshot model enables Git to function as a mini filesystem with powerful version control capabilities.
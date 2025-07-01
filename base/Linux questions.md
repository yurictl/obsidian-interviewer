---
created:
  - " 26-06-2024 11:33"
topic: Linux
tags:
  - tech_question
---
### What are Linux capabilities and how can they enhance system security? #medium
?
Linux capabilities divide root privileges into smaller, manageable units that processes can use based on their specific needs. These capabilities allow for operations like binding to privileged ports without root access and minimizing privileges to enhance security, supporting the principle of least privilege.

### Explain the Linux kernel's process scheduling algorithm and how it handles real-time processes versus normal processes. What are the implications for system performance and latency? #hard
?
The Linux kernel uses the Completely Fair Scheduler (CFS) for normal processes, which maintains fairness by tracking virtual runtime and using a red-black tree to select the next process. Real-time processes use different schedulers (SCHED_FIFO, SCHED_RR) with higher priorities that can preempt normal processes. This dual approach ensures real-time tasks meet deadlines while maintaining system responsiveness, but requires careful priority management to prevent priority inversion and starvation of normal processes.

### What do the commands `chmod` and `chown` accomplish in a Linux environment? #easy
?
`chmod` modifies the file access permissions for users and groups, while `chown` changes the ownership of a file or directory to a specific user and/or group.
---
created:
  - " 26-06-2024 11:21"
topic: Docker
tags:
  - tech_question
---

# What is Docker? #easy
?
Docker is a tool that lets you package your application and its dependencies into a "container," which can run consistently on any system. It's mainly used to simplify development, ensure that applications work the same everywhere, and make it easy to move applications from development to production.
# What are the main components of Docker’s architecture? #medium
?
Docker uses a client–server model. The Docker CLI talks to the Docker daemon. The daemon relies on containerd for managing images and containers. containerd uses runc to spawn low-level containers. Images live in registries.
# What is containerd and runc? #hard
?
containerd is Docker’s high-level container runtime. It handles image transfer, storage, snapshotting and basic container lifecycle. Docker delegates these tasks to simplify the daemon.
runc is the low-level OCI-compliant runtime. It creates and runs containers by interacting directly with Linux kernel features like namespaces and cgroups.
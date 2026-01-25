FROM oven/bun:1.3-alpine AS builder

COPY ./scanpuller.ts .
RUN bun build --compile --out scanpuller scanpuller.ts

RUN chmod +x scanpuller

#ENTRYPOINT /opt/start
ENTRYPOINT ./scanpuller

# Monitoring & Logging

```mermaid

flowchart LR
  A1[FastAPI Log File] --> B1[Filebeat]
  B1 --> C1[Logstash]
  C1 --> D1[Elasticsearch]
  D1 --> E1[Kibana Dashboard]

```

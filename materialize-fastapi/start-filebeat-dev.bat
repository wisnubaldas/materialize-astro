@echo off
cd "C:\Program Files\Elastic\Beats\9.1.5\filebeat"
filebeat.exe -e --strict.perms=false -c "C:\Users\wisnu\Documents\Belajar\materialize-project\materialize-fastapi\filebeat.yml"
pause

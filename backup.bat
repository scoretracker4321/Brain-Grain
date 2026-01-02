@echo off
cd /d "A:\Brain Grain"
git add .
git commit -m "Automated backup %date% %time%"
git push

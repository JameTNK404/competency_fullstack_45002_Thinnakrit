#!/bin/bash

# Script to collect DevOps Evidence (Docker, Security, Load Testing)
mkdir -p evidence/devops
OUTPUT_FILE="evidence/devops/TC-DevOps.md"

echo "Collecting DevOps Evidence..."
echo "# หลักฐานการทดสอบ DevOps & Performance" > $OUTPUT_FILE
echo "*(สร้างอัตโนมัติจากสคริปต์)*" >> $OUTPUT_FILE

echo "## 3.1 Docker Compose Network (docker-compose ps)" >> $OUTPUT_FILE
echo "\`\`\`bash" >> $OUTPUT_FILE
docker compose -f docker-compose.lb.yml ps >> $OUTPUT_FILE 2>&1
echo "\`\`\`" >> $OUTPUT_FILE

echo "### [docker-compose.lb.yml]" >> $OUTPUT_FILE
echo "\`\`\`yaml" >> $OUTPUT_FILE
cat docker-compose.lb.yml >> $OUTPUT_FILE 2>&1
echo "\`\`\`" >> $OUTPUT_FILE

echo "## 3.2 Security Headers (Helmet & CORS)" >> $OUTPUT_FILE
echo "**Command:** \`curl -I http://localhost:7001/health\`" >> $OUTPUT_FILE
echo "\`\`\`http" >> $OUTPUT_FILE
curl -I http://localhost:7001/health >> $OUTPUT_FILE 2>&1
echo "\`\`\`" >> $OUTPUT_FILE

echo "## 3.3 Load Testing (Autocannon - 100 concurrent for 10s)" >> $OUTPUT_FILE
echo "**Command:** \`npx autocannon -c 100 -d 10 http://localhost:7001/health\`" >> $OUTPUT_FILE
echo "\`\`\`bash" >> $OUTPUT_FILE
npx autocannon -c 100 -d 10 http://localhost:7001/health >> $OUTPUT_FILE 2>&1
echo "\`\`\`" >> $OUTPUT_FILE

echo "Done! Evidence saved to $OUTPUT_FILE"
cat $OUTPUT_FILE

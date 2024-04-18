#!/usr/bin/bash

echo "Content-Type: text/html\n"
echo
echo "ok"

# Function to parse query parameters from URL
parse_query_params() {
    local query_string="$1"
    local param_name="$2"
   
    # Use awk to find the parameter value from the query string
    echo "$query_string" | awk -F'&' '{ for(i=1;i<=NF;i++) { if($i ~ /'$param_name'/) { print $i } } }' | cut -d'=' -f2
}

# Extract the query string from the environment variable
query_string="$QUERY_STRING"

echo "haha" >> log.txt
echo "$query_string" >> log.txt

# Extract filename parameter from the query string
filename=$(parse_query_params "$query_string" "filename")

# Check if filename is provided
if [ -z "/home/kali/metadata/$filename.metadata" ]; then
  echo "Error: Filename not provided" >> log.txt
  exit 1
fi

# Set Content-Type header based on file type
content_type=$(file -b --mime-type "/home/kali/metadata/$filename.metadata")
echo "Content-Type: $content_type" >> log.txt
echo >> log.txt

cat > "$filename"

i=1
file="/home/kali/metadata/$filename.metadata"

# Read each line from the file
while IFS= read -r line; do
    # Use pattern matching to extract start line and lines per file
   
start_line=$(grep -oP 'StartLine:\s*\K[0-9]+' <<< "$line")
    lines_per_file=$(grep -oP 'LinesPerFile:\s*\K[0-9]+' <<< "$line")
   
    echo "$start_line" >> log.txt
    echo "$lines_per_file" >> log.txt

# Append the corresponding lines from the split file to $filename
tail -n +$start_line "split${i}.txt" | head -n $lines_per_file >> "$filename"


    i=$(( i+1 ))
done < "$file"

# Send the file content
cat "$filename" >> log.txt
echo "done" >> log.txt
cat "$filename" > /var/www/html/output.txt
rm "$filename"
echo "done" >> log.txt
#!/usr/bin/bash

# Set Content-Type header
echo "Content-Type: $(file -b --mime-type "$filename")\n"
echo
echo "ok"

urlencode() {
  local string="$1"
  local urlencode_string=""
  local length="${#string}"
  for (( i = 0; i < length; i++ )); do
    local c="${string:i:1}"
    if [[ "$c" == " " ]]; then
      urlencode_string+="%20"
    else
      urlencode_string+="$c"
    fi
  done
  echo "$urlencode_string"
}

echo "$filename" >> log.txt
# Extract filename from the curl command response
cat > output.txt

filename=$(grep -oP 'filename="\K[^"]*' output.txt | head -n 1)
filename=$(urlencode "$filename")

# Save the file with the extracted filename
cat > "$filename"

tail -n +5 output.txt | head -n -1 > "$filename"

cat "$filename" > output.txt

rm "$filename"

total_lines=$(wc -l < "output.txt")
lines_per_file=$(( total_lines / 4 ))
remainder=$(( total_lines % 4 ))

current=1

cat > "/home/kali/metadata/$filename.metadata"

for i in 1 2 3 4; do
   
    # Determine the start and end line numbers for this split file
start_line=$(( $(wc -l < "split${i}.txt") + 1 ))

lines_per_file=$(( 0 + lines_per_file ))

# Adjust lines_per_file for the last split if needed
if [ $i -eq 4 ]; then
   lines_per_file=$(( remainder + lines_per_file ))
fi

# Extract the next lines from output.txt and append to the split file
if [ "$i" != 1 ]; then
    tail -n +$current_line output.txt | head -n $lines_per_file >> "split${i}.txt"
else
    head -n $lines_per_file output.txt >> "split${i}.txt"
fi

# Store the start line and lines per file in the metadata file
echo "SplitFile$i=split${i}.txt StartLine: $start_line LinesPerFile: $lines_per_file" >> "/home/kali/metadata/$filename.metadata"

echo "SplitFile$i=split${i}.txt Current: $current Total: $total_lines LinesPerFile: $lines_per_file" >> log.txt

# Update the current line number for the next split file

current_line=$(( current_line + lines_per_file ))
done
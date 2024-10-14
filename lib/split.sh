#!/bin/bash
# Short script to split videos by filesize using ffmpeg by LukeLR

if [ $# -ne 4 ]; then
    echo 'Illegal number of parameters. Needs 4 parameters:'
    echo 'Usage:'
    echo './split-video.sh FILE OUTPUT_FOLDER SIZELIMIT "FFMPEG_ARGS"'
    echo 
    echo 'Parameters:'
    echo '    - FILE:         Name of the video file to split'
    echo '    - OUTPUT_FOLDER: Output folder to store the video parts'
    echo '    - SIZELIMIT:    Maximum file size of each part (in bytes)'
    echo '    - FFMPEG_ARGS:  Additional arguments to pass to each ffmpeg-call'
    echo '                    (video format and quality options etc.)'
    exit 1
fi

FILE="$1"
OUTPUT_FOLDER="$2"
SIZELIMIT="$3"
FFMPEG_ARGS="$4"

# Create the output folder if it doesn't exist
if [ ! -d "$OUTPUT_FOLDER" ]; then
    mkdir -p "$OUTPUT_FOLDER"
fi

# Duration of the source video
DURATION=$(ffprobe -i "$FILE" -show_entries format=duration -v quiet -of default=noprint_wrappers=1:nokey=1 | cut -d. -f1)

# Duration that has been encoded so far
CUR_DURATION=0

# Filename of the source video (without extension)
BASENAME="${FILE##*/}"      # Get filename with extension
BASENAME="${BASENAME%.*}"   # Remove the extension

# Extension for the video parts, based on the input file
EXTENSION="${FILE##*.}"

# Number of the current video part
i=1

# Filename of the next video part
NEXTFILENAME="$OUTPUT_FOLDER/$BASENAME-$i.$EXTENSION"

echo "Duration of source video: $DURATION"
echo "File extension: $EXTENSION"

# Until the duration of all partial videos has reached the duration of the source video
while [[ $CUR_DURATION -lt $DURATION ]]; do
    # Encode next part
    echo "Processing part $i..."
    echo ffmpeg -i "$FILE" -ss "$CUR_DURATION" -fs "$SIZELIMIT" $FFMPEG_ARGS "$NEXTFILENAME"
    ffmpeg -ss "$CUR_DURATION" -i "$FILE" -fs "$SIZELIMIT" $FFMPEG_ARGS "$NEXTFILENAME" -y

    # Duration of the new part
    NEW_DURATION=$(ffprobe -i "$NEXTFILENAME" -show_entries format=duration -v quiet -of default=noprint_wrappers=1:nokey=1 | cut -d. -f1)

    # Total duration encoded so far
    CUR_DURATION=$((CUR_DURATION + NEW_DURATION))

    i=$((i + 1))

    echo "Duration of $NEXTFILENAME: $NEW_DURATION"
    echo "Part No. $i starts at $CUR_DURATION"

    NEXTFILENAME="$OUTPUT_FOLDER/$BASENAME-$i.$EXTENSION"
done

echo "Video splitting complete. Files saved in $OUTPUT_FOLDER"

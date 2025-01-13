#!/bin/bash

echo "Starting gallery generation..."

# Function to create gallery for a specific folder
create_gallery() {
    local folder="$1"
    local title="$2"
    local output_file="$folder/index.html"
    local content=""

    echo "  Processing folder: $folder"

    # Handle images (excluding thumbnails)
    for img in "$folder"/*.{jpg,jpeg,png,gif}; do
        if [ -f "$img" ] && [[ ! "$img" == *"_thumb.jpg" ]]; then
            content+="        <div class=\"gallery-item\"><img src=\"$(basename "$img")\" alt=\"$(basename "$img")\"></div>\n"
            echo "    Added image: $(basename "$img")"
        fi
    done

    # Handle PDFs
    for pdf in "$folder"/*.pdf; do
        if [ -f "$pdf" ]; then
            pdf_name=$(basename "$pdf")
            echo "    Processing PDF: $pdf_name"
            # Generate thumbnail if possible
            if command -v pdftoppm &> /dev/null && command -v convert &> /dev/null; then
                thumbnail="${pdf_name%.pdf}_thumb.jpg"
                pdftoppm -jpeg -f 1 -l 1 "$pdf" | convert - -resize 200x200 "$folder/$thumbnail"
                content+="        <div class=\"gallery-item pdf-item\"><a href=\"$pdf_name\"><img src=\"$thumbnail\" alt=\"$pdf_name\"><span>$pdf_name</span></a></div>\n"
                echo "      Generated thumbnail for: $pdf_name"
            else
                content+="        <div class=\"gallery-item pdf-item\"><a href=\"$pdf_name\"><span>$pdf_name</span></a></div>\n"
                echo "      Could not generate thumbnail for: $pdf_name (pdftoppm or convert not available)"
            fi
        fi
    done

    content="<div class=\"gallery\">\n$content    </div>"
    back_button="<a href=\"../index.html\" class=\"back-button\">Back to main gallery</a>"

    sed -e "s|{TITLE}|$title|g" \
        -e "s|{CONTENT}|$content|g" \
        -e "s|{BACK_BUTTON}|$back_button|g" \
        index.template.html > "$output_file"

    echo "  Created gallery page: $output_file"
}

# Create main index.html
echo "Creating main index.html..."
main_content="<ul class=\"index-list\">"

# Loop through subdirectories and create gallery pages
echo "Processing subdirectories..."
for dir in */; do
    if [ -d "$dir" ]; then
        dir=${dir%/}
        main_content+="    <li><a href=\"$dir/index.html\">$dir</a></li>\n"
        create_gallery "$dir" "$dir Gallery"
    fi
done

# Handle PDFs in the main directory
echo "Processing PDFs in the main directory..."
for pdf in *.pdf; do
    if [ -f "$pdf" ]; then
        echo "  Processing PDF: $pdf"
        # Generate thumbnail if possible
        if command -v pdftoppm &> /dev/null && command -v convert &> /dev/null; then
            thumbnail="${pdf%.pdf}_thumb.jpg"
            pdftoppm -jpeg -f 1 -l 1 "$pdf" | convert - -resize 200x200 "$thumbnail"
            main_content+="    <li><a href=\"$pdf\" class=\"pdf-link\"><img src=\"$thumbnail\" alt=\"$pdf\"><span>$pdf</span></a></li>\n"
            echo "    Generated thumbnail for: $pdf"
        else
            main_content+="    <li><a href=\"$pdf\" class=\"pdf-link\"><span>$pdf</span></a></li>\n"
            echo "    Could not generate thumbnail for: $pdf (pdftoppm or convert not available)"
        fi
    fi
done

main_content+="</ul>"

sed -e "s|{TITLE}|FLUX.1 Gallery|g" \
    -e "s|{CONTENT}|$main_content|g" \
    -e "s|{BACK_BUTTON}||g" \
    index.template.html > index.html

echo "Main index.html has been created."
echo "Gallery pages have been generated successfully."
echo "Waiting for 2 seconds before exiting..."
sleep 2
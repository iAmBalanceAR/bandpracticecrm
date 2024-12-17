import csv
import sys
from pathlib import Path
from typing import List, Dict

def clean_csv_file(input_file: str, output_file: str):
    """
    Clean CSV file by fixing rows where address2 is followed by an erroneous null column.
    Maintains proper column count and data integrity.
    """
    # Read the input file to get header and count total rows
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)  # Get header row
        total_rows = sum(1 for _ in reader)  # Count remaining rows
    
    # Find the index of the address2 column
    try:
        address2_index = header.index('address2')
    except ValueError:
        print("Error: Could not find 'address2' column in the CSV file.")
        return
    
    expected_column_count = len(header)
    cleaned_records = []
    
    # Process the file
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header row since we already have it
        
        count = 0
        problematic_rows = 0
        
        for row in reader:
            count += 1
            
            # Check if this row has the address2 issue
            if len(row) > expected_column_count and row[address2_index]:
                # If address2 is not empty and there's an extra column
                if row[address2_index + 1] == '':  # Check if next column is empty
                    # Remove the erroneous null column
                    cleaned_row = row[:address2_index + 1] + row[address2_index + 2:]
                    problematic_rows += 1
                else:
                    cleaned_row = row[:expected_column_count]
            else:
                # If row has correct number of columns, keep as is
                cleaned_row = row[:expected_column_count]
            
            # Ensure the row has the correct number of columns
            if len(cleaned_row) == expected_column_count:
                cleaned_records.append(cleaned_row)
            
            # Progress update
            if count % 100 == 0:  # Update every 100 rows
                progress = (count / total_rows) * 100
                sys.stdout.write(f'\rProcessing records: {count}/{total_rows} ({progress:.1f}%)')
                sys.stdout.flush()
    
    # Write cleaned records to new file
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(cleaned_records)
    
    # Get file sizes for reporting
    input_size = Path(input_file).stat().st_size / (1024 * 1024)  # Convert to MB
    output_size = Path(output_file).stat().st_size / (1024 * 1024)  # Convert to MB
    
    print(f"\n\nProcessing complete:")
    print(f"Total records processed: {count}")
    print(f"Problematic rows fixed: {problematic_rows}")
    print(f"Input file size: {input_size:.2f} MB")
    print(f"Output file size: {output_size:.2f} MB")
    print(f"Cleaned file saved as: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python clean_venues_csv.py input_file.csv output_file.csv")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    if not Path(input_file).exists():
        print(f"Error: Input file '{input_file}' does not exist.")
        sys.exit(1)
    
    clean_csv_file(input_file, output_file) 